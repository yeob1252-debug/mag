import crypto from 'node:crypto';
const TYPES=new Set(['content','website','training','custom']);
const COOKIE='ireolttaen_inquiry';
const clean=(v,n)=>String(v??'').trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,n);
const sign=(secret,s)=>crypto.createHmac('sha256',secret).update(s).digest('base64url');
function reply(res,status,data,headers={}){res.statusCode=status;for(const [k,v] of Object.entries({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}))res.setHeader(k,v);res.end(JSON.stringify(data));}
export default async function handler(req,res){
 const secret=process.env.MATGANDA_FREE_GUIDE_WEBHOOK_SECRET,url=process.env.MATGANDA_FREE_GUIDE_WEBHOOK_URL;
 if(!secret||!url)return reply(res,503,{ok:false,error:'temporarily_unavailable'});
 const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==host)return reply(res,403,{ok:false,error:'origin_rejected'});}catch{return reply(res,403,{ok:false,error:'origin_rejected'});}}
 if(req.method==='GET'){
  const session=crypto.randomBytes(18).toString('base64url'),expires=Date.now()+900000;
  const secure=host.startsWith('localhost:')||host.startsWith('127.0.0.1:')?'':'; Secure';
  return reply(res,200,{ok:true,nonce:`${expires}.${sign(secret,`${session}.${expires}`)}`},{'Set-Cookie':`${COOKIE}=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900${secure}`});
 }
 if(req.method!=='POST')return reply(res,405,{ok:false,error:'method_not_allowed'},{Allow:'GET, POST'});
 const session=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 const [expires,sig]=String(req.headers['x-request-nonce']||'').split('.');
 const expected=sign(secret,`${session}.${expires}`);
 if(!session||!sig||sig.length!==expected.length||Number(expires)<Date.now()||Number(expires)>Date.now()+960000||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return reply(res,403,{ok:false,error:'expired_session'});
 let body;
 try{
  if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>12000)throw Error();body=JSON.parse(raw);}
  else{let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>12000)throw Error();}body=JSON.parse(raw);}
 }catch{return reply(res,400,{ok:false,error:'invalid_body'});}
 if(!body||typeof body!=='object'||Array.isArray(body))return reply(res,400,{ok:false,error:'invalid_body'});
 if(body.company_website)return reply(res,400,{ok:false,error:'invalid_fields'});
 const data={submission_id:clean(body.submission_id,64),service:clean(body.service,30),name:clean(body.name,50),email:clean(body.email,120).toLowerCase(),request:clean(body.request,1500),reference:clean(body.reference,500),content:clean(body.content,80),privacy_consent:body.privacy_consent===true,origin_page:clean(body.origin_page,160),utm_source:clean(body.utm_source,80),utm_medium:clean(body.utm_medium,80),utm_campaign:clean(body.utm_campaign,80)};
 if(!/^(TEST-)?AI-[A-F0-9-]{36}$/.test(data.submission_id)||!TYPES.has(data.service)||!data.name||!data.request||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||!data.privacy_consent)return reply(res,400,{ok:false,error:'invalid_fields'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),22000);
 try{
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'aiInquiry',token:secret,data}),signal:controller.signal});
  const result=await response.json();
  if(result.error==='rate_limited')return reply(res,429,{ok:false,error:'rate_limited'});
  if(!response.ok||!result.ok||!result.stored||result.submissionId!==data.submission_id||!result.rowNumber)throw Error();
  return reply(res,200,{ok:true,stored:true,alertSent:!!result.alertSent,submissionId:result.submissionId,replay:!!result.replay});
 }catch{return reply(res,502,{ok:false,error:'save_unconfirmed'});}finally{clearTimeout(timer);}
}
