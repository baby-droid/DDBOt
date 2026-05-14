/**
 * AHMED THE TRADER — AI Brain
 * Built from "Ahmed The Trader" digit psychology methodology.
 * Covers: Over/Under rules, entry points, tick selection, digit distribution analysis.
 */

export type DigitFreq = { [digit: number]: number }; // digit → percentage (0–100)

export type TradeRecommendation = {
    trade: string;
    entryDigits: number[];
    ticks: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    conditions: string[];
    warnings: string[];
    reason: string;
    market: string;
};

// ─────────────────────────────────────────────
// RULE ENGINE — based on Ahmed's PDF methodology
// ─────────────────────────────────────────────

function mostFreqDigit(freq: DigitFreq, digits: number[]): number {
    return digits.reduce((a, b) => (freq[a] ?? 0) >= (freq[b] ?? 0) ? a : b);
}

function highestBar(freq: DigitFreq): number {
    return Object.entries(freq).reduce((a, b) => +b[1] > +freq[+a[0]] ? b : a)[0] as unknown as number;
}

function secondHighestBar(freq: DigitFreq): number {
    const sorted = Object.entries(freq).sort((a, b) => +b[1] - +a[1]);
    return +(sorted[1]?.[0] ?? 0);
}

function allBelow(freq: DigitFreq, digits: number[], threshold: number): boolean {
    return digits.every(d => (freq[d] ?? 0) < threshold);
}

function countBelow(freq: DigitFreq, digits: number[], threshold: number): number {
    return digits.filter(d => (freq[d] ?? 0) < threshold).length;
}

function isOdd(n: number): boolean { return n % 2 !== 0; }
function isEven(n: number): boolean { return n % 2 === 0; }

