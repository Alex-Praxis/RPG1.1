import { getAppData, applyCloudData, triggerSave } from './sync.js';
import { toast } from './ui.js';

// ── EXPORT ──
export function exportData() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(getAppData(), null, 2)], {type: 'application/json'})
  );
  a.download = `os-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('备份已导出 ✓');
}

// ── IMPORT ──
export function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.taskLog && !data.redeemLog) { toast('文件格式不正确'); return; }
      if (!confirm(`确认导入？时间：${data.updatedAt || data.exportedAt || '未知'}\n当前数据将被覆盖。`)) return;
      applyCloudData(data);
      triggerSave();
      toast('导入成功 ✓');
    } catch {
      toast('文件解析失败');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
