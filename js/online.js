import {BACKEND_URL} from '../config.js';
export const backendUrl=BACKEND_URL.replace(/\/$/,'');
const KEY='wort-ei-online-v1';
const storage=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return {};}};
export function savedSession(code){return storage()[code]||null;}
function saveSession(code,session){const all=storage();all[code]=session;localStorage.setItem(KEY,JSON.stringify(all));}
export class OnlineClient {
  constructor(onState,onStatus,onError){this.onState=onState;this.onStatus=onStatus;this.onError=onError;this.socket=null;this.session=null;this.state=null;this.retry=null;this.closed=false;}
  async request(path,body){if(!backendUrl)throw Error('Backend-Adresse fehlt. Bitte config.js einrichten.');const res=await fetch(`${backendUrl}${path}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});let data;try{data=await res.json();}catch{throw Error(`Serverfehler (${res.status})`);}if(!res.ok)throw Error(data.error||`Serverfehler (${res.status})`);return data;}
  async create(name,settings){const session=await this.request('/rooms',{name,settings});this.use(session);return session;}
  async join(code,name){const previous=savedSession(code);const session=await this.request(`/rooms/${code}/join`,{name,...previous});this.use(session);return session;}
  use(session){this.close();this.closed=false;this.session=session;saveSession(session.code,session);this.connect();}
  connect(){if(this.closed||!this.session)return;this.onStatus('connecting');const {code,id,secret}=this.session;const url=new URL(`${backendUrl}/rooms/${code}/connect`);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('id',id);url.searchParams.set('secret',secret);const ws=new WebSocket(url);this.socket=ws;
    ws.onopen=()=>{this.onStatus('connected');this.attempt=0;};
    ws.onmessage=e=>{let msg;try{msg=JSON.parse(e.data);}catch{return;}if(msg.type==='state'){this.state=msg;this.onState(msg);}else if(msg.type==='rejected'&&msg.state){this.state=msg.state;this.onState(msg.state);}};
    ws.onclose=e=>{if(this.socket!==ws||this.closed)return;this.onStatus('disconnected');if(e.code===4003){this.closed=true;this.onError('Du wurdest aus der Lobby entfernt.');return;}const delay=Math.min(1000*2**Math.min(this.attempt++||0,5),30000);this.retry=setTimeout(()=>this.connect(),delay);};
    ws.onerror=()=>{};
  }
  action(type,payload={}){if(this.socket?.readyState!==WebSocket.OPEN||!this.state)return false;const eventId=crypto.randomUUID();this.socket.send(JSON.stringify({type,eventId,version:this.state.version,...payload}));return true;}
  close(){this.closed=true;clearTimeout(this.retry);if(this.socket){this.socket.onclose=null;this.socket.close();this.socket=null;}this.state=null;}
}
