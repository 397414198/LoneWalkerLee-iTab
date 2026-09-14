/* LoneWalkerLee iTab 5.2 · 数据备份模块 */
(function(){
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]));
  const getAdmin = () => window.S && window.S.admin;
  const api = async (path, options={}) => {
    options.headers = {'content-type':'application/json', ...(options.headers||{})};
    if(getAdmin()) options.headers['x-admin-password'] = getAdmin();
    const r = await fetch(path, options);
    const d = await r.json().catch(()=>({}));
    if(!r.ok) throw Error(d.error || '请求失败');
    return d;
  };

  function triggerDownload(name, text){
    const blob = new Blob([text], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  async function exportData(){
    if(!getAdmin()) { alert('请先进入管理员模式'); return; }
    try{
      const data = await api('/api/backup');
      const name = 'LoneWalkerLee-iTab-backup-' + new Date().toISOString().slice(0,10) + '.json';
      triggerDownload(name, JSON.stringify(data, null, 2));
      $('#backupStatus').textContent = '✅ 备份已生成：' + name;
    }catch(e){ alert('导出失败：' + e.message); }
  }

  async function importData(file){
    if(!getAdmin()) { alert('请先进入管理员模式'); return; }
    if(!file) return;
    try{
      const text = await file.text();
      const data = JSON.parse(text);
      if(data.format !== 'LoneWalkerLee-iTab-backup' || !data.data) throw Error('这不是有效的 iTab 备份文件');
      const d = data.data;
      if(!Array.isArray(d.categories) || !Array.isArray(d.sites) || !Array.isArray(d.widgets)) throw Error('备份文件结构不完整');
      if(!confirm('确定恢复这份备份吗？\n\n当前云端的网站、分类、设置和小组件将被备份内容覆盖。\n此操作不可撤销，请先确保已经导出当前数据。')) return;
      $('#backupStatus').textContent = '⏳ 正在恢复云端数据…';
      const result = await api('/api/backup', {method:'POST', body:JSON.stringify(data)});
      $('#backupStatus').textContent = '✅ 恢复完成：' + result.counts.categories + ' 个分类、' + result.counts.sites + ' 个网站、' + result.counts.widgets + ' 个小组件';
      if(typeof window.load === 'function') await window.load();
      else location.reload();
    }catch(e){
      $('#backupStatus').textContent = '❌ 恢复失败';
      alert('导入失败：' + e.message);
    }
  }

  window.openBackup = function(){
    if(!getAdmin()) { alert('请先进入管理员模式'); return; }
    const d = $('#backupDlg');
    if(d) d.showModal();
  };
  window.exportBackup = exportData;
  window.handleBackupFile = e => importData(e.target.files[0]);

  document.addEventListener('DOMContentLoaded', ()=>{
    const btn = $('#backupBtn');
    if(btn) btn.addEventListener('click', window.openBackup);
  });
})();
