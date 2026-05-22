import { LogTypes } from '../../../constants/messages';
import { observer as globalObserver } from '../../../utils/observer';
import { api_base } from '../../api/api-base';
import { contractStatus, log } from '../utils/broadcast';
import { doUntilDone, recoverFromError } from '../utils/helpers';
import { DURING_PURCHASE } from './state/constants';

export default Engine =>
    class Sell extends Engine {
        isSellAtMarketAvailable() {
            return this.contractId && !this.isSold && this.isSellAvailable && !this.isExpired;
        }

        sellAtMarket() {
            globalObserver.emit('bot.sell');

            if (this.store.getState().scope !== DURING_PURCHASE) {
                return Promise.resolve();
            }

            if (!this.isSellAtMarketAvailable()) {
                log(LogTypes.NOT_OFFERED);
                return Promise.resolve();
            }

            let delay_index = 1;

            return new Promise(resolve => {
                const onContractSold = sell_response => {
                    delay_index = 1;
                    if (sell_response?.sell) {
                        log(LogTypes.SELL, { sold_for: sell_response.sell.sold_for });
                    }
                    contractStatus('purchase.sold');
                    this.waitForAfter();
                    resolve();
                };

                const contract_id = this.contractId;

                const sellContract = () => {
                    return doUntilDone(() => api_base.api.send({ sell: contract_id, price: 0 }))
                        .catch(e => {
                            const error = e.error;

                            /* Contract expired close to expiry — let it settle naturally */
                            if (error.code === 'InvalidOfferings') {
                                return Promise.resolve();
                            }

                            const sell_error = {
                                name: error.code,
                                message: error.message,
                                msg_type: e.msg_type,
                                error: { ...error.error },
                            };

                            if (error.code === 'RateLimit') {
                                return Promise.reject(sell_error);
                            }

                            /* For all other errors: check if the contract was already sold
                             * (race condition where the contract expired while we tried to sell) */
                            return doUntilDone(() =>
                                api_base.api.send({ proposal_open_contract: 1, contract_id })
                            ).then(poc_res => {
                                const { proposal_open_contract } = poc_res;
                                if (!proposal_open_contract.is_sold) {
                                    return Promise.reject(sell_error);
                                }
                                /* Contract already closed — mirror as a successful sell */
                                return Promise.resolve({
                                    sell: { sold_for: proposal_open_contract.sell_price },
                                });
                            });
                        });
                };

                const errors_to_ignore = ['NoOpenPosition', 'InvalidSellContractProposal', 'UnrecognisedRequest'];

                if (!this.options.timeMachineEnabled) {
                    return doUntilDone(sellContract, errors_to_ignore)
                        .then(sell_response => onContractSold(sell_response))
                        .catch(error => error);
                }

                const recoverFn = (_error_code, makeDelay) =>
                    makeDelay().then(() => this.observer.emit('REVERT', 'during'));

                return recoverFromError(sellContract, recoverFn, errors_to_ignore, delay_index++).then(
                    sell_response => onContractSold(sell_response)
                );
            });
        }
    };
