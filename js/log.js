import { state, saveKey } from './state.js';
import { rowScore } from './compute.js';
import { triggerSave } from './sync.js';
import { toast } from './ui.js';

// ── MODULE-PRIVATE ──
let _renderAll = () => {};

export function init(renderAllFn) {
  _renderAll = renderAllFn;
}

// ── SHARED: render task log rows (reused by dashboard + full log) ──
export function renderLogRows(entries) {
  return entries.map(e => {
    const sc  = rowScore(e);
    const col = sc >= 0 ? 'var(--green)' : 'var(--red)';
    const idx = state.taskLog.indexOf(e);
    return `<tr>
      <td class="log-date">${e.date}</td>
      <td>${e.N||0}</td><td>${e.A||0}</td><td>${e.B||0}</td><td>${e.C||0}</td><td>${e.D||0}</td>
      <td style="font-family:var(--mono);font-weight:700;color:${col}">${sc >= 0 ? '+' : ''}${sc}</td>
      <td style="color:var(--text2);font-size:12px">${e.note||''}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteTask(${idx})">删</button></td>
    </tr>`;
  }).join('');
}

// ── RENDER FULL LOG ──
export function renderFullLog() {
  const sorted = [...state.taskLog].sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById('full-log').innerHTML = sorted.length === 0
    ? '<tr><td colspan="9" style="color:var(--text3);text-align:center;padding:28px">暂无记录</td></tr>'
    : renderLogRows(sorted);
}

// ── DELETE TASK ──
export function deleteTask(idx) {
  if (!confirm('确认删除该条记录？')) return;
  state.taskLog.splice(idx, 1);
  saveKey('taskLog');
  _renderAll();
  triggerSave();
  toast('记录已删除 ✓');
}

// ── CONFIRM CLEAR ──
export function confirmClear() {
  if (confirm('确认清空所有任务日志？建议先导出备份。')) {
    state.taskLog = [];
    saveKey('taskLog');
    _renderAll();
    triggerSave();
    toast('日志已清空');
  }
}
