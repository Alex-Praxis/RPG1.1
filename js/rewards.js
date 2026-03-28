import { TYPE_LABELS } from './constants.js';
import { state, saveKey } from './state.js';
import { calcPoints } from './compute.js';
import { triggerSave } from './sync.js';
import { toast, openModal, closeModal } from './ui.js';

// ── MODULE-PRIVATE ──
let _renderAll       = () => {};
let currentRewardId  = null;
let editingRewardId  = null;

export function init(renderAllFn) {
  _renderAll = renderAllFn;
}

// ── RENDER REWARDS ──
export function renderRewards() {
  const pts    = calcPoints();
  const filter = document.getElementById('reward-filter').value;
  let list = state.rewards.filter(r => !r.archived);
  if (filter === 'affordable') list = list.filter(r => r.cost <= pts.current);
  else if (filter !== 'all')   list = list.filter(r => r.type === filter);

  document.getElementById('reward-grid').innerHTML = list.length === 0
    ? '<div style="color:var(--text3);font-size:13px;padding:20px">暂无奖励</div>'
    : list.map(r => {
        const can = r.cost <= pts.current;
        return `<div class="reward-card${can ? ' affordable' : ''}" onclick="openRedeem('${r.id}')">
          <div class="reward-num">${r.id}</div>
          <button class="btn btn-sm" style="position:absolute;top:8px;right:8px;padding:2px 8px;font-size:10px;opacity:.55;z-index:1"
            onclick="event.stopPropagation();openEditReward('${r.id}')">✏</button>
          <div class="reward-name">${r.name}</div>
          <div class="reward-cost">${r.cost} <span style="font-size:12px;color:var(--text3)">pts</span></div>
          <div class="reward-meta">${r.rmb ? '¥' + r.rmb + ' · ' : ''}${TYPE_LABELS[r.type] || r.type}</div>
        </div>`;
      }).join('');

  const recent = [...state.redeemLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  document.getElementById('recent-redeems').innerHTML = recent.length === 0
    ? '<span style="color:var(--text3)">暂无记录</span>'
    : recent.map(r => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text)">${r.name}</span><span style="font-family:var(--mono);color:var(--red)">-${r.cost}</span></div>`).join('');

  document.getElementById('r-redeem-count').textContent = state.redeemLog.length;

  const sortedR = [...state.redeemLog].sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById('redeem-history').innerHTML = sortedR.length === 0
    ? '<tr><td colspan="6" style="color:var(--text3);text-align:center;padding:28px">暂无兑换记录</td></tr>'
    : sortedR.map(r => `<tr><td class="log-date">${r.date}</td><td style="color:var(--text3)">${r.rewardId}</td><td style="color:var(--text)">${r.name}</td><td>${r.qty}</td><td style="font-family:var(--mono);color:var(--red)">-${r.cost}</td><td style="color:var(--text2)">${r.feel||''}</td></tr>`).join('');
}

// ── OPEN REDEEM ──
export function openRedeem(id) {
  const r = state.rewards.find(x => x.id === id);
  if (!r) return;
  currentRewardId = id;
  document.getElementById('rd-qty').value   = 1;
  document.getElementById('rd-feel').value  = '';
  document.getElementById('redeem-info').innerHTML = `
    <div style="font-size:15px;font-weight:600;margin-bottom:6px;color:var(--text)">${r.name}</div>
    <div style="font-family:var(--mono);color:var(--amber);font-size:22px">${r.cost} pts</div>
    ${r.rmb ? `<div style="font-size:12px;color:var(--text3);margin-top:4px">另需 ¥${r.rmb}</div>` : ''}`;
  updateRedeemPreview();
  openModal('modal-redeem');
}

// ── UPDATE REDEEM PREVIEW ──
export function updateRedeemPreview() {
  const r = state.rewards.find(x => x.id === currentRewardId);
  if (!r) return;
  document.getElementById('rd-preview').textContent =
    '-' + (r.cost * (parseInt(document.getElementById('rd-qty').value) || 1));
}

// ── CONFIRM REDEEM ──
export function confirmRedeem() {
  const r = state.rewards.find(x => x.id === currentRewardId);
  if (!r) return;
  const pts   = calcPoints();
  const qty   = parseInt(document.getElementById('rd-qty').value) || 1;
  const total = r.cost * qty;
  if (total > pts.current) { toast('积分不足！'); return; }
  state.redeemLog.push({
    date: new Date().toISOString().split('T')[0],
    rewardId: r.id,
    name: r.name,
    qty,
    cost: total,
    feel: document.getElementById('rd-feel').value,
  });
  saveKey('redeemLog');
  closeModal('modal-redeem');
  _renderAll();
  triggerSave();
  toast(`兑换成功：${r.name} 🎉`);
}

// ── OPEN ADD REWARD ──
export function openAddReward() {
  editingRewardId = null;
  document.querySelector('#modal-reward .modal-title').textContent = '添加奖励';
  ['rw-name','rw-cost','rw-rmb'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('rw-min').value  = 1;
  document.getElementById('rw-type').value = 'exp';
  openModal('modal-reward');
}

// ── OPEN EDIT REWARD ──
export function openEditReward(id) {
  const r = state.rewards.find(x => x.id === id);
  if (!r) return;
  editingRewardId = id;
  document.querySelector('#modal-reward .modal-title').textContent = '修改奖励';
  document.getElementById('rw-name').value = r.name;
  document.getElementById('rw-cost').value = r.cost;
  document.getElementById('rw-rmb').value  = r.rmb || '';
  document.getElementById('rw-min').value  = r.min || 1;
  document.getElementById('rw-type').value = r.type;
  openModal('modal-reward');
}

// ── SAVE REWARD ──
export function saveReward() {
  const name = document.getElementById('rw-name').value.trim();
  if (!name) { toast('请填写奖励名称'); return; }
  const data = {
    name,
    cost: parseInt(document.getElementById('rw-cost').value) || 0,
    rmb:  parseInt(document.getElementById('rw-rmb').value)  || 0,
    min:  parseInt(document.getElementById('rw-min').value)  || 1,
    type: document.getElementById('rw-type').value,
  };
  if (editingRewardId) {
    const r = state.rewards.find(x => x.id === editingRewardId);
    if (r) Object.assign(r, data);
    editingRewardId = null;
    document.querySelector('#modal-reward .modal-title').textContent = '添加奖励';
    toast('奖励已更新 ✓');
  } else {
    const maxId = state.rewards.reduce((m, r) => Math.max(m, parseInt(r.id) || 0), 0);
    state.rewards.push({ id: String(maxId + 1).padStart(3, '0'), ...data, archived: false });
    toast('奖励已添加 ✓');
  }
  saveKey('rewards');
  closeModal('modal-reward');
  renderRewards();
  triggerSave();
}
