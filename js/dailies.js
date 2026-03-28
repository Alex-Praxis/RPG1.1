import { typeLabels, TYPE_COLORS, SCORES } from './constants.js';
import { state, saveKey } from './state.js';
import { triggerSave } from './sync.js';
import { toast, openModal, closeModal } from './ui.js';

// ── MODULE-PRIVATE ──
let _renderAll = () => {};

export function init(renderAllFn) {
  _renderAll = renderAllFn;
}

// ── DATE HELPERS ──
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function daysBetween(dateA, dateB) {
  // Returns integer days from dateA to dateB
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}
function offsetDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ── DUE LOGIC ──
function isDueToday(daily) {
  const today = todayStr();
  if (daily.startDate > today) return false;              // 还没开始
  if (daily.lastCompleted === today) return false;        // 今天已完成

  if (daily.frequency === 'daily') return true;

  if (daily.frequency === 'weekly') {
    return daily.repeatDays.includes(new Date().getDay());
  }

  if (daily.frequency === 'custom') {
    const diff = daysBetween(daily.startDate, today);
    return diff % daily.everyX === 0;
  }
  return false;
}

// 计算"上一个应该完成的日期"，用于 streak 判断
function prevDueDate(daily, beforeDate) {
  // 从 beforeDate 往前找最近一个 due 的日期（不含 beforeDate）
  let d = offsetDate(beforeDate, -1);
  const start = daily.startDate;
  for (let i = 0; i < 365; i++) {
    if (d < start) return null;
    const dObj = new Date(d + 'T00:00:00');
    let due = false;
    if (daily.frequency === 'daily') due = true;
    if (daily.frequency === 'weekly') due = daily.repeatDays.includes(dObj.getDay());
    if (daily.frequency === 'custom') due = daysBetween(start, d) % daily.everyX === 0;
    if (due) return d;
    d = offsetDate(d, -1);
  }
  return null;
}

// ── FREQUENCY DISPLAY ──
function freqLabel(daily) {
  if (daily.frequency === 'daily') return '每天';
  if (daily.frequency === 'custom') return `每 ${daily.everyX} 天`;
  if (daily.frequency === 'weekly') {
    const dayNames = ['日','一','二','三','四','五','六'];
    const names = daily.repeatDays.sort().map(d => '周' + dayNames[d]);
    return names.join(' / ');
  }
  return '';
}

// ── COMPLETE DAILY ──
export function completeDaily(id) {
  const daily = state.dailies.find(d => d.id === id);
  if (!daily || !isDueToday(daily)) return;

  const today = todayStr();

  // 更新 streak
  const prev = prevDueDate(daily, today);
  daily.streak = (daily.lastCompleted === prev && prev !== null) ? daily.streak + 1 : 1;
  daily.lastCompleted = today;
  saveKey('dailies');

  // 积分：写入 taskLog（与现有任务格式完全相同）
  const entry = { date: today, note: daily.name, N:0, A:0, B:0, C:0, D:0 };
  entry[daily.type] = 1;
  state.taskLog.push(entry);
  saveKey('taskLog');

  _renderAll();
  triggerSave();
  toast(`✓ ${daily.name}  streak ${daily.streak} 🔥`);
}

// ── DELETE DAILY ──
export function deleteDaily(id) {
  if (!confirm('确认删除该日常任务？')) return;
  state.dailies = state.dailies.filter(d => d.id !== id);
  saveKey('dailies');
  renderDailies();
  triggerSave();
  toast('日常任务已删除');
}

// ── ADD DAILY MODAL ──
export function openAddDailyModal() {
  // 重置表单
  document.getElementById('dl-name').value = '';
  document.getElementById('dl-type').value = 'B';
  document.getElementById('dl-freq').value = 'daily';
  document.getElementById('dl-start').value = todayStr();
  document.getElementById('dl-everyx').value = '1';
  // 默认周一到周五选中
  ['0','1','2','3','4','5','6'].forEach(d => {
    const cb = document.getElementById('dl-day-' + d);
    if (cb) cb.checked = ['1','2','3','4','5'].includes(d);
  });
  updateFreqUI();
  openModal('modal-daily');
}

export function updateFreqUI() {
  const freq = document.getElementById('dl-freq').value;
  document.getElementById('dl-weekly-opts').style.display  = freq === 'weekly'  ? 'block' : 'none';
  document.getElementById('dl-custom-opts').style.display  = freq === 'custom'  ? 'block' : 'none';
}

