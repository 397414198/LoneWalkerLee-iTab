import { neon } from "@neondatabase/serverless";

const j=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json;charset=UTF-8","cache-control":"no-store"}});
const db=e=>{if(!e.DATABASE_URL)throw Error("DATABASE_URL is not configured");return neon(e.DATABASE_URL)};
const admin=(r,e)=>!!e.ADMIN_PASSWORD&&r.headers.get("x-admin-password")===e.ADMIN_PASSWORD;

async function init(e){
 const q=db(e);
 await q`CREATE TABLE IF NOT EXISTS categories(id SERIAL PRIMARY KEY,name VARCHAR(50) NOT NULL,sort_order INTEGER DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
 await q`CREATE TABLE IF NOT EXISTS sites(id SERIAL PRIMARY KEY,title VARCHAR(100) NOT NULL,url TEXT NOT NULL,icon TEXT DEFAULT '🔗',category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,sort_order INTEGER DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
 await q`CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY DEFAULT 1,background_url TEXT DEFAULT '',search_engine TEXT DEFAULT 'https://www.bing.com/search?q=',theme VARCHAR(30) DEFAULT 'glass',updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
 const c=await q`SELECT COUNT(*)::int n FROM categories`; if(!c[0].n) await q`INSERT INTO categories(name,sort_order) VALUES('常用',1),('AI',2),('工具',3),('娱乐',4),('工作',5)`;
 const s=await q`SELECT id FROM settings WHERE id=1`; if(!s.length) await q`INSERT INTO settings(id) VALUES(1)`;
}

async function api(r,e){
 try{
  await init(e); const q=db(e),u=new URL(r.url),p=u.pathname,m=r.method;
  if(p==="/api/data"&&m==="GET"){
   const [categories,sites,settings]=await Promise.all([q`SELECT * FROM categories ORDER BY sort_order,id`,q`SELECT * FROM sites ORDER BY category_id NULLS LAST,sort_order,id`,q`SELECT * FROM settings WHERE id=1`]);
   return j({categories,sites,settings:settings[0]||null});
  }
  if(!admin(r,e)&&m!=="GET") return j({error:"需要管理员密码"},401);

  if(p==="/api/sites"&&m==="POST"){const b=await r.json();if(!b.title||!b.url)return j({error:"标题和网址不能为空"},400);const x=await q`INSERT INTO sites(title,url,icon,category_id,sort_order) VALUES(${b.title},${b.url},${b.icon||"🔗"},${b.category_id||null},${b.sort_order||0}) RETURNING *`;return j(x[0],201)}
  let x=p.match(/^\/api\/sites\/(\d+)$/);
  if(x&&m==="DELETE"){await q`DELETE FROM sites WHERE id=${+x[1]}`;return j({ok:true})}
  if(x&&m==="PUT"){const b=await r.json(),z=await q`UPDATE sites SET title=${b.title},url=${b.url},icon=${b.icon||"🔗"},category_id=${b.category_id||null},sort_order=${b.sort_order||0},updated_at=CURRENT_TIMESTAMP WHERE id=${+x[1]} RETURNING *`;return z[0]?j(z[0]):j({error:"网站不存在"},404)}
  if(p==="/api/categories"&&m==="POST"){const b=await r.json(),z=await q`INSERT INTO categories(name,sort_order) VALUES(${b.name},${b.sort_order||0}) RETURNING *`;return j(z[0],201)}
  x=p.match(/^\/api\/categories\/(\d+)$/);if(x&&m==="DELETE"){await q`DELETE FROM categories WHERE id=${+x[1]}`;return j({ok:true})}
  if(p==="/api/settings"&&m==="POST"){const b=await r.json(),z=await q`INSERT INTO settings(id,background_url,search_engine,theme) VALUES(1,${b.background_url||""},${b.search_engine||"https://www.bing.com/search?q="},${b.theme||"glass"}) ON CONFLICT(id) DO UPDATE SET background_url=EXCLUDED.background_url,search_engine=EXCLUDED.search_engine,theme=EXCLUDED.theme,updated_at=CURRENT_TIMESTAMP RETURNING *`;return j(z[0])}
  return j({error:"API not found"},404);
 }catch(err){console.error(err);return j({error:err.message||"服务器错误"},500)}
}
export default{async fetch(r,e){return new URL(r.url).pathname.startsWith("/api/")?api(r,e):e.ASSETS.fetch(r)}};
