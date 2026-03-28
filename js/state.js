import { DEFAULT_REWARDS, DEFAULT_BUDGET } from './constants.js';

// ── STORAGE HELPERS ──
function load(k, d) {
  try {
    const v = localStorage.getItem(k);
    return v !== null ? JSON.parse(v) : d;
  } catch {
    return d;
  }
}

// ── APP STATE ──
// Single mutable object shared across all modules via import reference.
// Modules mutate properties directly (state.taskLog.push(...)) or replace
// arrays (state.taskLog = data.taskLog). Both are visible to all importers
// because they share the same object reference.
export const state = {
  taskLog:    load('taskLog',   []),
  todoList:   load('todoList',  []),
  rewards:    load('rewards',   DEFAULT_REWARDS),
  redeemLog:  load('redeemLog', []),
  financeLog: load('financeLog',[]),
  budget:     load('budget',    DEFAULT_BUDGET),
  syncCfg:    load('syncCfg',   {apiKey:'', binId:''}),
  dailies:    load('dailies',   []),
};

// Persist a single state key to localStorage
export function saveKey(key) {
  localStorage.setItem(key, JSON.stringify(state[key]));
}
