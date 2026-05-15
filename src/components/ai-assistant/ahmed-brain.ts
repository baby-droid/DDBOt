/**
 * AHMED THE TRADER — AI Brain v2
 * Sources:
 *  • Ahmed The Trader PDF — Over 0–7 rules, entry points, tick framework
 *  • Deriv Digit Correlation & Tick Psychology Research PDF
 *  • Markets of Under PDF — Under 5–9 exact rules
 *
 * NOTE: Green bar = HIGHEST frequency digit. Red bar = LOWEST frequency digit.
 */

export type DigitFreq = { [digit: number]: number };

export type TradeRecommendation = {
    trade: string;
    entryDigits: number[];
    ticks: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    conditions: string[];
    warnings: string[];
    reason: string;
    market: string;
    riskLevel: 'Low' | 'Medium' | 'High';
};

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function sortedByFreq(freq: DigitFreq): [number, number][] {
    return Object.entries(freq)
        .map(([d, v]) => [+d, +v] as [number, number])
        .sort((a, b) => b[1] - a[1]);
}

export function greenBar(freq: DigitFreq): number {
    return sortedByFreq(freq)[0][0]; // highest %
}

export function redBar(freq: DigitFreq): number {
    const sorted = sortedByFreq(freq);
    return sorted[sorted.length - 1][0]; // lowest %
}

function secondHighest(freq: DigitFreq): number {
    return sortedByFreq(freq)[1][0];
}

function allBelow(freq: DigitFreq, digits: number[], threshold: number): boolean {
    return digits.every(d => (freq[d] ?? 0) < threshold);
}

function countBelow(freq: DigitFreq, digits: number[], threshold: number): number {
    return digits.filter(d => (freq[d] ?? 0) < threshold).length;
}

function isOdd(n: number): boolean { return n % 2 !== 0; }
function isEven(n: number): boolean { return n % 2 === 0; }

function aboveThreshold(freq: DigitFreq, digit: number, threshold: number): boolean {
    return (freq[digit] ?? 0) >= threshold;
}

// ─────────────────────────────────────────────────────────────────
// CORRELATION DETECTION
// ─────────────────────────────────────────────────────────────────

export type MarketPattern = 'HIGH_DIGIT_EXHAUSTION' | 'LOW_DIGIT_EXHAUSTION' | 'STAIRCASE_UP' | 'VELOCITY_TRAP' | 'BALANCED' | 'MIXED';

export function detectPattern(freq: DigitFreq): { pattern: MarketPattern; description: string } {
    const highPressure = [7, 8, 9].reduce((s, d) => s + (freq[d] ?? 0), 0);
    const lowPressure = [0, 1, 2].reduce((s, d) => s + (freq[d] ?? 0), 0);
    const midPressure = [3, 4, 5, 6].reduce((s, d) => s + (freq[d] ?? 0), 0);

    const hot89 = [8, 9].filter(d => (freq[d] ?? 0) >= 13).length;
    const hot789 = [7, 8, 9].filter(d => (freq[d] ?? 0) >= 12).length;
    const exhausted012 = [0, 1, 2].filter(d => (freq[d] ?? 0) <= 7).length;

    if (hot89 >= 2 || (hot789 >= 2 && highPressure > 36)) {
        return { pattern: 'VELOCITY_TRAP', description: 'Fast 7-8-9 clustering — velocity trap. UNDER 6 setup forming.' };
    }
    if (highPressure > 35 && lowPressure < 22) {
        return { pattern: 'HIGH_DIGIT_EXHAUSTION', description: 'High digits (7,8,9) overheating. Mirror reversal into 0-2 expected. Look for UNDER 6-7.' };
    }
    if (lowPressure > 35 && highPressure < 22) {
        return { pattern: 'LOW_DIGIT_EXHAUSTION', description: 'Low digits (0,1,2) exhausted. Reversal up expected. Look for OVER 3-4.' };
    }
    if (midPressure > 45 && Math.abs(highPressure - lowPressure) < 5) {
        return { pattern: 'STAIRCASE_UP', description: 'Mid-range digits (3-6) dominant — momentum continuation. OVER 5 staircase setup possible.' };
    }
    if (Math.abs(highPressure - lowPressure) < 6 && Math.abs(highPressure - midPressure) < 6) {
        return { pattern: 'BALANCED', description: 'Market is balanced — no strong directional pressure. Wait for imbalance before trading.' };
    }
    return { pattern: 'MIXED', description: 'Mixed signals. Observe 10 more ticks before entering.' };
}

// ─────────────────────────────────────────────────────────────────
// OVER RULE ENGINE (Over 0 – Over 7)
// ─────────────────────────────────────────────────────────────────

