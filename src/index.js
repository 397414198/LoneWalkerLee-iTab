import { neon } from "@neondatabase/serverless";
const j=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json;charset=UTF-8","cache-control":"no-store"}});
const db=e=>{if(!e.DATABASE_URL)throw Error("DATABASE_URL is not configured");return neon(e.DATABASE_URL)};
const admin=(r,e)=>!!e.ADMIN_PASSWORD&&r.headers.get("x-admin-password")===e.ADMIN_PASSWORD;

async function init(e){
 const q=db(e);
 await q`CREATE TABLE IF NOT EXISTS categories(id SERIAL PRIMARY KEY,name VARCHAR(50) NOT NULL,sort_order INTEGER DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
 await q`CREATE TABLE IF NOT EXISTS sites(id SERIAL PRIMARY KEY,title VARCHAR(100) NOT NULL,url TEXT NOT NULL,icon TEXT DEFAULT '🔗',category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,sort_order INTEGER DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
 await q`CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY DEFAULT 1,background_url TEXT DEFAULT '',search_engine TEXT DEFAULT 'https://www.bing.com/search?q=',theme VARCHAR(30) DEFAULT 'glass',updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
 await q`CREATE TABLE IF NOT EXISTS widgets(id SERIAL PRIMARY KEY,widget_key VARCHAR(50) NOT NULL,widget_title VARCHAR(100) NOT NULL,grid_w INTEGER NOT NULL DEFAULT 1,grid_h INTEGER NOT NULL DEFAULT 1,sort_order INTEGER NOT NULL DEFAULT 0,config JSONB NOT NULL DEFAULT '{}'::jsonb,enabled BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
 const c=await q`SELECT COUNT(*)::int n FROM categories`;if(!c[0].n)await q`INSERT INTO categories(name,sort_order) VALUES('常用',1),('AI',2),('工具',3),('娱乐',4),('工作',5)`;
 const s=await q`SELECT id FROM settings WHERE id=1`;if(!s.length)await q`INSERT INTO settings(id) VALUES(1)`;
 const w=await q`SELECT id FROM widgets LIMIT 1`;if(!w.length)await q`INSERT INTO widgets(widget_key,widget_title,grid_w,grid_h,sort_order,config) VALUES
 ('weather','增强天气',2,1,1,'{"city":"当前位置","lat":null,"lon":null}'::jsonb),
 ('calendar','日历',1,2,2,'{"showLunar":true,"showHoliday":true}'::jsonb),
 ('work','下班倒计时',1,1,3,'{"workStart":"08:30","workEnd":"17:30","dailySalary":300}'::jsonb)`;
}


async function hotApi(r){
 const source=new URL(r.url).searchParams.get("source")||"baidu";
 const cfg={
  baidu:{url:"https://www.baidu.com/s?wd=",home:"https://top.baidu.com/board?tab=realtime"},
  weibo:{url:"https://s.weibo.com/weibo?q=",home:"https://s.weibo.com/top/summary"},
  douyin:{url:"https://www.douyin.com/search/",home:"https://www.douyin.com/hot"},
  zhihu:{url:"https://www.zhihu.com/search?type=content&q=",home:"https://www.zhihu.com/hot"}
 }[source]||null;
 if(!cfg)return j({items:[],home:"https://top.baidu.com/board?tab=realtime"});
 try{
  let endpoint=source==="zhihu"?"https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=20":source==="weibo"?"https://weibo.com/ajax/side/hotSearch":source==="douyin"?"https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp":"https://top.baidu.com/api/board?platform=wise&tab=realtime";
  let rr=await fetch(endpoint,{headers:{"user-agent":"Mozilla/5.0","accept":"application/json,text/plain,*/*"}});
  if(!rr.ok)throw Error("upstream "+rr.status);
  let text=await rr.text(),data;try{data=JSON.parse(text)}catch{data=null}
  let items=[];
  if(source==="zhihu"&&data?.data)items=data.data.map(x=>({title:x.target?.title||x.title||"",hot:x.detail_text||"",url:x.target?.url||cfg.home}));
  else if(source==="weibo"&&data?.data?.realtime)items=data.data.realtime.map(x=>({title:x.word||x.note||"",hot:x.num||x.raw_hot||"",url:"https://s.weibo.com/weibo?q="+encodeURIComponent(x.word||"")}));
  else if(source==="douyin"&&data?.data?.word_list)items=data.data.word_list.map(x=>({title:x.word||"",hot:x.hot_value||x.hot_value_str||"",url:"https://www.douyin.com/search/"+encodeURIComponent(x.word||"")}));
  else if(source==="baidu"&&data?.data?.cards){let arr=data.data.cards.flatMap(x=>x.content||[]);items=arr.map(x=>({title:x.word||x.desc||"",hot:x.hotScore||x.hotTag||"",url:"https://www.baidu.com/s?wd="+encodeURIComponent(x.word||"")}));}
  return j({source,items:items.filter(x=>x.title).slice(0,20),home:cfg.home});
 }catch(e){return j({source,items:[],home:cfg.home,error:"热榜接口暂时不可用"})}
}

async function api(r,e){try{
 await init(e);const q=db(e),u=new URL(r.url),p=u.pathname,m=r.method;
 if(p==="/api/hot"&&m==="GET")return hotApi(r);
 if(p==="/api/data"&&m==="GET"){
  const [categories,sites,settings]=await Promise.all([
   q`SELECT * FROM categories ORDER BY sort_order,id`,
   q`SELECT * FROM sites ORDER BY category_id NULLS LAST,sort_order,id`,
   q`SELECT * FROM settings WHERE id=1`
  ]);return j({categories,sites,settings:settings[0]||null});
 }
 if(p==="/api/widgets"&&m==="GET")return j(await q`SELECT * FROM widgets WHERE enabled=TRUE ORDER BY sort_order,id`);
 if(!admin(r,e)&&m!=="GET")return j({error:"需要管理员密码"},401);

 if(p==="/api/sites"&&m==="POST"){const b=await r.json();if(!b.title||!b.url)return j({error:"标题和网址不能为空"},400);const x=await q`INSERT INTO sites(title,url,icon,category_id,sort_order) VALUES(${b.title},${b.url},${b.icon||"🔗"},${b.category_id||null},${b.sort_order||0}) RETURNING *`;return j(x[0],201)}
 let x=p.match(/^\/api\/sites\/(\d+)$/);if(x&&m==="DELETE"){await q`DELETE FROM sites WHERE id=${+x[1]}`;return j({ok:true})}
 if(x&&m==="PUT"){const b=await r.json(),z=await q`UPDATE sites SET title=${b.title},url=${b.url},icon=${b.icon||"🔗"},category_id=${b.category_id||null},sort_order=${b.sort_order||0},updated_at=CURRENT_TIMESTAMP WHERE id=${+x[1]} RETURNING *`;return z[0]?j(z[0]):j({error:"网站不存在"},404)}
 if(p==="/api/categories"&&m==="POST"){const b=await r.json();if(!b.name)return j({error:"分类不能为空"},400);const z=await q`INSERT INTO categories(name,sort_order) VALUES(${b.name},${b.sort_order||0}) RETURNING *`;return j(z[0],201)}
 x=p.match(/^\/api\/categories\/(\d+)$/);if(x&&m==="DELETE"){await q`DELETE FROM categories WHERE id=${+x[1]}`;return j({ok:true})}
 if(p==="/api/settings"&&m==="POST"){const b=await r.json(),z=await q`INSERT INTO settings(id,background_url,search_engine,theme) VALUES(1,${b.background_url||""},${b.search_engine||"https://www.bing.com/search?q="},${b.theme||"glass"}) ON CONFLICT(id) DO UPDATE SET background_url=EXCLUDED.background_url,search_engine=EXCLUDED.search_engine,theme=EXCLUDED.theme,updated_at=CURRENT_TIMESTAMP RETURNING *`;return j(z[0])}

 if(p==="/api/backup"&&m==="GET"){
  const [categories,sites,settings,widgets]=await Promise.all([
   q`SELECT * FROM categories ORDER BY sort_order,id`,
   q`SELECT * FROM sites ORDER BY category_id NULLS LAST,sort_order,id`,
   q`SELECT * FROM settings WHERE id=1`,
   q`SELECT * FROM widgets ORDER BY sort_order,id`
  ]);
  return j({format:"LoneWalkerLee-iTab-backup",version:1,exportedAt:new Date().toISOString(),data:{categories,sites,settings:settings[0]||null,widgets}});
 }
 if(p==="/api/backup"&&m==="POST"){
  const body=await r.json();
  const d=body&&body.data;
  if(body?.format!=="LoneWalkerLee-iTab-backup"||!d)return j({error:"无效的备份文件"},400);
  if(!Array.isArray(d.categories)||!Array.isArray(d.sites)||!Array.isArray(d.widgets))return j({error:"备份文件结构不完整"},400);
  if(d.categories.length>200||d.sites.length>2000||d.widgets.length>100)return j({error:"备份数据数量异常，拒绝导入"},400);
  for(const c of d.categories){if(!Number.isInteger(+c.id)||!String(c.name||"").trim())return j({error:"分类数据无效"},400)}
  for(const s of d.sites){if(!Number.isInteger(+s.id)||!String(s.title||"").trim()||!String(s.url||"").trim())return j({error:"网站数据无效"},400)}
  for(const w of d.widgets){if(!Number.isInteger(+w.id)||!String(w.widget_key||"").trim()||!String(w.widget_title||"").trim())return j({error:"小组件数据无效"},400)}
  const tx=[];
  tx.push(q`DELETE FROM sites`);
  tx.push(q`DELETE FROM widgets`);
  tx.push(q`DELETE FROM categories`);
  tx.push(q`DELETE FROM settings WHERE id=1`);
  for(const c of d.categories) tx.push(q`INSERT INTO categories(id,name,sort_order,created_at) VALUES(${+c.id},${String(c.name)},${+c.sort_order||0},${c.created_at||new Date().toISOString()})`);
  for(const s of d.sites) tx.push(q`INSERT INTO sites(id,title,url,icon,category_id,sort_order,created_at,updated_at) VALUES(${+s.id},${String(s.title)},${String(s.url)},${s.icon||"🔗"},${s.category_id==null?null:+s.category_id},${+s.sort_order||0},${s.created_at||new Date().toISOString()},${s.updated_at||new Date().toISOString()})`);
  if(d.settings) tx.push(q`INSERT INTO settings(id,background_url,search_engine,theme,updated_at) VALUES(1,${d.settings.background_url||""},${d.settings.search_engine||"https://www.bing.com/search?q="},${d.settings.theme||"glass"},${d.settings.updated_at||new Date().toISOString()})`);
  else tx.push(q`INSERT INTO settings(id) VALUES(1)`);
  for(const w of d.widgets) tx.push(q`INSERT INTO widgets(id,widget_key,widget_title,grid_w,grid_h,sort_order,config,enabled,created_at,updated_at) VALUES(${+w.id},${String(w.widget_key)},${String(w.widget_title)},${Math.max(1,Math.min(3,+w.grid_w||1))},${Math.max(1,Math.min(3,+w.grid_h||1))},${+w.sort_order||0},${JSON.stringify(w.config||{})}::jsonb,${w.enabled!==false},${w.created_at||new Date().toISOString()},${w.updated_at||new Date().toISOString()})`);
  tx.push(q`SELECT setval(pg_get_serial_sequence('categories','id'),COALESCE((SELECT MAX(id) FROM categories),1),EXISTS(SELECT 1 FROM categories))`);
  tx.push(q`SELECT setval(pg_get_serial_sequence('sites','id'),COALESCE((SELECT MAX(id) FROM sites),1),EXISTS(SELECT 1 FROM sites))`);
  tx.push(q`SELECT setval(pg_get_serial_sequence('widgets','id'),COALESCE((SELECT MAX(id) FROM widgets),1),EXISTS(SELECT 1 FROM widgets))`);
  await q.transaction(tx);
  return j({ok:true,counts:{categories:d.categories.length,sites:d.sites.length,widgets:d.widgets.length}});
 }

 if(p==="/api/widgets"&&m==="POST"){
  const b=await r.json();if(!b.widget_key||!b.widget_title)return j({error:"组件信息不完整"},400);
  const z=await q`INSERT INTO widgets(widget_key,widget_title,grid_w,grid_h,sort_order,config,enabled) VALUES(${b.widget_key},${b.widget_title},${Math.max(1,Math.min(3,+b.grid_w||1))},${Math.max(1,Math.min(3,+b.grid_h||1))},${+b.sort_order||0},${JSON.stringify(b.config||{})}::jsonb,TRUE) RETURNING *`;return j(z[0],201);
 }
 x=p.match(/^\/api\/widgets\/(\d+)$/);
 if(x&&m==="PUT"){
  const b=await r.json(),z=await q`UPDATE widgets SET widget_title=${b.widget_title||"组件"},grid_w=${Math.max(1,Math.min(3,+b.grid_w||1))},grid_h=${Math.max(1,Math.min(3,+b.grid_h||1))},sort_order=${+b.sort_order||0},config=${JSON.stringify(b.config||{})}::jsonb,updated_at=CURRENT_TIMESTAMP WHERE id=${+x[1]} RETURNING *`;
  return z[0]?j(z[0]):j({error:"组件不存在"},404);
 }
 if(x&&m==="DELETE"){await q`DELETE FROM widgets WHERE id=${+x[1]}`;return j({ok:true})}
 if(p==="/api/widgets/reorder"&&m==="POST"){
  const b=await r.json();if(!Array.isArray(b.items))return j({error:"排序数据无效"},400);
  for(let i=0;i<b.items.length;i++)await q`UPDATE widgets SET sort_order=${i+1},updated_at=CURRENT_TIMESTAMP WHERE id=${+b.items[i].id}`;
  return j({ok:true});
 }
 return j({error:"API not found"},404);
}catch(err){console.error(err);return j({error:err.message||"服务器错误"},500)}}

export default{async fetch(r,e){return new URL(r.url).pathname.startsWith("/api/")?api(r,e):e.ASSETS.fetch(r)}};
