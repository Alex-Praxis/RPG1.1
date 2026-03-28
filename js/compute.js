import { SCORES } from './constants.js';
import { state } from './state.js';

// ── COMPUTED VALUES ──
export function calcPoints() {
  let earned = 0, neg = 0;
  state.taskLog.forEach(e => {
    const p = (e.N||0)*SCORES.N + (e.A||0)*SCORES.A + (e.B||0)*SCORES.B + (e.C||0)*SCORES.C + (e.D||0)*SCORES.D;
    if (p > 0) earned += p; else neg += p;
  });
  const spent = state.redeemLog.reduce((s, r) => s + (r.cost||0), 0);
  return {current: Math.max(0, earned + neg - spent), earned, spent};
}

export function rowScore(e) {
  return (e.N||0)*SCORES.N + (e.A||0)*SCORES.A + (e.B||0)*SCORES.B + (e.C||0)*SCORES.C + (e.D||0)*SCORES.D;
}

export function fmtMoney(n) {
  return '¥' + Math.round(n).toLocaleString();
}
