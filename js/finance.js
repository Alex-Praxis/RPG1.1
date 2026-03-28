import { state, saveKey } from './state.js';
import { fmtMoney } from './compute.js';
import { triggerSave } from './sync.js';
import { toast } from './ui.js';

// ── MODULE-PRIVATE ──
let _renderAll = () => {};

export function init(renderAllFn) {
  _renderAll = renderAllFn;
}

// ── RENDER FINANCE ──
export function renderFinance() {
  const to  = state.financeLog.reduce((s, r) => s + (r.out    || 0), 0);
  const ti  = state.financeLog.reduce((s, r) => s + (r.income || 0), 0);
  const net = ti - to;

  let days = 1;
  if (state.financeLog.length > 0) {
    const dates = state.financeLog.map(r => new Date(r.month + '-01')).sort((a, b) => a - b);
    days = Math.max(1, Math.round((new Date() - dates[0]) / 86400000));
  }

  document.getElementById('f-total-out').textContent = fmtMoney(to);
  document.getElementById('f-total-in').textContent  = fmtMoney(ti);
  document.getElementById('f-total-net').textContent = fmtMoney(net);
  document.getElementById('f-total-net').style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('f-daily-out').textContent = '¥' + (to  / days).toFixed(1);
  document.getElementById('f-daily-in').textContent  = '¥' + (net / days).toFixed(1);

  const bt = state.budget.reduce((s, b) => s + b.amount, 0);
  document.getElementById('budget-list').innerHTML =
    state.budget.map((b, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
        <span style="color:var(--text2)">${b.name}</span>
        <div style="display:flex;gap:6px;align-items:center">
          <span style="font-family:var(--mono);color:var(--text)">¥${b.amount}</span>
          <button class="btn btn-sm" style="padding:3px 8px;font-size:11px" onclick="editBudgetItem(${i})">改</button>
          <button class="btn btn-sm btn-danger" style="padding:3px 8px;font-size:11px" onclick="deleteBudgetItem(${i})">删</button>
        </div>
      </div>`).join('') +
    `<div style="display:flex;justify-content:flex-end;padding:10px 0;border-top:1px solid var(--border);font-size:13px">
      <button class="btn btn-sm btn-primary" style="padding:5px 12px;font-size:11px" onclick="addBudgetItem()">+ 新增预算</button>
    </div>`;

  document.getElementById('budget-total').textContent = '¥' + bt.toLocaleString();

  const sorted = [...state.financeLog].sort((a, b) => b.month.localeCompare(a.month));
  document.getElementById('finance-log').innerHTML = sorted.length === 0
    ? '<tr><td colspan="6" style="color:var(--text3);text-align:center;padding:28px">暂无记录</td></tr>'
    : sorted.map(r => {
        const n = (r.income || 0) - (r.out || 0);
        return `<tr>
          <td class="log-date">${r.month}</td>
          <td style="font-family:var(--mono);color:var(--red)">${fmtMoney(r.out || 0)}</td>
          <td style="font-family:var(--mono);color:var(--green)">${fmtMoney(r.income || 0)}</td>
          <td style="font-family:var(--mono);color:${n >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtMoney(n)}</td>
          <td style="color:var(--text2);font-size:12px">${r.note || ''}</td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteFinance('${r.month}')">删除</button></td>
        </tr>`;
      }).join('');
}

// ── ADD FINANCE ENTRY ──
export function addFinanceEntry() {
  const month = document.getElementById('f-month').value;
  if (!month) { toast('请选择月份'); return; }
  state.financeLog = state.financeLog.filter(r => r.month !== month);
  state.financeLog.push({
    month,
    out:    parseFloat(document.getElementById('f-out').value)  || 0,
    income: parseFloat(document.getElementById('f-in').value)   || 0,
    note:   document.getElementById('f-note').value,
  });
  saveKey('financeLog');
  ['f-out', 'f-in', 'f-note'].forEach(id => document.getElementById(id).value = '');
  _renderAll();
  triggerSave();
  toast('财务记录已保存 ✓');
}

// ── DELETE FINANCE ──
export function deleteFinance(month) {
  if (!confirm('确认删除该月记录？')) return;
  state.financeLog = state.financeLog.filter(r => r.month !== month);
  saveKey('financeLog');
  _renderAll();
  triggerSave();
}

// ── BUDGET CRUD ──
export function editBudgetItem(idx) {
  const b = state.budget[idx];
  const newAmount = prompt(`编辑 ${b.name} 的月度预算（当前：¥${b.amount}）`, b.amount);
  if (newAmount === null) return;
  const amt = parseInt(newAmount);
  if (isNaN(amt) || amt < 0) { toast('请输入有效的金额'); return; }
  state.budget[idx].amount = amt;
  saveKey('budget');
  renderFinance();
  triggerSave();
  toast('预算已更新 ✓');
}

export function deleteBudgetItem(idx) {
  const b = state.budget[idx];
  if (!confirm(`确认删除「${b.name}」？`)) return;
  state.budget.splice(idx, 1);
  saveKey('budget');
  renderFinance();
  triggerSave();
  toast('预算项已删除 ✓');
}

export function addBudgetItem() {
  const name = prompt('新预算项名称：');
  if (!name || !name.trim()) return;
  const amount = prompt(`${name} 的月度金额：`);
  if (amount === null) return;
  const amt = parseInt(amount);
  if (isNaN(amt) || amt < 0) { toast('请输入有效的金额'); return; }
  state.budget.push({name: name.trim(), amount: amt});
  saveKey('budget');
  renderFinance();
  triggerSave();
  toast('预算项已添加 ✓');
}
