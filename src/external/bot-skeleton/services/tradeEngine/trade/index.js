import { applyMiddleware, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { localize } from '@deriv-com/translations';
import { createError } from '../../../utils/error';
import { observer as globalObserver } from '../../../utils/observer';
import { api_base } from '../../api/api-base';
import { checkBlocksForProposalRequest, doUntilDone } from '../utils/helpers';
import { expectInitArg } from '../utils/sanitize';
import { proposalsReady, start } from './state/actions';
import * as constants from './state/constants';
import rootReducer from './state/reducers';
import Balance from './Balance';
import OpenContract from './OpenContract';
import Proposal from './Proposal';
import Purchase from './Purchase';
import Sell from './Sell';
import Ticks from './Ticks';
import Total from './Total';

/* ─────────────────────────────────────────────────────────────────────────────
 * watchBefore — waits for proposalsReady WITHOUT a tick gate.
 *
 * The original code used `prevTick` to gate all state checks, meaning the bot
 * would not act on a PROPOSALS_READY dispatch until the NEXT market tick arrived.
 * For direct-purchase contracts this adds 0.5–2 s of pointless latency per trade.
 * Removing the tick gate here makes every purchase fire the instant proposals (or
 * the direct-buy shortcut) are ready.
 * ───────────────────────────────────────────────────────────────────────────── */
const watchBefore = store => {
    if (store.getState().scope === constants.DURING_PURCHASE) {
        return Promise.resolve(false);
    }

    /* Immediate check — if proposals are already ready, resolve now */
    const snapshot = store.getState();
    if (snapshot.scope === constants.BEFORE_PURCHASE && snapshot.proposalsReady) {
        return Promise.resolve(true);
    }

    return new Promise(resolve => {
        const unsubscribe = store.subscribe(() => {
            const state = store.getState();
            if (state.scope === constants.BEFORE_PURCHASE && state.proposalsReady) {
                unsubscribe();
                resolve(true);
            } else if (state.scope === constants.DURING_PURCHASE) {
                unsubscribe();
                resolve(false);
            }
        });
    });
};

/* ─────────────────────────────────────────────────────────────────────────────
 * watchDuring — waits for contract to settle. Keeps tick-gate so we don't
 * spam checks while an open contract is in flight.
 * ───────────────────────────────────────────────────────────────────────────── */
let prevTick;
const watchDuring = store => {
    if (store.getState().scope === constants.STOP) {
        return Promise.resolve(false);
    }

    return new Promise(resolve => {
        const unsubscribe = store.subscribe(() => {
            const newState = store.getState();

            if (newState.newTick === prevTick) return;
            prevTick = newState.newTick;

            if (newState.scope === constants.DURING_PURCHASE && newState.openContract) {
                unsubscribe();
                resolve(true);
            }

            if (newState.scope === constants.STOP) {
                unsubscribe();
                resolve(false);
            }
        });
    });
};

export default class TradeEngine extends Balance(Purchase(Sell(OpenContract(Proposal(Ticks(Total(class {}))))))) {
    constructor($scope) {
        super();
        this.observer = $scope.observer;
        this.$scope = $scope;
        this.observe();
        this.data = {
            contract: {},
            proposals: [],
        };
        this.subscription_id_for_accumulators = null;
        this.is_proposal_requested_for_accumulators = false;
        this.store = createStore(rootReducer, applyMiddleware(thunk));
    }

    init(...args) {
        const [token, options] = expectInitArg(args);
        const { symbol } = options;

        this.initArgs = args;
        this.options = options;
        this.startPromise = this.loginAndGetBalance(token);

        if (!this.checkTicksPromiseExists()) this.watchTicks(symbol);
    }

    start(tradeOptions) {
        if (!this.options) {
            throw createError('NotInitialized', localize('Bot.init is not called'));
        }

        globalObserver.emit('bot.running');

        const validated_trade_options = this.validateTradeOptions(tradeOptions);

        this.tradeOptions = { ...validated_trade_options, symbol: this.options.symbol };
        this.store.dispatch(start());
        this.checkLimits(validated_trade_options);

        this.makeDirectPurchaseDecision();
    }

    loginAndGetBalance(token) {
        if (this.token === token) {
            return Promise.resolve();
        }
        this.accountInfo = api_base.account_info;
        this.token = api_base.token;
        return new Promise(resolve => {
            /*
             * Backup recovery: if a "sell" transaction arrives but the
             * proposal_open_contract update never does, poll after 200ms
             * (was 1500ms — trimmed to reduce end-of-trade latency).
             */
            const subscription = api_base.api.onMessage().subscribe(({ data }) => {
                if (data.msg_type === 'transaction' && data.transaction.action === 'sell') {
                    this.transaction_recovery_timeout = setTimeout(() => {
                        const { contract } = this.data;
                        const is_same_contract = contract.contract_id === data.transaction.contract_id;
                        const is_open_contract = contract.status === 'open';
                        if (is_same_contract && is_open_contract) {
                            doUntilDone(() => {
                                api_base.api.send({ proposal_open_contract: 1, contract_id: contract.contract_id });
                            }, ['PriceMoved']);
                        }
                    }, 200);
                }
                resolve();
            });
            api_base.pushSubscription(subscription);
        });
    }

    observe() {
        this.observeOpenContract();
        this.observeBalance();
        this.observeProposals();
    }

    watch(watchName) {
        if (watchName === 'before') {
            return watchBefore(this.store);
        }
        return watchDuring(this.store);
    }

    makeDirectPurchaseDecision() {
        const { has_payout_block, is_basis_payout } = checkBlocksForProposalRequest();
        this.is_proposal_subscription_required = has_payout_block || is_basis_payout;

        if (this.is_proposal_subscription_required) {
            this.makeProposals({ ...this.options, ...this.tradeOptions });
            this.checkProposalReady();
        } else {
            this.store.dispatch(proposalsReady());
        }
    }
}
