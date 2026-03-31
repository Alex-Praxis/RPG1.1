import { state } from './state.js';
import { renderDashboard } from './dashboard.js';
import {
  renderTodoList,
  init as initTasks,
  selectType, submitTask,
  completeTodoTask, deleteTodoTask,
  addStep, removeStep, toggleStep,
  openEditTodoModal, saveTodoEdit,
  addEditStep, removeEditStep,
} from './tasks.js';
import {
  renderRewards,
  init as initRewards,
  openRedeem, updateRedeemPreview,
  confirmRedeem, openAddReward, openEditReward, saveReward,
} from './rewards.js';
import {
  renderFinance,
  init as initFinance,
  addFinanceEntry, deleteFinance,
  editBudgetItem, deleteBudgetItem, addBudgetItem,
} from './finance.js';
import {
  renderFullLog,
  init as initLog,
  deleteTask, confirmClear,
} from './log.js';
import {
  init as initSync,
  cloudLoad, applyCloudData, triggerSave,
  openSyncSetup, clearSync,
  initSync as runInitSync,
  copySyncCode, decodeSyncCode, connectBySyncCode,
} from './sync.js';
import { exportData, importData } from './io.js';
import {
  init as initDailies,
  completeDaily, deleteDaily,
  openAddDailyModal, openEditDailyModal, saveDaily, updateFreqUI,
} from './dailies.js';
import { openModal, closeModal, toast } from './ui.js';

// ── RENDER ALL ──
function renderAll() {
  renderDashboard();
  renderTodoList();
  const active = document.querySelector('.page.active');
  if (active?.id === 'page-rewards') renderRewards();
  if (active?.id === 'page-data') {
    const activeDataTab = document.querySelector('.data-tab.active');
    const tabId = activeDataTab?.dataset.tab;
    if (tabId === 'finance') renderFinance();
    if (tabId === 'log')     renderFullLog();
  }
}

// ── DATA SUB-TAB NAVIGATION ──
function showDataTab(tabId, btn) {
  document.querySelectorAll('.data-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('data-finance').style.display = tabId === 'finance' ? '' : 'none';
  document.getElementById('data-log').style.display     = tabId === 'log'     ? '' : 'none';
  if (tabId === 'finance') renderFinance();
  if (tabId === 'log')     renderFullLog();
}

// ── PAGE NAVIGATION ──
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'rewards') renderRewards();
  if (id === 'data') {
    const activeDataTab = document.querySelector('.data-tab.active');
    if (activeDataTab) {
      const tabId = activeDataTab.dataset.tab;
      if (tabId === 'finance') renderFinance();
      if (tabId === 'log')     renderFullLog();
    } else {
      // Default: show finance sub-tab
      const firstTab = document.querySelector('.data-tab');
      if (firstTab) showDataTab(firstTab.dataset.tab, firstTab);
    }
  }
}

// ── INIT: inject renderAll into domain modules ──
initTasks(renderAll);
initRewards(renderAll);
initFinance(renderAll);
initLog(renderAll);
initSync(renderAll);
initDailies(renderAll);

// ── INIT: set date defaults ──
document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
const fMonthEl = document.getElementById('f-month');
if (fMonthEl) fMonthEl.value = new Date().toISOString().slice(0, 7);

// ── INIT: initial render ──
renderAll();

// ── INIT: auto-sync on startup ──
if (state.syncCfg.apiKey && state.syncCfg.binId) {
  cloudLoad().then(data => {
    if (data && data.taskLog) {
      applyCloudData(data);
      toast('已从云端同步 ✓');
    }
  });
}

// ── WINDOW BINDINGS ──
// ES module scope is not global; inline onclick= attributes resolve via window.
// All functions referenced in HTML are bound here.
window.showPage             = showPage;
window.showDataTab          = showDataTab;
// Sync
window.openSyncSetup        = openSyncSetup;
window.clearSync            = clearSync;
window.initSync             = runInitSync;
window.copySyncCode         = copySyncCode;
window.decodeSyncCode       = decodeSyncCode;
window.connectBySyncCode    = connectBySyncCode;
// IO
window.exportData           = exportData;
window.importData           = importData;
// Tasks
window.selectType           = selectType;
window.submitTask           = submitTask;
window.completeTodoTask     = completeTodoTask;
window.deleteTodoTask       = deleteTodoTask;
window.addStep              = addStep;
window.removeStep           = removeStep;
window.toggleStep           = toggleStep;
window.openEditTodoModal    = openEditTodoModal;
window.saveTodoEdit         = saveTodoEdit;
window.addEditStep          = addEditStep;
window.removeEditStep       = removeEditStep;
// Dailies
window.openEditDailyModal   = openEditDailyModal;
// Rewards
window.openEditReward       = openEditReward;
// Rewards
window.openAddReward        = openAddReward;
window.saveReward           = saveReward;
window.openRedeem           = openRedeem;
window.updateRedeemPreview  = updateRedeemPreview;
window.confirmRedeem        = confirmRedeem;
window.renderRewards        = renderRewards;   // reward-filter onchange
// Finance
window.addFinanceEntry      = addFinanceEntry;
window.deleteFinance        = deleteFinance;
window.editBudgetItem       = editBudgetItem;
window.deleteBudgetItem     = deleteBudgetItem;
window.addBudgetItem        = addBudgetItem;
// Log
window.deleteTask           = deleteTask;
window.confirmClear         = confirmClear;
// Dailies
window.completeDaily        = completeDaily;
window.deleteDaily          = deleteDaily;
window.openAddDailyModal    = openAddDailyModal;
window.saveDaily            = saveDaily;
window.updateFreqUI         = updateFreqUI;
// UI
window.closeModal           = closeModal;
window.openModal            = openModal;

// ── DROPDOWN: close on outside click ──
document.addEventListener('click', e => {
  const toggle   = document.getElementById('difficulty-toggle');
  const dropdown = document.getElementById('difficulty-dropdown');
  if (toggle && dropdown && !toggle.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});