export function saveDaily() {
  const name = document.getElementById('dl-name').value.trim();
  if (!name) { toast('请填写任务名称'); return; }

  const freq   = document.getElementById('dl-freq').value;
  const everyX = parseInt(document.getElementById('dl-everyx').value) || 1;
  const repeatDays = ['0','1','2','3','4','5','6']
    .filter(d => document.getElementById('dl-day-' + d)?.checked)
    .map(Number);

  if (freq === 'weekly' && repeatDays.length === 0) {
    toast('请至少选择一个重复日');
    return;
  }

  const daily = {
    id:            Date.now(),
    name,
    type:          document.getElementById('dl-type').value,
    frequency:     freq,
    repeatDays:    freq === 'weekly' ? repeatDays : [],
    everyX:        freq === 'custom' ? everyX : 1,
    startDate:     document.getElementById('dl-start').value || todayStr(),
    streak:        0,
    lastCompleted: null,
    createdAt:     new Date().toISOString(),
  };

  state.dailies.push(daily);
  saveKey('dailies');
  closeModal('modal-daily');
  renderDailies();
  triggerSave();
  toast(`已添加日常：${name}`);
}

// ── RENDER ──
export function renderDailies() {
  const today = todayStr();
  const due   = state.dailies.filter(isDueToday);
  const done  = state.dailies.filter(d => d.lastCompleted === today && !isDueToday(d));
  const all   = state.dailies;

  // ── 今日待完成 ──
  const dueEl = document.getElementById('dl-due-list');
  dueEl.innerHTML = due.length === 0
    ? '<div style="color:var(--text3);font-size:12px;padding:14px 0">今日无待完成任务 🎉</div>'
    : due.map(d => {
        const color = TYPE_COLORS[d.type];
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:var(--bg3);border:1px solid var(--border);border-radius:10px">
            <div>
              <div style="font-weight:500;font-size:14px;color:var(--text);margin-bottom:4px">${d.name}</div>
              <div style="font-size:11px;color:var(--text3);display:flex;gap:10px;align-items:center">
                <span class="tag tag-${d.type}">${typeLabels[d.type]}</span>
                <span>${freqLabel(d)}</span>
                ${d.streak > 0 ? `<span style="color:var(--amber);font-weight:600">🔥 ${d.streak} 天连续</span>` : ''}
              </div>
            </div>
            <button class="btn btn-sm btn-primary" style="background:${color};border-color:${color};white-space:nowrap" onclick="completeDaily(${d.id})">✓ 完成</button>
          </div>`;
      }).join('');

  // ── 今日已完成 ──
  const doneEl = document.getElementById('dl-done-list');
  document.getElementById('dl-done-section').style.display = done.length > 0 ? 'block' : 'none';
  doneEl.innerHTML = done.map(d => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;opacity:.55">
      <div style="display:flex;gap:10px;align-items:center">
        <span style="color:var(--green);font-size:16px">✓</span>
        <span style="font-size:13px;color:var(--text2)">${d.name}</span>
        <span class="tag tag-${d.type}">${typeLabels[d.type]}</span>
        ${d.streak > 0 ? `<span style="font-size:11px;color:var(--amber)">🔥 ${d.streak}</span>` : ''}
      </div>
    </div>`).join('');

  // ── 全部日常（管理表格）──
  const allEl = document.getElementById('dl-all-list');
  allEl.innerHTML = all.length === 0
    ? '<tr><td colspan="5" style="color:var(--text3);text-align:center;padding:28px">暂无日常任务 — 点击「+ 添加」开始</td></tr>'
    : all.map(d => {
        const isDone  = d.lastCompleted === today;
        const isToday = isDueToday(d) || isDone;
        return `<tr style="${isDone ? 'opacity:.5' : ''}">
          <td style="font-weight:500;color:var(--text)">
            ${isDone ? '<span style="color:var(--green);margin-right:6px">✓</span>' : ''}${d.name}
          </td>
          <td><span class="tag tag-${d.type}">${typeLabels[d.type]}</span></td>
          <td style="color:var(--text2);font-size:12px">${freqLabel(d)}</td>
          <td style="font-family:var(--mono);color:var(--amber)">${d.streak > 0 ? '🔥 ' + d.streak : '—'}</td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteDaily(${d.id})">删</button></td>
        </tr>`;
      }).join('');
}
