import { state } from './state.js';
import { renderDashboard } from './dashboard.js';
import {
  renderTodoList,
  init as initTasks,
  selectType, submitTask,
  completeTodoTask, deleteTodoTask,
} from './tasks.js';
import {
  renderRewards,
  init as initRewards,
  openRedeem, updateRedeemPreview,
  confirmRedeem, openAddReward, saveReward,
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
} from './sync.js';
import { exportData, importData } from './io.js';
import {
  renderDailies,
  init as initDailies,
  completeDaily, deleteDaily,
  openAddDailyModal, saveDaily, updateFreqUI,
} from './dailies.js';
import { openModal, closeModal, toast } from './ui.js';

// ── RENDER ALL ──
function renderAll() {
  renderDashboard();
  renderTodoList();
  const active = document.querySelector('.page.active');
  if (active?.id === 'page-rewards') renderRewards();
  if (active?.id === 'page-finance') renderFinance();
  if (active?.id === 'page-log')     renderFullLog();
  if (active?.id === 'page-dailies') renderDailies();
}

// ── PAGE NAVIGATION ──
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'rewards') renderRewards();
  if (id === 'finance') renderFinance();
  if (id === 'log')     renderFullLog();
  if (id === 'dailies') renderDailies();
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
// Sync
window.openSyncSetup        = openSyncSetup;
window.clearSync            = clearSync;
window.initSync             = runInitSync;
// IO
window.exportData           = exportData;
window.importData           = importData;
// Tasks
window.selectType           = selectType;
window.submitTask           = submitTask;
window.completeTodoTask     = completeTodoTask;
window.deleteTodoTask       = deleteTodoTask;
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