function analyzeOver(freq: DigitFreq): TradeRecommendation[] {
    const results: TradeRecommendation[] = [];
    const gb = greenBar(freq);
    const rb = redBar(freq);

    // ── OVER 0 (1 tick, Low risk) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if ((freq[0] ?? 0) < 10) conds.push('✅ Digit 0 below 10%');
        else { warns.push('⚠️ Digit 0 must be below 10%'); ok = false; }
        if (gb === 0 || rb === 0) { warns.push('⚠️ Green/red bar at digit 0 — avoid'); ok = false; }
        else conds.push('✅ No green/red bar at digit 0');
        if (isEven(gb)) conds.push(`✅ Green bar at even digit ${gb}`);
        else warns.push(`⚠️ Green bar should be at even digit (currently ${gb})`);
        if (ok && isEven(gb)) results.push({ trade: 'OVER 0', entryDigits: [0], ticks: 1, confidence: 'HIGH', conditions: conds, warnings: warns, reason: 'Digit 0 is cold (<10%), green bar at even digit. Wait for cursor to hit digit 0 and confirm it is stable before clicking OVER.', market: 'Volatility 10 (1s) Index', riskLevel: 'Low' });
    }

    // ── OVER 1 (1–2 ticks, Low risk — STRONG OVER) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if (allBelow(freq, [0, 1], 10)) conds.push('✅ Digits 0 & 1 both below 10%');
        else { warns.push('⚠️ Digits 0 and 1 must both be below 10%'); ok = false; }
        if (gb === 0 || gb === 1 || rb === 0 || rb === 1) { warns.push('⚠️ Green/red bar at digits 0 or 1 — avoid'); ok = false; }
        else conds.push('✅ Green/red bar not at 0 or 1');
        if (isOdd(gb)) conds.push(`✅ Green bar at odd digit ${gb}`);
        else warns.push(`⚠️ Green bar should be at odd digit`);
        if (ok && isOdd(gb)) results.push({ trade: 'OVER 1 ⭐', entryDigits: [1], ticks: 2, confidence: 'HIGH', conditions: conds, warnings: warns, reason: 'STRONG OVER setup. Digits 0 & 1 cold, green bar on odd digit. Entry: cursor hits digit 1, confirm digits 0 & 1 are constant. 1–2 ticks safest. Best for Volatility 10 (1s).', market: 'Volatility 10 (1s) Index', riskLevel: 'Low' });
    }

    // ── OVER 2 (2–4 ticks, Medium) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if (allBelow(freq, [0, 1, 2], 10)) conds.push('✅ Digits 0, 1, 2 all below 10%');
        else { warns.push('⚠️ Digits 0, 1, 2 must all be below 10%'); ok = false; }
        if ([0, 1, 2].includes(gb) || [0, 1, 2].includes(rb)) { warns.push('⚠️ Avoid green/red bar at digits 0–2'); ok = false; }
        else conds.push('✅ No green/red bar at digits 0–2');
        if (isEven(gb)) conds.push(`✅ Green bar at even digit ${gb}`);
        else warns.push(`⚠️ Green bar should be at even digit`);
        if (ok && isEven(gb)) results.push({ trade: 'OVER 2', entryDigits: [0, 2], ticks: 3, confidence: 'HIGH', conditions: conds, warnings: warns, reason: 'Digits 0,1,2 cold. Green bar on even digit. Entry: cursor hits 0 or 2, confirm constant. 2–4 ticks.', market: 'Volatility 25 (1s) Index', riskLevel: 'Medium' });
    }

    // ── OVER 3 (2–4 ticks, Medium — STRONG OVER) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if (allBelow(freq, [0, 1, 2, 3], 10)) conds.push('✅ Digits 0–3 all below 10%');
        else { warns.push('⚠️ Digits 0–3 must all be below 10%'); ok = false; }
        if ([0, 1, 2, 3].includes(gb) || [0, 1, 2, 3].includes(rb)) { warns.push('⚠️ No green/red bar at digits 0–3'); ok = false; }
        else conds.push('✅ Green/red bar not at digits 0–3');
        if (isOdd(gb) && isOdd(rb)) conds.push(`✅ Green (${gb}) and red (${rb}) bars at odd digits`);
        else warns.push('⚠️ Both green and red bars must be at odd digits');
        if (ok && isOdd(gb) && isOdd(rb)) results.push({ trade: 'OVER 3 ⭐', entryDigits: [1, 3], ticks: 3, confidence: 'MEDIUM', conditions: conds, warnings: warns, reason: 'STRONG OVER. Digits 0–3 cold. Green & red at odd digits. Entry: cursor hits 1 or 3, constant. 2–4 ticks.', market: 'Volatility 25 (1s) Index', riskLevel: 'Medium' });
    }

    // ── OVER 4 (3–4 ticks, Medium — STRONG OVER) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        const belowCount = countBelow(freq, [0, 1, 2, 3, 4], 10);
        if (belowCount >= 3) conds.push(`✅ ${belowCount} of digits 0–4 below 10%`);
        else { warns.push('⚠️ At least 3 of digits 0–4 must be below 10%'); ok = false; }
        if ([0, 1, 2, 3, 4].includes(gb) || [0, 1, 2, 3, 4].includes(rb)) { warns.push('⚠️ Avoid green/red bar at digits 0–4'); ok = false; }
        else conds.push('✅ Green/red bar not at digits 0–4');
        if (isEven(gb) && isEven(rb)) conds.push(`✅ Green (${gb}) and red (${rb}) bars at even digits`);
        else warns.push('⚠️ Both green and red bars must be at EVEN digits');
        if (ok && isEven(gb) && isEven(rb)) results.push({ trade: 'OVER 4 ⭐', entryDigits: [2, 4], ticks: 4, confidence: 'MEDIUM', conditions: conds, warnings: warns, reason: 'STRONG OVER. Low-digit exhaustion. Entry: cursor hits 2 or 4, constant. 3–4 ticks. Also a strong entry after low-digit cluster (0,1,2 domination).', market: 'Volatility 50 (1s) Index', riskLevel: 'Medium' });
    }

    // ── OVER 5 (2–3 ticks, High — aggressive momentum) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        const belowHalf = countBelow(freq, [0, 1, 2, 3, 4], 10);
        if (belowHalf >= 3) conds.push(`✅ ${belowHalf} digits below 5 are under 10%`);
        else { warns.push('⚠️ At least 3 digits below 5 must be under 10%'); ok = false; }
        if ([0, 1, 2, 3, 4].includes(gb) || [0, 1, 2, 3, 4].includes(rb)) { warns.push('⚠️ Avoid green/red bar at digits 0–4'); ok = false; }
        else conds.push('✅ Green/red bar not at digits 0–4');
        if (isOdd(gb) && isOdd(rb)) conds.push(`✅ Green (${gb}) and red (${rb}) bars at odd digits`);
        else warns.push('⚠️ Green and red bars must both be at ODD digits');
        if (ok && isOdd(gb) && isOdd(rb)) results.push({ trade: 'OVER 5', entryDigits: [1, 3, 5], ticks: 3, confidence: 'MEDIUM', conditions: conds, warnings: warns, reason: 'Aggressive momentum entry. Best used on staircase patterns (2→3→4→5→6). Entry: cursor hits 1, 3, or 5 — constant. 2–3 ticks.', market: 'Volatility 50 (1s) Index', riskLevel: 'High' });
    }

    // ── OVER 6 (2–3 ticks, High) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if (gb === 8) conds.push('✅ Green bar at digit 8 (must — only even digit above 6)');
        else { warns.push(`⚠️ Green bar MUST be at digit 8 for OVER 6 (currently ${gb})`); ok = false; }
        const redOnEvenBelow6 = isEven(rb) && rb < 6;
        if (redOnEvenBelow6) conds.push(`✅ Red bar at even digit below 6 (digit ${rb})`);
        else warns.push('⚠️ Red bar should be on an even digit below 6');
        const above6Hot = [7, 8, 9].filter(d => (freq[d] ?? 0) >= 11).length;
        if (above6Hot >= 2) conds.push(`✅ ${above6Hot} digits above 6 at 11%+`);
        else warns.push('⚠️ Need 2+ digits above 6 at 11%+');
        if (ok) {
            const entryFreqs = [0, 2, 4].map(d => freq[d] ?? 0);
            const bestEntry = [0, 2, 4][entryFreqs.indexOf(Math.max(...entryFreqs))];
            results.push({ trade: 'OVER 6', entryDigits: [0, 2, 4], ticks: 3, confidence: 'HIGH', conditions: conds, warnings: warns, reason: `Green bar at 8 (dominant even above 6). Entry: cursor hits digit ${bestEntry} (highest % among 0,2,4) — confirm remaining digits are constant. 2–3 ticks.`, market: 'Volatility 75 (1s) Index', riskLevel: 'High' });
        }
    }

    // ── OVER 7 (2–3 ticks, High) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if (gb === 9 || gb === 1) conds.push(`✅ Green bar at digit ${gb} (9 or 1 required)`);
        else { warns.push(`⚠️ Green bar must be at digit 9 or 1 (currently ${gb})`); ok = false; }
        if (rb === 5 || rb === 3) conds.push(`✅ Red bar at digit ${rb} (5 or 3 required)`);
        else warns.push(`⚠️ Red bar must be 5 or 3 (currently ${rb})`);
        const above7Strong = [8, 9].some(d => (freq[d] ?? 0) >= 11);
        if (above7Strong) conds.push('✅ Digits 8/9 at 11%+ (rapidly increasing above 7)');
        else warns.push('⚠️ Digits above 7 must be increasing rapidly');
        if (ok) {
            const entryDigit = (rb === 5 || rb === 3) ? rb : 5;
            results.push({ trade: 'OVER 7', entryDigits: [entryDigit], ticks: 3, confidence: 'HIGH', conditions: conds, warnings: warns, reason: `Green at ${gb}, red at ${rb}. Entry: cursor hits digit ${entryDigit} (red bar) — confirm at least one digit above 7 is still increasing. 2–3 ticks.`, market: 'Volatility 100 (1s) Index', riskLevel: 'High' });
        }
    }

    return results;
}

