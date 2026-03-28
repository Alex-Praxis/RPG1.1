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
  // Highlight selected item in dropdown
  document.querySelectorAll('.diff-item').forEach(btn => btn.classList.remove('selected'));
  const item = document.getElementById('type-btn-' + type);
  if (item) item.classList.add('selected');
  // Update toggle label
  const label = document.getElementById('difficulty-label');
  if (label) { label.textContent = typeLabels[type]; label.style.color = TYPE_COLORS[type]; }
  // Close dropdown
  const dropdown = document.getElementById('difficulty-dropdown');
  if (dropdown) dropdown.classList.remove('open');
  // Enable action buttons
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
  document.querySelectorAll('.diff-item').forEach(btn => btn.classList.remove('selected'));
  const label = document.getElementById('difficulty-label');
  if (label) { label.textContent = '选择难度 ▾'; label.style.color = ''; }
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
    ? `<div style="text-align:center;padding:32px 16px;color:var(--text3)">
        <div style="font-size:26px;margin-bottom:8px">☑</div>
        <div style="font-size:12px">暂无待办任务</div>
      </div>`
    : all.map(t => {
        const colors = {N:'var(--red)',A:'var(--text2)',B:'var(--amber)',C:'var(--blue)',D:'var(--purple)'};
        const color  = colors[t.type];
        return `<div class="habit-card">
          <div class="habit-check" style="background:${color}" onclick="completeTodoTask(${t.id})">✓</div>
          <div class="habit-body">
            <div class="habit-name">${t.note||'（无备注）'}</div>
            <div class="habit-meta">
              <span>${t.date}</span>
              <span class="tag tag-${t.type}">${typeLabels[t.type]}</span>
            </div>
          </div>
          <div class="habit-right">
            <button class="btn btn-sm btn-danger" style="padding:4px 9px;font-size:11px" onclick="deleteTodoTask(${t.id})">删</button>
          </div>
        </div>`;
      }).join('');

  document.getElementById('todo-list').innerHTML = html;
  const badge = document.getElementById('todo-count');
  if (badge) badge.textContent = all.length;
}
