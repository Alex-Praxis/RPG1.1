import { SCORES, TARGET } from './constants.js';
import { state } from './state.js';
import { calcPoints, rowScore, fmtMoney } from './compute.js';
import { renderTodoList } from './tasks.js';
import { renderDailiesForDashboard } from './dailies.js';

// ── RENDER DASHBOARD ──
export function renderDashboard() {
  const pts = calcPoints();
  document.getElementById('d-current').textContent = pts.current;
  document.getElementById('d-earned').textContent  = pts.earned;
  document.getElementById('d-spent').textContent   = pts.spent;
  document.getElementById('r-current').textContent = pts.current;

  // Points progress bar toward next reward
  const next = state.rewards.filter(r => !r.archived && r.cost > pts.current).sort((a, b) => a.cost - b.cost)[0];
  if (next && next.cost > 0) {
    const pct = Math.min(100, (pts.current / next.cost) * 100);
    document.getElementById('points-bar').style.width = pct + '%';
    document.getElementById('points-bar-hint').textContent = `距「${next.name}」还差 ${next.cost - pts.current} 分`;
  } else {
    document.getElementById('points-bar').style.width = '100%';
    document.getElementById('points-bar-hint').textContent = '';
  }

  // Finance summary on dashboard
  if (state.financeLog.length > 0) {
    const to  = state.financeLog.reduce((s, r) => s + (r.out    || 0), 0);
    const ti  = state.financeLog.reduce((s, r) => s + (r.income || 0), 0);
    const net = ti - to;
    document.getElementById('d-gold-content').innerHTML = `
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div><div style="font-size:11px;color:var(--text3)">净收入</div><div style="font-family:var(--mono);font-size:22px;font-weight:700;color:${net >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtMoney(net)}</div></div>
        <div><div style="font-size:11px;color:var(--text3)">总支出</div><div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--red)">${fmtMoney(to)}</div></div>
      </div>`;
  }

  // Countdown
  const now    = new Date();
  const ms     = Math.max(0, TARGET - now);
  const days   = Math.floor(ms / 86400000);
  const weeks  = Math.floor(days / 7);
  const months = Math.max(0, (TARGET.getFullYear() - now.getFullYear()) * 12 + TARGET.getMonth() - now.getMonth());
  document.getElementById('countdown-display').innerHTML =
    ['天','周','月'].map((l, i) =>
      `<div class="countdown-item"><div class="countdown-num">${[days, weeks, months][i]}</div><div class="countdown-label">${l}</div></div>`
    ).join('');

  // Recent log (last 10)
  const sorted = [...state.taskLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  document.getElementById('recent-log').innerHTML = sorted.length === 0
    ? '<tr><td colspan="9" style="color:var(--text3);text-align:center;padding:28px">暂无记录 — 快速录入开始</td></tr>'
    : sorted.map(e => {
        const sc  = rowScore(e);
        const col = sc >= 0 ? 'var(--green)' : 'var(--red)';
        const td  = k => e[k] ? `<span class="tag tag-${k}">${e[k]}</span>` : `<span style="color:var(--border2)">—</span>`;
        const idx = state.taskLog.indexOf(e);
        return `<tr>
          <td class="log-date">${e.date}</td>
          ${['N','A','B','C','D'].map(td).join('')}
          <td style="font-family:var(--mono);font-weight:700;color:${col}">${sc >= 0 ? '+' : ''}${sc}</td>
          <td style="color:var(--text2);font-size:12px">${e.note||''}</td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteTask(${idx})">删</button></td>
        </tr>`;
      }).join('');

  // Today summary
  const today = new Date().toISOString().split('T')[0];
  const te    = state.taskLog.filter(e => e.date === today);
  if (te.length > 0) {
    const totals = {N:0, A:0, B:0, C:0, D:0};
    te.forEach(e => ['N','A','B','C','D'].forEach(k => totals[k] += (e[k] || 0)));
    const total = Object.entries(SCORES).reduce((s, [k, v]) => s + totals[k] * v, 0);
    document.getElementById('today-preview').style.display = 'block';
    document.getElementById('today-empty').style.display   = 'none';
    document.getElementById('today-breakdown').innerHTML   =
      Object.entries(totals).filter(([, v]) => v > 0).map(([k, v]) => `<span class="tag tag-${k}">${k}×${v}</span>`).join('');
    const tc = document.getElementById('today-total');
    tc.textContent = (total >= 0 ? '+' : '') + total;
    tc.style.color = total >= 0 ? 'var(--green)' : 'var(--red)';
  } else {
    document.getElementById('today-preview').style.display = 'none';
    document.getElementById('today-empty').style.display   = 'block';
  }

  // 渲染仪表盘上的日常任务（并列显示）
  renderDailiesForDashboard();

  renderTodoList();
}
