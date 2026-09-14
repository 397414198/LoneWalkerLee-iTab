(() => {
  const presets = [
    {name:'极光',url:'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2400&q=85'},
    {name:'雪山',url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=85'},
    {name:'森林',url:'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=85'},
    {name:'星空',url:'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=85'},
    {name:'海边',url:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=85'},
    {name:'城市',url:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2400&q=85'},
    {name:'沙漠',url:'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=2400&q=85'},
    {name:'极简',url:'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=2400&q=85'}
  ];
  window.WALLPAPERS = presets;
  function applyBackground(url){
    const bg=document.querySelector('#bg');
    if(!bg)return;
    bg.style.backgroundImage=url?`url("${String(url).replace(/"/g,'&quot;')}")`:'';
    document.body.classList.toggle('custom-bg',!!url);
  }
  async function saveWallpaper(url){
    if(!window.requireAdmin())return;
    try{
      await window.api('/api/settings',{method:'POST',body:JSON.stringify({background_url:url||'',search_engine:window.S.settings?.search_engine||'https://www.bing.com/search?q=',theme:'glass'})});
      window.S.settings=Object.assign({},window.S.settings,{background_url:url||''});
      window.saveLocal?.(); applyBackground(url); renderWallpaperDialog();
    }catch(e){alert(e.message)}
  }
  function renderWallpaperDialog(){
    const box=document.querySelector('#wallpaperPresets'); if(!box)return;
    const current=window.S?.settings?.background_url||'';
    box.innerHTML=presets.map((x,i)=>`<button type="button" class="wallCard ${current===x.url?'selected':''}" data-i="${i}" style="background-image:url('${x.url}')"><span>${x.name}</span></button>`).join('');
    box.querySelectorAll('.wallCard').forEach(b=>b.onclick=()=>saveWallpaper(presets[+b.dataset.i].url));
    const input=document.querySelector('#wallUrl'); if(input)input.value=current;
  }
  window.openWallpaper=()=>{if(!window.requireAdmin())return;renderWallpaperDialog();document.querySelector('#wallDlg')?.showModal()};
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelector('#wallpaperBtn')?.addEventListener('click',window.openWallpaper);
    document.querySelector('#randomWallBtn')?.addEventListener('click',()=>{const p=presets[Math.floor(Math.random()*presets.length)];saveWallpaper(p.url)});
    document.querySelector('#clearWallBtn')?.addEventListener('click',()=>saveWallpaper(''));
    document.querySelector('#wallForm')?.addEventListener('submit',e=>{e.preventDefault();saveWallpaper(document.querySelector('#wallUrl').value.trim())});
  });
  window.applyWallpaper=applyBackground;
})();