// ─────────────────────────────────────────────────────────────────
// UNDER RULE ENGINE (Under 5 – Under 9) — from markets_of_under PDF
// ─────────────────────────────────────────────────────────────────

function analyzeUnder(freq: DigitFreq): TradeRecommendation[] {
    const results: TradeRecommendation[] = [];

    // ── UNDER 9 (1–2 ticks, Low — STRONG UNDER) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if ((freq[9] ?? 0) < 10) conds.push('✅ Digit 9 below 10%');
        else { warns.push('⚠️ Digit 9 must be below 10%'); ok = false; }
        const gbVal = greenBar(freq), rbVal = redBar(freq);
        if (gbVal === 9 || rbVal === 9) { warns.push('⚠️ Green/red bar at digit 9 — avoid'); ok = false; }
        else conds.push('✅ No green/red bar at digit 9');
        if (ok) results.push({ trade: 'UNDER 9 ⭐', entryDigits: [9, 0], ticks: 1, confidence: 'HIGH', conditions: conds, warnings: warns, reason: 'STRONG UNDER (safest). Digit 9 cold (<10%). Entry: cursor hits digit 9 or 0, confirm 9 is stable (not rising). Plain index: 1 tick. 1s index: 2 ticks.', market: 'Volatility 50 Index', riskLevel: 'Low' });
    }

    // ── UNDER 8 (2–3 ticks, Low) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if (allBelow(freq, [8, 9], 10)) conds.push('✅ Digits 8 & 9 both below 10%');
        else { warns.push('⚠️ Digits 8 and 9 must both be below 10%'); ok = false; }
        if (aboveThreshold(freq, 7, 10.3)) conds.push(`✅ Digit 7 at ${(freq[7] ?? 0).toFixed(1)}% — acts as shield (need ≥10.3%)`);
        else warns.push('⚠️ Digit 7 must be ≥10.3% to provide shield');
        if (ok) {
            const entryDigits: number[] = [];
            if (aboveThreshold(freq, 7, 10.4)) { entryDigits.push(7); conds.push(`✅ Entry at digit 7 valid (${(freq[7] ?? 0).toFixed(1)}% ≥ 10.4%)`); }
            if (aboveThreshold(freq, 4, 10.5)) { entryDigits.push(4); conds.push(`✅ Entry at digit 4 valid (${(freq[4] ?? 0).toFixed(1)}% ≥ 10.5%)`); }
            if (aboveThreshold(freq, 6, 10.2)) { entryDigits.push(6); conds.push(`✅ Entry at digit 6 valid (${(freq[6] ?? 0).toFixed(1)}% ≥ 10.2%)`); }
            entryDigits.push(9, 0, 1);
            if (entryDigits.length > 3) results.push({ trade: 'UNDER 8', entryDigits: [...new Set(entryDigits)], ticks: 2, confidence: 'HIGH', conditions: conds, warnings: warns, reason: 'Digits 8 & 9 cold, digit 7 ≥10.3% provides shield. Entry: wait for cursor at entry digits listed. 2–3 ticks.', market: 'Volatility 50 Index', riskLevel: 'Low' });
            else warns.push('⚠️ Insufficient valid entry digits — not enough shield strength');
        }
    }

    // ── UNDER 7 (2–3 ticks, Medium) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if (allBelow(freq, [7, 8, 9], 10)) conds.push('✅ Digits 7, 8, 9 all below 10%');
        else { warns.push('⚠️ Digits 7, 8, 9 must all be below 10%'); ok = false; }
        if (aboveThreshold(freq, 6, 10.3)) conds.push(`✅ Digit 6 at ${(freq[6] ?? 0).toFixed(1)}% — shield (need ≥10.3%)`);
        else warns.push('⚠️ Digit 6 must be ≥10.3% to provide shield');
        if (ok) {
            const entryDigits: number[] = [];
            if (aboveThreshold(freq, 7, 10.0)) { entryDigits.push(7); conds.push('✅ Digit 7 valid entry (above average)'); }
            if (aboveThreshold(freq, 4, 10.5)) { entryDigits.push(4); conds.push(`✅ Digit 4 entry valid (${(freq[4] ?? 0).toFixed(1)}% ≥ 10.5%)`); }
            if (aboveThreshold(freq, 6, 10.2)) { entryDigits.push(6); conds.push(`✅ Digit 6 entry valid`); }
            entryDigits.push(9, 0, 1);
            results.push({ trade: 'UNDER 7', entryDigits: [...new Set(entryDigits)], ticks: 3, confidence: 'MEDIUM', conditions: conds, warnings: warns, reason: 'Digits 7, 8, 9 cold. Digit 6 ≥10.3% acts as shield. Entry: cursor hits entry digits listed. 2–3 ticks.', market: 'Volatility 75 Index', riskLevel: 'Medium' });
        }
    }

    // ── UNDER 6 (5 ticks, Medium — STRONG UNDER + exhaustion entry) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if (allBelow(freq, [6, 7, 8, 9], 10)) conds.push('✅ Digits 6, 7, 8, 9 all below 10%');
        else { warns.push('⚠️ Digits 6, 7, 8, 9 must all be below 10%'); ok = false; }
        if (aboveThreshold(freq, 5, 10.3)) conds.push(`✅ Digit 5 at ${(freq[5] ?? 0).toFixed(1)}% — shield (need ≥10.3%)`);
        else warns.push('⚠️ Digit 5 must be ≥10.3% to provide shield');
        const highPressure = [7, 8, 9].reduce((s, d) => s + (freq[d] ?? 0), 0);
        if (highPressure > 30) { conds.push(`✅ High-digit pressure detected (${highPressure.toFixed(1)}%) — velocity/exhaustion signal`); }
        if (ok) {
            const entryDigits: number[] = [];
            if (aboveThreshold(freq, 7, 10.0)) entryDigits.push(7);
            if (aboveThreshold(freq, 4, 10.5)) entryDigits.push(4);
            if (aboveThreshold(freq, 6, 10.2)) entryDigits.push(6);
            entryDigits.push(9, 0, 1);
            results.push({ trade: 'UNDER 6 ⭐', entryDigits: [...new Set(entryDigits)], ticks: 5, confidence: 'HIGH', conditions: conds, warnings: warns, reason: 'STRONG UNDER. Digits 6–9 cold, digit 5 acts as shield. Also triggered by high-digit velocity trap (7,8,9 clustering). Entry: cursor hits listed digits. 5 ticks for exhaustion reversals.', market: 'Volatility 100 Index', riskLevel: 'Medium' });
        }
    }

    // ── UNDER 5 (3–5 ticks, High) ──
    {
        const conds: string[] = [], warns: string[] = [];
        let ok = true;
        if (allBelow(freq, [5, 6, 7, 8, 9], 10)) conds.push('✅ Digits 5–9 all below 10%');
        else { warns.push('⚠️ Digits 5–9 must all be below 10%'); ok = false; }
        const shieldDigits = [0, 1, 2].filter(d => aboveThreshold(freq, d, 10.3));
        if (shieldDigits.length >= 1) conds.push(`✅ Digits ${shieldDigits.join(',')} at 10.3%+ (shield)`);
        else warns.push('⚠️ Digits 0, 1, or 2 must be ≥10.3% for shield');
        if (ok) {
            const entryDigits: number[] = [];
            if (aboveThreshold(freq, 7, 10.0)) entryDigits.push(7);
            if (aboveThreshold(freq, 4, 10.5)) entryDigits.push(4);
            if (aboveThreshold(freq, 6, 10.2)) entryDigits.push(6);
            entryDigits.push(9, 0, 1);
            results.push({ trade: 'UNDER 5', entryDigits: [...new Set(entryDigits)], ticks: 5, confidence: 'MEDIUM', conditions: conds, warnings: warns, reason: 'Aggressive reversal. Digits 5–9 all cold, low digits (0,1,2) dominant as shield. Entry: cursor at listed digits. 3–5 ticks for full statistical distribution.', market: 'Volatility 100 (1s) Index', riskLevel: 'High' });
        }
    }

    return results;
}

