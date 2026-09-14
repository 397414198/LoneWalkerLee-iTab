(function(){
  const $=s=>document.querySelector(s);
  const dlg=$("#searchCenterDlg"), input=$("#centerQuery");
  if(!dlg||!input)return;
  const engines={
    bing:q=>`https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    google:q=>`https://www.google.com/search?q=${encodeURIComponent(q)}`,
    baidu:q=>`https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
    so:q=>`https://www.so.com/s?q=${encodeURIComponent(q)}`,
    github:q=>`https://github.com/search?q=${encodeURIComponent(q)}&type=repositories`,
    bilibili:q=>`https://search.bilibili.com/all?keyword=${encodeURIComponent(q)}`
  };
  function remember(q){
    q=String(q||'').trim(); if(!q)return;
    try{let a=JSON.parse(localStorage.getItem('itab_search_history_v1')||'[]').filter(x=>x!==q);a.unshift(q);localStorage.setItem('itab_search_history_v1',JSON.stringify(a.slice(0,12)))}catch{}
  }
  function openEngine(key,q){
    if(key==='chatgpt'){window.open(`https://chatgpt.com/?q=${encodeURIComponent(q)}`,'_blank','noopener');return}
    if(key==='googleTranslate'){window.open(`https://translate.google.com/?sl=auto&tl=zh-CN&text=${encodeURIComponent(q)}`,'_blank','noopener');return}
    let fn=engines[key];if(fn)window.open(fn(q),'_blank','noopener');
  }
  function selected(){return [...dlg.querySelectorAll('.engineCheck input:checked')].map(x=>x.value)}
  $('#centerAll').onclick=()=>{let q=input.value.trim();if(!q){input.focus();return}let list=selected();if(!list.length){alert('至少选择一个搜索引擎');return}remember(q);list.forEach((x,i)=>setTimeout(()=>openEngine(x,q),i*90));};
  dlg.querySelectorAll('[data-center-engine]').forEach(b=>b.onclick=()=>{let q=input.value.trim();if(!q){input.focus();return}remember(q);openEngine(b.dataset.centerEngine,q)});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#centerAll').click()}});
  window.openSearchCenter=()=>{input.value=$('#query')?.value||'';dlg.showModal();setTimeout(()=>input.focus(),50)};
  $('#searchCenterBtn')?.addEventListener('click',window.openSearchCenter);
})();
