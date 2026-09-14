(()=>{
const $=s=>document.querySelector(s), dlg=$('#toolsDlg');
if(!dlg)return;
$('#toolsBtn').onclick=()=>{dlg.showModal();updateTime();convertUnit()};
dlg.querySelectorAll('.toolTab').forEach(b=>b.onclick=()=>{dlg.querySelectorAll('.toolTab').forEach(x=>x.classList.remove('active'));dlg.querySelectorAll('.toolPane').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#tool-'+b.dataset.tool).classList.add('active');if(b.dataset.tool==='time')updateTime()});
const copy=async v=>{try{await navigator.clipboard.writeText(v);return true}catch{return false}};
$('#jsonFormat').onclick=()=>jsonDo(2); $('#jsonMinify').onclick=()=>jsonDo(0); $('#jsonCopy').onclick=()=>copy($('#jsonOutput').value);
function jsonDo(space){try{let x=JSON.parse($('#jsonInput').value);$('#jsonOutput').value=JSON.stringify(x,null,space)}catch(e){$('#jsonOutput').value='JSON 错误：'+e.message}}
function updateTime(){let d=new Date(),sec=Math.floor(d.getTime()/1000),ms=d.getTime();$('#timeNow').innerHTML=`当前时间：<b>${d.toLocaleString('zh-CN')}</b><br>秒级时间戳：<b>${sec}</b><br>毫秒时间戳：<b>${ms}</b>`}
$('#timeRefresh').onclick=updateTime; $('#timeCopy').onclick=()=>copy(String(Math.floor(Date.now()/1000)));
$('#timeInput').oninput=()=>{let v=Number($('#timeInput').value);if(!Number.isFinite(v))return;let ms=String(Math.trunc(v)).length<=10?v*1000:v;let d=new Date(ms);$('#timeConverted').textContent=isNaN(d.getTime())?'无法识别':d.toLocaleString('zh-CN',{hour12:false})};
const cn=['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'];
function four(n){let s='',u=['仟','佰','拾',''];String(n).padStart(4,'0').split('').map(Number).forEach((d,i)=>{if(d){if(s&&s.slice(-1)!=='零')s+='';s+=cn[d]+u[i]}else if(s&&!s.endsWith('零'))s+='零'});return s.replace(/零+$/,'')}
function money(v){v=Number(v);if(!Number.isFinite(v)||v<0||v>999999999999999.99)return '请输入 0～999999999999999.99 的金额';let [a,b='']=v.toFixed(2).split('.');let units=['','万','亿','兆'],groups=[];while(a.length){groups.unshift(a.slice(-4));a=a.slice(0,-4)}let out='';groups.forEach((g,i)=>{let n=Number(g);if(!n)return;let gap=out&&!out.endsWith('零')&&n<1000?'零':'';out+=gap+four(n)+units[groups.length-1-i]});let jiao=Number(b[0]),fen=Number(b[1]);out=out.replace(/零$/,'')+'元';if(!jiao&&!fen)return out+'整';if(jiao)out+=cn[jiao]+'角';if(fen)out+=(jiao?'':'零')+cn[fen]+'分';return out}
$('#rmbInput').oninput=()=>$('#rmbOutput').textContent=money($('#rmbInput').value);
$('#b64Encode').onclick=()=>{try{$('#b64Output').value=btoa(unescape(encodeURIComponent($('#b64Input').value)))}catch(e){$('#b64Output').value=e.message}};
$('#b64Decode').onclick=()=>{try{$('#b64Output').value=decodeURIComponent(escape(atob($('#b64Input').value.trim())))}catch(e){$('#b64Output').value='解码失败：'+e.message}};
$('#urlEncode').onclick=()=>$('#urlOutput').value=encodeURIComponent($('#urlInput').value);$('#urlDecode').onclick=()=>{try{$('#urlOutput').value=decodeURIComponent($('#urlInput').value)}catch(e){$('#urlOutput').value='解码失败：'+e.message}};
const factor={b:1,kb:1024,mb:1024**2,gb:1024**3};function convertUnit(){let v=Number($('#unitValue').value),f=$('#unitFrom').value,t=$('#unitTo').value;$('#unitOutput').textContent=Number.isFinite(v)?`${(v*factor[f]/factor[t]).toLocaleString('zh-CN',{maximumFractionDigits:8})} ${t.toUpperCase()}`:'请输入数字'};['unitValue','unitFrom','unitTo'].forEach(id=>$('#'+id).addEventListener('input',convertUnit));
})();