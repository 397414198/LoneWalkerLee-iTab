import { neon } from "@neondatabase/serverless";

const out = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: {"content-type":"application/json;charset=UTF-8","cache-control":"no-store"}
});
const getDB = env => {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL 未配置");
  return neon(env.DATABASE_URL);
};
async function auth(request, env) {
  if (!env.ADMIN_PASSWORD) return true;
  return (request.headers.get("x-admin-password") || "") === env.ADMIN_PASSWORD;
}

export async function onRequestGet({env, request}) {
  try {
    const sql = getDB(env);
    const [categories, sites, settings] = await Promise.all([
      sql`SELECT id,name,sort_order FROM categories ORDER BY sort_order,id`,
      sql`SELECT id,title,url,icon,category_id,sort_order FROM sites ORDER BY category_id NULLS LAST,sort_order,id`,
      sql`SELECT id,background_url,search_engine,theme FROM settings WHERE id=1 LIMIT 1`
    ]);
    return out({categories,sites,settings:settings[0] || {
      id:1,background_url:"",search_engine:"https://www.bing.com/search?q=",theme:"glass"
    }});
  } catch(e) { return out({error:e.message},500); }
}

export async function onRequestPost({env,request}) {
  try {
    if (!await auth(request,env)) return out({error:"需要管理员密码"},401);
    const sql=getDB(env), path=new URL(request.url).pathname, body=await request.json();

    if(path.endsWith("/sites")) {
      const title=String(body.title||"").trim(), url=String(body.url||"").trim();
      if(!title||!url) return out({error:"标题和网址不能为空"},400);
      const rows=await sql`INSERT INTO sites(title,url,icon,category_id,sort_order)
        VALUES(${title},${url},${String(body.icon||"🔗")},${body.category_id?Number(body.category_id):null},999)
        RETURNING id,title,url,icon,category_id,sort_order`;
      return out(rows[0],201);
    }
    if(path.endsWith("/settings")) {
      const rows=await sql`INSERT INTO settings(id,background_url,search_engine,theme)
        VALUES(1,${String(body.background_url??"")},${String(body.search_engine||"https://www.bing.com/search?q=")},${String(body.theme||"glass")})
        ON CONFLICT(id) DO UPDATE SET background_url=EXCLUDED.background_url,
        search_engine=EXCLUDED.search_engine,theme=EXCLUDED.theme,updated_at=CURRENT_TIMESTAMP
        RETURNING id,background_url,search_engine,theme`;
      return out(rows[0]);
    }
    return out({error:"未知接口"},404);
  } catch(e){return out({error:e.message},500);}
}

export async function onRequestPut({env,request}) {
  try {
    if(!await auth(request,env)) return out({error:"需要管理员密码"},401);
    const sql=getDB(env), path=new URL(request.url).pathname, body=await request.json();
    const m=path.match(/\/api\/sites\/(\d+)$/);
    if(m){
      const id=Number(m[1]);
      const rows=await sql`UPDATE sites SET title=${String(body.title||"").trim()},
        url=${String(body.url||"").trim()},icon=${String(body.icon||"🔗")},
        category_id=${body.category_id?Number(body.category_id):null},updated_at=CURRENT_TIMESTAMP
        WHERE id=${id} RETURNING id,title,url,icon,category_id,sort_order`;
      return rows[0]?out(rows[0]):out({error:"网站不存在"},404);
    }
    return out({error:"未知接口"},404);
  }catch(e){return out({error:e.message},500);}
}

export async function onRequestDelete({env,request}) {
  try {
    if(!await auth(request,env)) return out({error:"需要管理员密码"},401);
    const sql=getDB(env), path=new URL(request.url).pathname;
    const m=path.match(/\/api\/sites\/(\d+)$/);
    if(m){await sql`DELETE FROM sites WHERE id=${Number(m[1])}`;return out({ok:true});}
    return out({error:"未知接口"},404);
  }catch(e){return out({error:e.message},500);}
}