// ─────────────────────────────────────────────────────────────────
// MAIN ANALYSIS FUNCTION
// ─────────────────────────────────────────────────────────────────

export function analyzeDigits(freq: DigitFreq): TradeRecommendation[] {
    const overResults = analyzeOver(freq);
    const underResults = analyzeUnder(freq);
    const allResults = [...overResults, ...underResults];

    // Sort: HIGH confidence first, then MEDIUM, LOW last
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    allResults.sort((a, b) => order[a.confidence] - order[b.confidence]);

    return allResults;
}

// ─────────────────────────────────────────────────────────────────
// CONVERSATIONAL KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────────

export function getKnowledgeResponse(input: string): string {
    const q = input.toLowerCase();

    // ── Under strategies ──────────────────────────────────────────
    if (q.includes('under 9')) {
        return `🎯 UNDER 9 — Safest Setup (Low Risk)

**Conditions:**
• Digit 9 must be below 10%
• No green or red bar at digit 9

**Entry:** Cursor hits digit 9 or 0 — confirm digit 9 is constant (not rising)

**Ticks:** 1 tick on plain indices (Vol 10, 25, 50, 75, 100) | 2 ticks on 1s indices

**Market:** Volatility 50 Index recommended

⭐ This is a STRONG UNDER and the safest accumulation setup. High probability (~90%).`;
    }

    if (q.includes('under 8')) {
        return `🎯 UNDER 8 Strategy

**Conditions:**
• Digits 8 AND 9 must both be below 10%
• Digit 7 must be ≥10.3% — this acts as a "shield"

**Entry digits:** Wait for cursor at:
→ Digit 7 (if 7 has 10.4%+)
→ Digit 4 (if 4 has 10.5%+)
→ Digit 6 (if 6 has 10.2%+)
→ Or digits 9, 0, 1

**Ticks:** 2–3 ticks
**Market:** Volatility 50 Index`;
    }

    if (q.includes('under 7')) {
        return `🎯 UNDER 7 Strategy (Medium Risk)

**Conditions:**
• Digits 7, 8, 9 must ALL be below 10%
• Digit 6 must be ≥10.3% — acts as shield

**Entry digits:**
→ Digit 7 (above average), digit 4 (10.5%+), digit 6 (10.2%+)
→ Also 9, 0, 1

**Ticks:** 2–3 ticks
**Market:** Volatility 75 Index`;
    }

    if (q.includes('under 6')) {
        return `🎯 UNDER 6 — STRONG UNDER ⭐ (Medium Risk)

**Conditions:**
• Digits 6, 7, 8, 9 must ALL be below 10%
• Digit 5 must be ≥10.3% — shield

**Also triggered by:** High-digit velocity trap → last ticks: 7, 8, 9, 8, 7 → exhaustion imminent

**Entry digits:** 7+, 4 (10.5%+), 6 (10.2%+), 9, 0, 1

**Ticks:** 5 ticks — strongest for exhaustion reversals
**Market:** Volatility 100 Index`;
    }

    if (q.includes('under 5')) {
        return `🎯 UNDER 5 Strategy (High Risk)

**Conditions:**
• Digits 5, 6, 7, 8, 9 must ALL be below 10%
• Digits 0, 1, or 2 must be ≥10.3% — shield

**Entry digits:** 7+, 4 (10.5%+), 6 (10.2%+), 9, 0, 1

**Ticks:** 3–5 ticks
**Market:** Volatility 100 (1s) Index

⚠️ Aggressive reversal-only setup. Only trade if strong low-digit shield exists.`;
    }

    // ── Over strategies ───────────────────────────────────────────
    if (q.includes('over 0') || q.includes('under 9')) {
        return `🎯 OVER 0 / UNDER 9 — Safest entries (~90% probability)

**OVER 0:** Digit 0 < 10%, green bar at even digit. Entry: cursor hits 0, stable. 1 tick.
**UNDER 9:** Digit 9 < 10%, no green/red at 9. Entry: cursor hits 9 or 0. 1 tick (plain) / 2 ticks (1s).

Both are low-risk, high-probability — best for beginners or warm-up trades.`;
    }

    if (q.includes('over 7')) {
        return `🎯 OVER 7 Strategy

**Conditions:**
• Green bar MUST be at digit 9 or 1
• Red bar (lowest digit) at 5 or 3 only
• Digits 8, 9 increasing rapidly (≥11%)

**Entry:** Cursor hits the red bar digit (5 or 3) — confirm one digit above 7 is increasing

**Ticks:** 2–3 ticks | **Market:** Volatility 100 (1s) Index`;
    }

    if (q.includes('over 6')) {
        return `🎯 OVER 6 Strategy

**Conditions:**
• Green bar MUST be at digit 8 (only even digit above 6)
• Red bar on even digit below 6
• 2+ digits above 6 at 11%+

**Entry:** Cursor at digit 0, 2, or 4 (choose highest % one), remaining digits constant

**Ticks:** 2–3 ticks | **Market:** Volatility 75 (1s) Index`;
    }

    if (q.includes('over 5')) {
        return `🎯 OVER 5 Strategy (Aggressive — Momentum only)

**Conditions:**
• 3+ digits below 5 are under 10%
• Green and red bars both at ODD digits
• No green/red bar at digits 0–4

**Best setup:** Staircase pattern 2→3→4→5→6 in last 10 ticks

**Entry:** Cursor at digit 1, 3, or 5 — constant | **Ticks:** 2–3 ticks`;
    }

    if (q.includes('over 4') || q.includes('over 3') || q.includes('over 2') || q.includes('over 1')) {
        const num = q.includes('over 4') ? 4 : q.includes('over 3') ? 3 : q.includes('over 2') ? 2 : 1;
        const rules: Record<number, string> = {
            1: 'Digits 0,1 < 10% | Green bar at ODD | Entry: digit 1 | 1–2 ticks ⭐ STRONG',
            2: 'Digits 0,1,2 < 10% | Green bar at EVEN | Entry: digit 0 or 2 | 2–4 ticks',
            3: 'Digits 0–3 < 10% | Green & red both ODD | Entry: digit 1 or 3 | 2–4 ticks ⭐ STRONG',
            4: '3+ of digits 0–4 < 10% | Green & red both EVEN | Entry: digit 2 or 4 | 3–4 ticks ⭐ STRONG',
        };
        return `🎯 OVER ${num} — ${rules[num]}

**Remember:** Green bar = highest frequency digit | Red bar = LOWEST frequency digit

Confirm entry digit is constant (not rising or falling) before clicking OVER.`;
    }

    // ── Bars ──────────────────────────────────────────────────────
    if (q.includes('green bar') || q.includes('red bar') || q.includes('bar mean') || q.includes('bar is')) {
        return `📊 Green Bar & Red Bar — Ahmed's Definitions:

• **Green bar** = digit with the HIGHEST percentage frequency
• **Red bar** = digit with the LOWEST percentage frequency

These are different from what many think! The red bar marks the COLDEST digit — the one appearing least often.

**Why it matters:**
• For Over/Under, you check where these bars are to confirm setup validity
• e.g. Over 7 needs green bar at 9 or 1, red bar at 5 or 3
• e.g. Over 6 needs green bar MUST be at 8

Strong Over entries: 3, 4, 1
Weak Over entries: 8, 7, 0
Strong Under entries: 9, 6, 2
Weak Under entries: 5`;
    }

    // ── Correlation & patterns ────────────────────────────────────
    if (q.includes('correlation') || q.includes('cluster') || q.includes('pattern') || q.includes('exhaust')) {
        return `📈 Digit Correlation Theory (Advanced Research):

**High-digit exhaustion (7,8,9 clustering):**
→ Digits 7,8,9 appearing repeatedly = overheating
→ Signal: UNDER 6 or UNDER 7 (mirror reversal into 0,1,2)
→ Example: 8,9,7,8,9 in last 10 ticks → enter UNDER 6

**Low-digit exhaustion (0,1,2 clustering):**
→ Signal: OVER 3 or OVER 4
→ Example: 0,1,2,0,1 → enter OVER 4

**Staircase continuation (2→3→4→5→6):**
→ Sequential mid-range sequence = momentum continuation
→ Signal: OVER 5 (aggressive)

**Velocity trap (fast 7,8,9):**
→ Rapid 7,8,9 bursts = trap before sharp reversal
→ Signal: UNDER 6 with 5 ticks

Always observe 10 ticks before entering. Count high vs low digit pressure.`;
    }

    // ── Tick selection ────────────────────────────────────────────
    if (q.includes('tick') && (q.includes('how many') || q.includes('many tick') || q.includes('number of'))) {
        return `⏱️ Tick Selection Matrix (from Research PDF):

| Setup      | Ticks    | Risk   |
|------------|----------|--------|
| UNDER 9    | 1 tick   | Low    |
| OVER 1     | 1–2      | Low    |
| UNDER 8    | 1–3      | Low    |
| OVER 2     | 2–4      | Medium |
| OVER 3     | 2–4      | Medium |
| UNDER 7    | 2–3–4    | Medium |
| OVER 4     | 3–4      | Medium |
| UNDER 6    | 5 ticks  | Medium |
| OVER 5     | 2–3      | High   |
| UNDER 5    | 3–5      | High   |
| UNDER 4    | 5 ticks  | High   |

More ticks = more time for stats to express. Less ticks = faster, higher variance.`;
    }

    // ── Strong/Weak entries ───────────────────────────────────────
    if (q.includes('strong') || q.includes('weak') || q.includes('best entry') || q.includes('strongest')) {
        return `💪 Strong vs Weak Entry Points:

**Strong OVER entries:** 3, 4, 1
**Weak OVER entries:** 8, 7, 0

**Strong UNDER entries:** 9, 6, 2
**Weak UNDER entries:** 5

Always prefer strong entry points. Weak entries require extra confirmation before trading.

**Professional entry models:**
• High-digit exhaustion: 8,9,7,8,9 → UNDER 6
• Low-digit exhaustion: 0,1,2,0,1 → OVER 4
• Staircase: 2,3,4,5,6 → OVER 5
• Velocity trap: fast 7,8,9 → UNDER 6`;
    }

    // ── Risk management ───────────────────────────────────────────
    if (q.includes('risk') || q.includes('stake') || q.includes('martingale') || q.includes('money')) {
        return `💰 Risk Management (Professional Rules):

• Risk only **1–3% per trade** of account balance
• Account $100 → max $1–3 per trade
• Use **fixed fractional staking** — NOT emotional martingale
• Maximum **10% daily drawdown** — stop if hit
• Maximum **5–15 trades per session** — quality over quantity

**Martingale Warning:**
$1 → $2 → $4 → $8 → $16 → account wipe in one streak
Never increase stake from anger or desperation.

**Daily structure:**
• 5–15 trades max per session
• Cooldown after losses
• Stop when daily limit reached`;
    }

    // ── Market selection ──────────────────────────────────────────
    if (q.includes('market') && (q.includes('best') || q.includes('which') || q.includes('choose'))) {
        return `📊 Market Selection Guide:

• **Volatility 50 Index** — Beginner-friendly, best for UNDER 9, UNDER 8
• **Volatility 75 Index** — Balanced momentum, UNDER 7, OVER 3
• **Volatility 100 Index** — Fast & aggressive, UNDER 6, OVER 6, OVER 7

**1s Indices** (faster ticks):
• Require stronger emotional control
• UNDER 9 on 1s → use 2 ticks instead of 1
• Best after you're comfortable on plain indices

Start with Volatility 50 Index. Move to higher volatility as you gain experience.`;
    }

    // ── Observation phase ─────────────────────────────────────────
    if (q.includes('observe') || q.includes('before') || q.includes('watch') || q.includes('10 tick')) {
        return `👁️ Observation Phase — Ahmed's Method:

**Step 1:** Watch 10–20 ticks without trading
**Step 2:** Count high-digit vs low-digit pressure
**Step 3:** Look for clustering, repetition, sequences
**Step 4:** Identify the pattern:
   → Clustering 7,8,9 = consider UNDER 6
   → Clustering 0,1,2 = consider OVER 4
   → Staircase 2→3→4→5→6 = consider OVER 5

**Step 5:** Check digit frequencies (use 🔬 Analyze Market)
**Step 6:** Confirm all conditions met → enter only then

⚠️ Never enter without visible imbalance. Random clicking destroys accounts.`;
    }

    // ── Psychology ────────────────────────────────────────────────
    if (q.includes('psychology') || q.includes('emotion') || q.includes('gambler') || q.includes('bias')) {
        return `🧠 Digit Psychology & Emotional Discipline:

**Gambler's Fallacy:** "Digit 8 appeared 5 times — it must stop."
Reality: Each tick is independent. Probability stays at 10%.

**Recency Bias:** "Even keeps losing, switching to Odd."
Reality: 50/50 regardless of recent sequence.

**Emotional Escalation:** Loss → double stake → account wipe.

**Ahmed's Rules:**
• Never trade from anger or desperation
• Winning streaks should not create greed
• Execute based on logic and structure only
• Use cooldown periods after emotional pressure
• Focus on consistency, not fast recovery`;
    }

    // ── Hello / greeting ──────────────────────────────────────────
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.length < 10) {
        return `👋 Welcome to AHMED AI v2 — upgraded with full research!

I'm trained on:
📕 Ahmed The Trader's digit psychology methodology (Over 0–7)
📗 Digit Correlation & Tick Psychology Research (patterns, exhaustion, velocity traps)
📘 Markets of Under PDF (Under 5–9 exact rules, shield digits)

I can help with:
• 🔬 **Analyze Market** — input live digit frequencies → instant trade signal
• 🎯 Any Over/Under strategy (Over 0–7, Under 5–9)
• 📈 Correlation patterns (exhaustion, velocity traps, staircase)
• ⏱️ Tick selection by contract type
• 💰 Risk management & emotional discipline

Just ask or use the 🔬 button!`;
    }

    // ── Default ───────────────────────────────────────────────────
    return `🤖 AHMED AI — Ask me anything about digit trading:

**Over strategies:** "How do I trade Over 6?" / "Over 7 rules?"
**Under strategies:** "Under 9 rules?" / "Under 6 setup?" / "Under 8 entry?"
**Bars:** "What is the green bar?" / "What is the red bar?"
**Patterns:** "What is high-digit exhaustion?" / "Staircase pattern?"
**Strong entries:** "What are the strongest Over entries?"
**Ticks:** "How many ticks for Under 6?"
**Markets:** "Which market for Under 9?"
**Risk:** "How do I manage risk?"

Or use **🔬 Analyze Market** to input your live digit % and get an instant trade signal!`;
}
