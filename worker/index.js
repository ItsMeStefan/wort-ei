export {GameRoom} from './room.js';
const headers = origin => ({'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type','content-type':'application/json; charset=utf-8'});
const reply=(data,status,origin)=>new Response(JSON.stringify(data),{status,headers:headers(origin)});
function allowed(origin,env){return (env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(origin);}
const code=()=>{const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', bytes=crypto.getRandomValues(new Uint8Array(8));return [...bytes].map(b=>alphabet[b%alphabet.length]).join('');};
export default {async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  if(!allowed(origin,env))return new Response('Forbidden',{status:403});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:headers(origin)});
  const url=new URL(request.url), match=url.pathname.match(/^\/rooms\/([A-Z2-9]{8})\/(join|connect)$/);
  if(url.pathname==='/rooms'&&request.method==='POST'){
    if(Number(request.headers.get('content-length'))>2048)return reply({error:'Anfrage zu groß'},413,origin);
    let body;try{body=await request.json();}catch{return reply({error:'Ungültige Daten'},400,origin);}
    for(let i=0;i<5;i++){
      const roomCode=code(),stub=env.GAME_ROOMS.get(env.GAME_ROOMS.idFromName(roomCode));
      const response=await stub.fetch(new Request(`${url.origin}/rooms/${roomCode}/init`,{method:'POST',body:JSON.stringify(body)}));
      if(response.status===409)continue;
      return new Response(response.body,{status:response.status,headers:headers(origin)});
    }
    return reply({error:'Bitte erneut versuchen'},503,origin);
  }
  if(match){
    const stub=env.GAME_ROOMS.get(env.GAME_ROOMS.idFromName(match[1]));
    const response=await stub.fetch(request);
    if(response.status===101)return response;
    return new Response(response.body,{status:response.status,headers:headers(origin)});
  }
  return reply({error:'Nicht gefunden'},404,origin);
}};