export function analyzeDigits(freq: DigitFreq): TradeRecommendation[] {
    const results: TradeRecommendation[] = [];

    const greenBar = highestBar(freq);   // highest frequency = green bar
    const redBar = secondHighestBar(freq); // second highest = red bar

    // ── OVER 0 ── (~90% probability, 1 tick)
    {
        const conds: string[] = [];
        const warns: string[] = [];
        let ok = true;

        if ((freq[0] ?? 0) < 10) conds.push('✅ Digit 0 below 10%');
        else { warns.push('⚠️ Digit 0 is ≥10% — avoid OVER 0'); ok = false; }

        if (greenBar === 0 || redBar === 0) { warns.push('⚠️ Green or red bar is at digit 0 — avoid'); ok = false; }
        else conds.push('✅ Green/red bar not at digit 0');

        if (isEven(greenBar)) conds.push(`✅ Green bar at even digit ${greenBar}`);
        else warns.push(`⚠️ Green bar should be at even digit (currently ${greenBar})`);

        if (ok && isEven(greenBar)) {
            results.push({
                trade: 'OVER 0',
                entryDigits: [0],
                ticks: 1,
                confidence: 'HIGH',
                conditions: conds,
                warnings: warns,
                reason: 'Digit 0 is cold (<10%), green bar at even digit. Wait for cursor to land on digit 0 and confirm it is constant (not rising/falling) before clicking OVER.',
                market: 'Volatility 10 (1s) Index',
            });
        }
    }

    // ── OVER 1 ── (~80% probability, 1–2 ticks)
    {
        const conds: string[] = [];
        const warns: string[] = [];
        let ok = true;

        if (allBelow(freq, [0, 1], 10)) conds.push('✅ Digits 0 and 1 both below 10%');
        else { warns.push('⚠️ Digits 0 and 1 must both be below 10%'); ok = false; }

        if (greenBar === 0 || greenBar === 1 || redBar === 0 || redBar === 1)
            { warns.push('⚠️ Green/red bar at digits 0 or 1 — avoid'); ok = false; }
        else conds.push('✅ Green/red bar not at 0 or 1');

        if (isOdd(greenBar)) conds.push(`✅ Green bar at odd digit ${greenBar}`);
        else warns.push(`⚠️ Green bar should be at odd digit (currently ${greenBar})`);

        if (ok && isOdd(greenBar)) {
            results.push({
                trade: 'OVER 1',
                entryDigits: [1],
                ticks: 2,
                confidence: 'HIGH',
                conditions: conds,
                warnings: warns,
                reason: 'Digits 0 & 1 are cold. Green bar on odd digit. Entry: wait for cursor to hit digit 1 — confirm digits 0 and 1 are not increasing or decreasing before clicking OVER.',
                market: 'Volatility 10 (1s) Index',
            });
        }
    }

    // ── OVER 2 ── (~70–80% probability, 2–3 ticks)
    {
        const conds: string[] = [];
        const warns: string[] = [];
        let ok = true;

        if (allBelow(freq, [0, 1, 2], 10)) conds.push('✅ Digits 0, 1, 2 all below 10%');
        else { warns.push('⚠️ Digits 0, 1, 2 must all be below 10%'); ok = false; }

        if ([0, 1, 2].includes(greenBar) || [0, 1, 2].includes(redBar))
            { warns.push('⚠️ Avoid green/red bar at digits 0, 1, or 2'); ok = false; }
        else conds.push('✅ No green/red bar at digits 0–2');

        if (isEven(greenBar)) conds.push(`✅ Green bar at even digit ${greenBar}`);
        else warns.push(`⚠️ Green bar should be at even digit`);

        const closeLook = [0, 1, 2].some(d => {
            const v = freq[d] ?? 0;
            return v > 5 && v < 10;
        });
        if (closeLook) conds.push('✅ Digits 0–2 appear stable in range');

        if (ok && isEven(greenBar)) {
            results.push({
                trade: 'OVER 2',
                entryDigits: [0, 2],
                ticks: 3,
                confidence: 'HIGH',
                conditions: conds,
                warnings: warns,
                reason: 'Digits 0, 1, 2 all cold (<10%), green bar on even digit. Entry: cursor hits digit 0 or 2 — confirm those digits are constant (not moving up or down) then click OVER. Use 2–3 ticks.',
                market: 'Volatility 25 (1s) Index',
            });
        }
    }

    // ── OVER 3 ── (2–3 ticks)
    {
        const conds: string[] = [];
        const warns: string[] = [];
        let ok = true;

        if (allBelow(freq, [0, 1, 2, 3], 10)) conds.push('✅ Digits 0–3 all below 10%');
        else { warns.push('⚠️ Digits 0, 1, 2, 3 must all be below 10%'); ok = false; }

        if ([0, 1, 2, 3].includes(greenBar) || [0, 1, 2, 3].includes(redBar))
            { warns.push('⚠️ Avoid green/red bar at digits 0–3'); ok = false; }
        else conds.push('✅ No green/red bar at digits 0–3');

        if (isOdd(greenBar) && isOdd(redBar)) conds.push(`✅ Green bar (${greenBar}) and red bar (${redBar}) both at odd digits`);
        else warns.push('⚠️ Both green and red bars should be at odd digits');

        if (ok && isOdd(greenBar) && isOdd(redBar)) {
            results.push({
                trade: 'OVER 3',
                entryDigits: [1, 3],
                ticks: 3,
                confidence: 'MEDIUM',
                conditions: conds,
                warnings: warns,
                reason: 'Digits 0–3 all cold. Green & red bars at odd digits. Entry: cursor hits digit 1 or 3 — make sure those highlighted digits are constant before clicking OVER. Use 2–3 ticks.',
                market: 'Volatility 25 (1s) Index',
            });
        }
    }

    // ── OVER 4 ── (3–5 ticks)
    {
        const conds: string[] = [];
        const warns: string[] = [];
        let ok = true;

        const below4Count = countBelow(freq, [0, 1, 2, 3, 4], 10);
        if (below4Count >= 3) conds.push(`✅ ${below4Count} of digits 0–4 below 10%`);
        else { warns.push('⚠️ At least 3 of digits 0–4 must be below 10%'); ok = false; }

        if ([0, 1, 2, 3, 4].includes(greenBar) || [0, 1, 2, 3, 4].includes(redBar))
            { warns.push('⚠️ Avoid green/red bar at digits 0–4'); ok = false; }
        else conds.push('✅ Green/red bar not at digits 0–4');

        if (isEven(greenBar) && isEven(redBar)) conds.push(`✅ Green bar (${greenBar}) and red bar (${redBar}) both at even digits`);
        else warns.push('⚠️ Both green and red bars must be at EVEN digits');

        if (ok && isEven(greenBar) && isEven(redBar)) {
            results.push({
                trade: 'OVER 4',
                entryDigits: [2, 4],
                ticks: 5,
                confidence: 'MEDIUM',
                conditions: conds,
                warnings: warns,
                reason: '3+ of digits 0–4 are cold. Green & red bars at even digits. Watch digits 0–4 closely for stability. Entry: cursor hits digit 2 or 4 — confirm those digits are not increasing or decreasing then click OVER. Use 5 ticks.',
                market: 'Volatility 50 (1s) Index',
            });
        }
    }

    // ── OVER 5 ── (~50%, 5 ticks)
    {
        const conds: string[] = [];
        const warns: string[] = [];
        let ok = true;

        const belowHalfCount = countBelow(freq, [0, 1, 2, 3, 4], 10);
        if (belowHalfCount >= 3) conds.push(`✅ ${belowHalfCount} digits below 5 are under 10%`);
        else { warns.push('⚠️ At least 3 of digits below 5 must be under 10%'); ok = false; }

        if ([0, 1, 2, 3, 4].includes(greenBar) || [0, 1, 2, 3, 4].includes(redBar))
            { warns.push('⚠️ Avoid green/red bar at digits below 5'); ok = false; }
        else conds.push('✅ Green/red bar not at digits 0–4');

        if (isOdd(greenBar) && isOdd(redBar)) conds.push(`✅ Green bar (${greenBar}) & red bar (${redBar}) at odd digits`);
        else warns.push('⚠️ Green and red bars must both be at ODD digits');

        if (ok && isOdd(greenBar) && isOdd(redBar)) {
            results.push({
                trade: 'OVER 5',
                entryDigits: [1, 3, 5],
                ticks: 5,
                confidence: 'MEDIUM',
                conditions: conds,
                warnings: warns,
                reason: 'Multiple low digits below threshold. Green & red at odd digits. Carefully watch digits below 5 for stability. Entry: cursor hits digit 1, 3, or 5 — ensure that highlighted digit is not rising or falling, then click OVER. Use 5 ticks.',
                market: 'Volatility 50 (1s) Index',
            });
        }
    }

    // ── OVER 6 ── (2–3 ticks)
    {
        const conds: string[] = [];
        const warns: string[] = [];
        let ok = true;

        if (greenBar === 8) conds.push('✅ Green bar at digit 8 (MUST — only even digit above 6)');
        else { warns.push('⚠️ Green bar MUST be at digit 8 for OVER 6. Currently not met.'); ok = false; }

        const redOnEvenBelow6 = isEven(redBar) && redBar < 6;
        if (redOnEvenBelow6) conds.push(`✅ Red bar at even digit below 6 (digit ${redBar})`);
        else warns.push('⚠️ Red bar should be on an even digit below 6');

        const above6Hot = [7, 8, 9].filter(d => (freq[d] ?? 0) >= 11).length;
        if (above6Hot >= 2) conds.push(`✅ ${above6Hot} digits above 6 have 11%+ frequency`);
        else warns.push('⚠️ Need at least 2 digits above 6 with 11%+ frequency');

        if (ok) {
            const entryDigit = mostFreqDigit(freq, [0, 2, 4]);
            results.push({
                trade: 'OVER 6',
                entryDigits: [0, 2, 4],
                ticks: 3,
                confidence: 'HIGH',
                conditions: conds,
                warnings: warns,
                reason: `Green bar at digit 8 confirms hot zone above 6. Entry: wait for moving cursor to land on digit ${entryDigit} (highest % among 0,2,4) — make sure remaining digits are constant, then run bot or click OVER. Use 2–3 ticks.`,
                market: 'Volatility 75 (1s) Index',
            });
        }
    }

    // ── OVER 7 ── (2–3 ticks)
    {
        const conds: string[] = [];
        const warns: string[] = [];
        let ok = true;

        if (greenBar === 9 || greenBar === 1) conds.push(`✅ Green bar at digit ${greenBar} (9 or 1 required)`);
        else { warns.push('⚠️ Green bar must be at digit 9 or 1 for OVER 7'); ok = false; }

        if (redBar === 5 || redBar === 3) conds.push(`✅ Red bar at digit ${redBar} (must be 5 or 3)`);
        else warns.push(`⚠️ Red bar should be at digit 5 or 3 only (currently ${redBar})`);

        const above7Increasing = [8, 9].some(d => (freq[d] ?? 0) >= 11);
        if (above7Increasing) conds.push('✅ Digits above 7 showing strong frequency (≥11%)');
        else warns.push('⚠️ Digits above 7 should be increasing rapidly');

        if (ok) {
            const entryDigit = redBar === 5 || redBar === 3 ? redBar : 5;
            results.push({
                trade: 'OVER 7',
                entryDigits: [redBar],
                ticks: 3,
                confidence: 'HIGH',
                conditions: conds,
                warnings: warns,
                reason: `Strong signal above 7. Green at ${greenBar}, red at ${redBar}. Entry: wait for moving cursor to hit digit ${entryDigit} (the red bar digit) — confirm that at least one digit above 7 is still increasing, then run bot or click OVER. Use 2–3 ticks.`,
                market: 'Volatility 100 (1s) Index',
            });
        }
    }

    return results;
}

