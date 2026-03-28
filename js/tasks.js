import { TYPE_COLORS, typeLabels } from './constants.js';
import { state, saveKey } from './state.js';
import { triggerSave } from './sync.js';
import { toast } from './ui.js';

// ── MODULE-PRIVATE ──
let _renderAll   = () => {};
let selectedType = null;

export function init(renderAllFn) {
  _renderAll = renderAllFn;
}

// ── TYPE SELECTION ──
export function selectType(type) {
  selectedType = type;
  ['N','A','B','C','D'].forEach(t => {
    const btn = document.getElementById('type-btn-' + t);
    if (t === type) {
      btn.style.outline      = '3px solid ' + TYPE_COLORS[t];
      btn.style.outlineOffset = '2px';
      btn.style.fontWeight   = '700';
    } else {
      btn.style.outline    = 'none';
      btn.style.fontWeight = '';
    }
  });
  const btnDone = document.getElementById('action-done');
  const btnTodo = document.getElementById('action-todo');
  btnDone.disabled = false; btnDone.style.opacity = '1'; btnDone.style.cursor = 'pointer';
  btnTodo.disabled = false; btnTodo.style.opacity = '1'; btnTodo.style.cursor = 'pointer';
}

// ── SUBMIT TASK ──
export function submitTask(action) {
  if (!selectedType) return;
  const date = document.getElementById('entry-date').value || new Date().toISOString().split('T')[0];
  const note = document.getElementById('entry-note').value;

  if (action === 'todo') {
    state.todoList.push({id: Date.now(), date, type: selectedType, note});
    saveKey('todoList');
    renderTodoList();
    triggerSave();
    toast(`已加入待办：${typeLabels[selectedType]}`);
  } else {
    const entry = {date, note, N:0, A:0, B:0, C:0, D:0};
    entry[selectedType] = 1;
    state.taskLog.push(entry);
    saveKey('taskLog');
    _renderAll();
    triggerSave();
    toast(`已记录完成：${typeLabels[selectedType]}`);
  }

  // 重置表单与按钮状态
  document.getElementById('entry-note').value = '';
  selectedType = null;
  ['N','A','B','C','D'].forEach(t => {
    const btn = document.getElementById('type-btn-' + t);
    btn.style.outline = 'none';
    btn.style.fontWeight = '';
  });
  const btnDone = document.getElementById('action-done');
  const btnTodo = document.getElementById('action-todo');
  btnDone.disabled = true; btnDone.style.opacity = '0.4'; btnDone.style.cursor = 'not-allowed';
  btnTodo.disabled = true; btnTodo.style.opacity = '0.4'; btnTodo.style.cursor = 'not-allowed';
}

// ── COMPLETE TODO ──
export function completeTodoTask(id) {
  const idx = state.todoList.findIndex(t => t.id === id);
  if (idx === -1) return;
  const task = state.todoList[idx];
  const entry = {date: task.date, note: task.note, N:0, A:0, B:0, C:0, D:0};
  entry[task.type] = 1;
  state.taskLog.push(entry);
  saveKey('taskLog');
  state.todoList.splice(idx, 1);
  saveKey('todoList');
  _renderAll();
  triggerSave();
  toast('任务已完成！');
}

// ── DELETE TODO ──
export function deleteTodoTask(id) {
  const idx = state.todoList.findIndex(t => t.id === id);
  if (idx === -1) return;
  if (!confirm('确认放弃该任务？')) return;
  state.todoList.splice(idx, 1);
  saveKey('todoList');
  renderTodoList();
  triggerSave();
  toast('任务已删除 ✓');
}

// ── RENDER TODO LIST ──
export function renderTodoList() {
  const today      = new Date().toISOString().split('T')[0];
  const todayTodos = state.todoList.filter(t => t.date === today);
  const otherTodos = state.todoList.filter(t => t.date !== today).sort((a, b) => b.date.localeCompare(a.date));
  const all        = [...todayTodos, ...otherTodos];

  const html = all.length === 0
    ? '<div style="color:var(--text3);font-size:12px;padding:12px 0">暂无待完成任务</div>'
    : all.map(t => {
        const colors   = {N:'var(--red)',A:'var(--text2)',B:'var(--amber)',C:'var(--blue)',D:'var(--purple)'};
        const bgColors = {N:'var(--red-dim)',A:'var(--bg3)',B:'var(--amber-dim)',C:'var(--blue-dim)',D:'var(--purple-dim)'};
        return `<div style="background:${bgColors[t.type]};border:1px solid var(--border);border-radius:10px;padding:12px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:500;color:var(--text);margin-bottom:4px">${t.note||'（无备注）'}</div>
            <div style="font-size:11px;color:var(--text3)">${t.date} · <span style="color:${colors[t.type]};font-weight:600">${typeLabels[t.type]}</span></div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm" style="background:${colors[t.type]};color:#fff;border-color:${colors[t.type]};padding:6px 14px;font-size:12px" onclick="completeTodoTask(${t.id})">✓ 完成</button>
            <button class="btn btn-sm btn-danger" style="padding:6px 10px;font-size:12px" onclick="deleteTodoTask(${t.id})">删</button>
          </div>
        </div>`;
      }).join('');

  document.getElementById('todo-list').innerHTML = html;
}
