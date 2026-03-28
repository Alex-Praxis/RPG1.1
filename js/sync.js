import { JSONBIN } from './constants.js';
import { state, saveKey } from './state.js';
import { toast, openModal, closeModal } from './ui.js';

// ── MODULE-PRIVATE ──
let _renderAll = () => {};
let saveTimer  = null;

export function init(renderAllFn) {
  _renderAll = renderAllFn;
}

// ── SYNC DOT ──
export function setSyncDot(dotState) {
  document.getElementById('sync-dot').className = 'sync-dot' + (dotState ? ' ' + dotState : '');
}

// ── DATA SNAPSHOT ──
export function getAppData() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    taskLog:    state.taskLog,
    todoList:   state.todoList,
    redeemLog:  state.redeemLog,
    financeLog: state.financeLog,
    rewards:    state.rewards,
    budget:     state.budget,
  };
}

// ── CLOUD SAVE ──
export async function cloudSave() {
  if (!state.syncCfg.apiKey || !state.syncCfg.binId) return;
  setSyncDot('syncing');
  try {
    const r = await fetch(`${JSONBIN}/${state.syncCfg.binId}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json', 'X-Master-Key': state.syncCfg.apiKey},
      body: JSON.stringify(getAppData()),
    });
    if (!r.ok) throw new Error(r.status);
    setSyncDot('synced');
  } catch(e) {
    setSyncDot('error');
    console.warn('云同步失败', e);
  }
}

// ── CLOUD LOAD ──
export async function cloudLoad() {
  if (!state.syncCfg.apiKey || !state.syncCfg.binId) return null;
  setSyncDot('syncing');
  try {
    const r = await fetch(`${JSONBIN}/${state.syncCfg.binId}/latest`, {
      headers: {'X-Master-Key': state.syncCfg.apiKey, 'X-Bin-Meta': 'false'},
    });
    if (!r.ok) throw new Error(r.status);
    const data = await r.json();
    setSyncDot('synced');
    return data.record || data;
  } catch(e) {
    setSyncDot('error');
    return null;
  }
}

// ── DEBOUNCED SAVE ──
export function triggerSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(cloudSave, 1500);
}

// ── APPLY CLOUD DATA ──
export function applyCloudData(data) {
  if (data.taskLog)    { state.taskLog    = data.taskLog;    saveKey('taskLog'); }
  if (data.todoList)   { state.todoList   = data.todoList;   saveKey('todoList'); }
  if (data.redeemLog)  { state.redeemLog  = data.redeemLog;  saveKey('redeemLog'); }
  if (data.financeLog) { state.financeLog = data.financeLog; saveKey('financeLog'); }
  if (data.rewards)    { state.rewards    = data.rewards;    saveKey('rewards'); }
  if (data.budget)     { state.budget     = data.budget;     saveKey('budget'); }
  _renderAll();
}

// ── INIT SYNC ──
export async function initSync() {
  const key = document.getElementById('sync-api-key').value.trim();
  if (!key) { toast('请填写 API Key'); return; }
  const statusEl = document.getElementById('sync-status-text');
  const existingBinId = document.getElementById('sync-bin-id').value.trim() || state.syncCfg.binId;

  statusEl.textContent = '连接中...';
  setSyncDot('syncing');

  if (existingBinId) {
    state.syncCfg = {apiKey: key, binId: existingBinId};
    saveKey('syncCfg');
    const data = await cloudLoad();
    if (data && data.taskLog) {
      applyCloudData(data);
      statusEl.textContent = '同步成功！上次更新：' + new Date(data.updatedAt).toLocaleString('zh');
      toast('已从云端同步最新数据 ✓');
      setTimeout(() => closeModal('modal-sync'), 1800);
    } else {
      statusEl.textContent = '拉取失败，请检查 API Key 是否正确';
      setSyncDot('error');
    }
  } else {
    try {
      const r = await fetch(JSONBIN, {
        method: 'POST',
        headers: {'Content-Type':'application/json','X-Master-Key':key,'X-Bin-Name':'os-v1','X-Bin-Private':'true'},
        body: JSON.stringify(getAppData()),
      });
      if (!r.ok) throw new Error(await r.text());
      const result = await r.json();
      const newId = result.metadata?.id;
      if (!newId) throw new Error('未获取到 Bin ID');
      state.syncCfg = {apiKey: key, binId: newId};
      saveKey('syncCfg');
      document.getElementById('sync-bin-id').value = newId;
      document.getElementById('sync-bin-row').style.display = 'block';
      statusEl.textContent = '初始化成功！Bin ID: ' + newId;
      setSyncDot('synced');
      toast('云同步已开启 ✓');
      setTimeout(() => closeModal('modal-sync'), 2000);
    } catch(e) {
      statusEl.textContent = '失败：' + e.message;
      setSyncDot('error');
    }
  }
}

// ── CLEAR SYNC ──
export function clearSync() {
  if (!confirm('清除云同步配置？本地数据不受影响。')) return;
  state.syncCfg = {apiKey: '', binId: ''};
  saveKey('syncCfg');
  setSyncDot('');
  document.getElementById('sync-api-key').value = '';
  document.getElementById('sync-bin-id').value = '';
  document.getElementById('sync-bin-row').style.display = 'none';
  document.getElementById('sync-status-text').textContent = '';
  toast('同步配置已清除');
}

// ── OPEN SYNC SETUP ──
export function openSyncSetup() {
  document.getElementById('sync-api-key').value = state.syncCfg.apiKey || '';
  document.getElementById('sync-bin-id').value  = state.syncCfg.binId  || '';
  document.getElementById('sync-bin-row').style.display = state.syncCfg.binId ? 'block' : 'none';
  document.getElementById('sync-status-text').textContent = state.syncCfg.binId
    ? '已配置云同步，点击「立即同步」可手动拉取最新数据'
    : '尚未配置，按上方步骤操作';
  openModal('modal-sync');
}