// ─────────────────────────────────────────────
// CONVERSATIONAL KNOWLEDGE BASE
// ─────────────────────────────────────────────

export function getKnowledgeResponse(input: string): string {
    const q = input.toLowerCase();

    if (q.includes('tick') && (q.includes('how many') || q.includes('many tick') || q.includes('number of tick'))) {
        return `📊 TICK SELECTION (Ahmed's Framework):

• **Over 0 / Under 9** (~90% probability) → Use **1 tick**
  Immediate edge — avoid time exposure.

• **Over 2 / Under 7** (~70–80%) → Use **2–3 ticks**
  Allows momentum continuation — one bad digit, recovery opportunity.

• **Over 5 / Under 5** (~50%) → Use **5 ticks**
  Balanced probability — need multiple ticks for stats to play out.

More ticks = more time, more exposure. Less ticks = faster, more variance. Match your tick count to the probability of your contract.`;
    }

    if (q.includes('over 0') || q.includes('under 9')) {
        return `🎯 OVER 0 / UNDER 9 Strategy:

**Conditions for OVER 0:**
• Digit 0 must be below 10% frequency
• Avoid trade if green or red bar is at digit 0
• Green bar must be at an EVEN digit

**Entry Point:**
Click OVER when the cursor hits digit 0 — make sure digit 0 is constant (not increasing or decreasing).

**Ticks:** 1 tick (~90% probability — take it fast!)
**Market:** Volatility 10 (1s) Index recommended`;
    }

    if (q.includes('over 7')) {
        return `🎯 OVER 7 Strategy:

**Conditions:**
• Green bar MUST be at digit 9 or 1
• Red bar should be at digit 5 or 3 ONLY
• Digits above 7 (8, 9) must be increasing rapidly

**Entry Point:**
Wait for moving cursor to hit the red bar digit (5 or 3). Confirm at least one digit above 7 is still increasing, then run bot or click OVER.

**Ticks:** 2–3 ticks
**Market:** Volatility 75–100 (1s) Index`;
    }

    if (q.includes('over 6')) {
        return `🎯 OVER 6 Strategy:

**Conditions:**
• Green bar MUST be at digit 8 (the only even digit above 6)
• Red bar must be on a digit below 6 AND on an even digit
• At least 2 digits above 6 must have 11%+ frequency

**Entry Point:**
Wait for cursor to hit digit 4, 2, or 0 — choose the one with highest %. Ensure remaining digits are constant, then run bot or click OVER.

**Ticks:** 2–3 ticks
**Market:** Volatility 75 (1s) Index`;
    }

    if (q.includes('over 5') || q.includes('under 5') || q.includes('50/50') || q.includes('fifty')) {
        return `🎯 OVER 5 / UNDER 5 Strategy (50/50):

**Conditions for OVER 5:**
• At least 3 digits below 5 must be under 10%
• Avoid green/red bar at any digit below 5
• Green bar at ODD digit, red bar at ODD digit

**Entry Point:**
Click OVER when cursor hits digit 1, 3, or 5 — make sure that highlighted digit is not rising or falling.

**Ticks:** 5 ticks (balanced probability — need time for stats to play out)
**Market:** Volatility 50 (1s) Index`;
    }

    if (q.includes('over 4')) {
        return `🎯 OVER 4 Strategy:

**Conditions:**
• At least 3 of digits 0–4 must be below 10%
• Avoid green or red bar at any of digits 0,1,2,3,4
• Green bar at EVEN digit, red bar at EVEN digit
• Watch digits 0,1,2,3 closely — are they increasing or decreasing?

**Entry Point:**
Click OVER when cursor hits digit 2 or 4 — confirm those digits are not moving up or down.

**Ticks:** 3–5 ticks
**Market:** Volatility 50 (1s) Index`;
    }

    if (q.includes('over 3')) {
        return `🎯 OVER 3 Strategy:

**Conditions:**
• Digits 0, 1, 2, 3 all below 10%
• Avoid green/red bar at digits 0,1,2,3
• Green bar at ODD digit, red bar at ODD digit
• Watch digits 0,1,2,3 for increasing/decreasing trends

**Entry Point:**
Click OVER when cursor hits digit 1 or 3 — make sure those digits are constant.

**Ticks:** 2–3 ticks
**Market:** Volatility 25 (1s) Index`;
    }

    if (q.includes('over 2')) {
        return `🎯 OVER 2 Strategy:

**Conditions:**
• Digits 0, 1, 2 all below 10%
• Avoid green/red bar at digits 0, 1, or 2
• Green bar at EVEN digit
• Watch digits 0, 1, 2 for stability

**Entry Point:**
Click OVER when cursor hits digit 0 or 2 — confirm those highlighted digits are constant.

**Ticks:** 2–3 ticks
**Market:** Volatility 25 (1s) Index`;
    }

    if (q.includes('over 1')) {
        return `🎯 OVER 1 Strategy:

**Conditions:**
• Digits 0 and 1 both below 10%
• Avoid green/red bar at digits 0 or 1
• Green bar at ODD digit

**Entry Point:**
Click OVER when cursor hits digit 1 — make sure digits 0 and 1 are not increasing or decreasing.

**Ticks:** 1–2 ticks
**Market:** Volatility 10 (1s) Index`;
    }

    if (q.includes('green bar') || q.includes('red bar') || q.includes('bar mean')) {
        return `📊 Understanding Green & Red Bars:

In the digit frequency chart:
• **Green bar** = digit with HIGHEST frequency (most appearances in last N ticks)
• **Red bar** = digit with SECOND HIGHEST frequency

These bars help you identify where the market momentum is concentrated.

**Key rules by trade type:**
• Over 0, 2, 4, 6 → Green bar must be at EVEN digit
• Over 1, 3, 5, 7 → Green bar must be at ODD digit
• Over 6 → Green MUST be at digit 8 specifically
• Over 7 → Green at digit 9 or 1 (must)

⚠️ The bars show PAST distribution. They do not predict future ticks — probability stays at 10% per digit always.`;
    }

    if (q.includes('entry') || q.includes('when to enter') || q.includes('entry point')) {
        return `🎯 Ahmed's Entry Point Rules:

The "cursor" = the current moving digit on the last price tick.

**General principle:** Wait for the cursor to land on your target entry digit, then verify it is CONSTANT (not increasing or decreasing its frequency bar) before clicking.

**By trade:**
• Over 0 → Enter when cursor hits digit 0, constant
• Over 1 → Enter when cursor hits digit 1, digits 0 & 1 constant
• Over 2 → Enter when cursor hits digit 0 or 2, those are constant
• Over 3 → Enter when cursor hits digit 1 or 3, constant
• Over 4 → Enter when cursor hits digit 2 or 4, constant
• Over 5 → Enter when cursor hits digit 1, 3, or 5, constant
• Over 6 → Enter when cursor hits digit 0, 2, or 4 (highest %)
• Over 7 → Enter when cursor hits the red bar digit (5 or 3), with one digit above 7 increasing`;
    }

    if (q.includes('market') && (q.includes('best') || q.includes('which') || q.includes('choose'))) {
        return `📊 Market Selection Guide (Ahmed's Method):

• **Volatility 10 (1s)** → Slow ticks, best for beginners. Use for Over 0, Over 1 (high probability trades). Easier to observe digit stability.

• **Volatility 25 (1s)** → Moderate speed. Use for Over 2, Over 3. Good balance of speed and analysis time.

• **Volatility 50 (1s)** → Medium-fast. Use for Over 4, Over 5 (50/50 trades).

• **Volatility 75 (1s)** → Fast. Use for Over 6. Requires quick entries.

• **Volatility 100 (1s)** → Very fast. Use for Over 7. Only for experienced traders — fast ticks increase emotional pressure.

⚠️ Start on lower volatility. Higher speed = less time to analyse = more impulsive decisions.`;
    }

    if (q.includes('martingale') || q.includes('recovery') || q.includes('double')) {
        return `⚠️ Martingale Warning (Ahmed's Advice):

Martingale = doubling stake after each loss: $1 → $2 → $4 → $8 → $16...

**The danger:** One extended losing streak wipes your account. Digit markets move fast, which amplifies emotional decisions.

**Ahmed's rule:** Never exceed 2% of account balance per trade. If using martingale, set a hard stop at 3–5 steps maximum.

**Better approach:** Observe 50 ticks first. Count wins and losses from your entry digit. Only enter when conditions are clearly met — no emotional escalation.

**Risk management:** Account $100 → Max stake $2 per trade.`;
    }

    if (q.includes('gambler') || q.includes('bias') || q.includes('psychology') || q.includes('emotion')) {
        return `🧠 Digit Psychology (Ahmed's Framework):

**Gambler's Fallacy** — "Digit 8 appeared 5 times, it must stop."
Reality: Every tick is independent. Probability stays at 10% always.

**Recency Bias** — "Even keeps losing, I'll switch to Odd."
Reality: Even/Odd remains ~50/50 regardless of recent sequence.

**Emotional Escalation** — Losing → doubling stake → account wipe.
Solution: Fixed stakes, observe first, enter only on signal.

**Ahmed's framework:**
1. Define risk (2% max per trade)
2. Observe 50 ticks before entering — count wins/losses from your entry digit
3. Enter ONLY when all predefined conditions are met
4. Never change strategy mid-session due to emotion`;
    }

    if (q.includes('observe') || q.includes('count') || q.includes('before trading')) {
        return `👁️ Observation Phase (Ahmed's Method):

Before entering any trade:

1. **Watch 50 ticks without trading** — note digit frequencies
2. **Count ticks from the winning side** — e.g. for Under 7, count ticks where digit was 0–6. How many wins? How many losses?
3. **Choose your entry digit** — check its frequency of wins vs losses
4. **Apply the concept of ticks** — give your trade enough time for stats to express

Example: Trading Over 6
→ Count last 20 ticks where price was ≤6 (losses)
→ Identify which of those digits (0,2,4) had the highest frequency
→ Wait for cursor to land there and confirm digits are stable
→ THEN enter with 2–3 ticks`;
    }

    if (q.includes('digit distribution') || q.includes('frequency') || q.includes('analyse') || q.includes('analyze')) {
        return `📊 Use the Market Analyzer above!

Click "🔬 Analyze Market" to open the digit input panel. Enter the current % for each digit 0–9 from your Deriv Analysis Tool screen, and I will:

✅ Identify which Over/Under trade is valid
✅ Tell you the exact entry digit to wait for
✅ Recommend the tick count
✅ List all conditions met or failed
✅ Give you the specific entry instruction

This is Ahmed's complete methodology applied in real time.`;
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
        return `👋 Welcome to AHMED AI — your digit trading assistant!

I'm trained on Ahmed The Trader's complete digit psychology methodology. I can help you:

• 🔬 **Analyze digit distributions** — input frequencies, get trade signal
• 🎯 **Learn Over/Under rules** — Over 0 through Over 7
• ⏱️ **Choose tick count** — based on contract probability
• 🧠 **Understand digit psychology** — avoid gambler's fallacy & emotional traps
• 📊 **Select the right market** — match volatility to your strategy

Ask me anything, or use "🔬 Analyze Market" to get a live recommendation!`;
    }

    // Default comprehensive response
    return `🤖 AHMED AI — Trained on Ahmed The Trader's Methodology

I can answer specific questions about:

📌 **Strategies** — "How do I trade Over 6?" / "Explain Over 7"
📌 **Entry points** — "When do I enter?" / "What is the entry for Over 5?"
📌 **Tick selection** — "How many ticks for Over 2?"
📌 **Market selection** — "Which market is best?"
📌 **Digit bars** — "What do green and red bars mean?"
📌 **Psychology** — "What is gambler's fallacy?"
📌 **Risk** — "How do I manage martingale risk?"
📌 **Analysis** — Use the 🔬 Analyze Market button with real digit %s

Try asking: "How do I trade Over 7?" or open the Analyzer!`;
}
