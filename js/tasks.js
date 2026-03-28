import { TYPE_COLORS, typeLabels } from './constants.js';
import { state, saveKey } from './state.js';
import { triggerSave } from './sync.js';
import { toast } from './ui.js';

// ── MODULE-PRIVATE ──
let _renderAll   = () => {};
let selectedType = null;
let stepCounter  = 0;

export function init(renderAllFn) {
  _renderAll = renderAllFn;
}

// ── TYPE SELECTION ──
export function selectType(type) {
  selectedType = type;
  document.querySelectorAll('.diff-item').forEach(btn => btn.classList.remove('selected'));
  const item = document.getElementById('type-btn-' + type);
  if (item) item.classList.add('selected');
  const label = document.getElementById('difficulty-label');
  if (label) { label.textContent = typeLabels[type]; label.style.color = TYPE_COLORS[type]; }
  const dropdown = document.getElementById('difficulty-dropdown');
  if (dropdown) dropdown.classList.remove('open');
  const btnDone = document.getElementById('action-done');
  const btnTodo = document.getElementById('action-todo');
  btnDone.disabled = false; btnDone.style.opacity = '1'; btnDone.style.cursor = 'pointer';
  btnTodo.disabled = false; btnTodo.style.opacity = '1'; btnTodo.style.cursor = 'pointer';
}

// ── STEP MANAGEMENT (for quick entry form) ──
export function addStep() {
  const container = document.getElementById('steps-container');
  const inputs    = document.getElementById('step-inputs');
  if (!container || !inputs) return;
  container.style.display = 'block';
  const id  = ++stepCounter;
  const row = document.createElement('div');
  row.id = `step-row-${id}`;
  row.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:6px';
  row.innerHTML = `
    <input type="text" id="step-text-${id}" placeholder="步骤描述…" style="flex:1;font-size:12px">
    <button class="btn btn-sm btn-danger" style="padding:4px 9px;flex-shrink:0" onclick="removeStep(${id})">×</button>`;
  inputs.appendChild(row);
  document.getElementById(`step-text-${id}`).focus();
}

export function removeStep(id) {
  document.getElementById(`step-row-${id}`)?.remove();
  const inputs = document.getElementById('step-inputs');
  if (inputs && inputs.children.length === 0) {
    document.getElementById('steps-container').style.display = 'none';
  }
}

// ── TOGGLE STEP DONE ──
export function toggleStep(todoId, stepId) {
  const task = state.todoList.find(t => t.id === todoId);
  if (!task?.steps) return;
  const step = task.steps.find(s => s.id === stepId);
  if (!step) return;
  step.done = !step.done;
  saveKey('todoList');
  renderTodoList();
  triggerSave();
}

// ── SUBMIT TASK ──
export function submitTask(action) {
  if (!selectedType) return;
  const date = document.getElementById('entry-date').value || new Date().toISOString().split('T')[0];
  const note = document.getElementById('entry-note').value;

  if (action === 'todo') {
    // Collect steps from form inputs
    const steps = Array.from(document.querySelectorAll('[id^="step-text-"]'))
      .map(input => input.value.trim())
      .filter(Boolean)
      .map((text, i) => ({ id: Date.now() + i + 1, text, done: false }));
    state.todoList.push({ id: Date.now(), date, type: selectedType, note, steps });
    saveKey('todoList');
    renderTodoList();
    triggerSave();
    toast(`已加入待办：${typeLabels[selectedType]}`);
  } else {
    const entry = { date, note, N:0, A:0, B:0, C:0, D:0 };
    entry[selectedType] = 1;
    state.taskLog.push(entry);
    saveKey('taskLog');
    _renderAll();
    triggerSave();
    toast(`已记录完成：${typeLabels[selectedType]}`);
  }

  // 重置表单
  document.getElementById('entry-note').value = '';
  document.getElementById('step-inputs').innerHTML = '';
  document.getElementById('steps-container').style.display = 'none';
  stepCounter = 0;
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
  const entry = { date: task.date, note: task.note, N:0, A:0, B:0, C:0, D:0 };
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
        const colors = { N:'var(--red)', A:'var(--text2)', B:'var(--amber)', C:'var(--blue)', D:'var(--purple)' };
        const color  = colors[t.type];
        const steps  = t.steps || [];
        const doneCount = steps.filter(s => s.done).length;

        // 步骤进度角标
        const progressBadge = steps.length > 0
          ? `<span style="font-size:10px;font-family:var(--mono);color:${doneCount===steps.length?'var(--green)':'var(--text3)'};background:var(--bg3);border:1px solid var(--border);border-radius:20px;padding:1px 7px">${doneCount}/${steps.length}</span>`
          : '';

        // 子步骤列表
        const stepsHtml = steps.length > 0
          ? `<div style="margin-top:8px;display:grid;gap:4px">
              ${steps.map(s => `
                <div style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:2px 0" onclick="toggleStep(${t.id},${s.id})">
                  <div style="width:13px;height:13px;border-radius:3px;border:1.5px solid ${s.done ? color : 'var(--border2)'};background:${s.done ? color : 'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s">
                    ${s.done ? '<span style="color:#fff;font-size:9px;line-height:1">✓</span>' : ''}
                  </div>
                  <span style="font-size:12px;color:var(--text2);${s.done ? 'text-decoration:line-through;opacity:.45' : ''}">${s.text}</span>
                </div>`).join('')}
            </div>`
          : '';

        return `<div class="habit-card">
          <div class="habit-check" style="background:${color}" onclick="completeTodoTask(${t.id})">✓</div>
          <div class="habit-body">
            <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
              <span class="habit-name" style="flex:1;min-width:0">${t.note||'（无备注）'}</span>
              ${progressBadge}
            </div>
            ${stepsHtml}
            <div class="habit-meta" style="margin-top:${steps.length?'8px':'3px'}">
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
