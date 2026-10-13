import {newGame, prepareRound, startRound, pass, expire, finishBurst, clampSettings, nextActive} from '../js/game.js';
import categoriesFile from '../categories.json' with {type:'json'};

const categories = categoriesFile.categories;
const LIMIT = 10, DAY = 86400000, RETAIN = DAY, GRACE = 60000;
const token = () => [...crypto.getRandomValues(new Uint8Array(24))].map(x => x.toString(16).padStart(2,'0')).join('');
const json = (body, status=200) => new Response(JSON.stringify(body), {status, headers:{'content-type':'application/json; charset=utf-8'}});
const publicState = room => {
  const {game, players, code, version} = room;
  const safeGame = game && {...game, deadline: null, used: undefined};
  return {type:'state', code, version, phase:room.phase, hostId:room.hostId,
    players:players.map(({id,name,connected,disconnectedAt})=>({id,name,connected,disconnectedAt})),
    settings:room.settings, game:safeGame, resultPlayerId:room.resultPlayerId};
};
const cleanName = value => typeof value === 'string' ? value.trim().replace(/[\x00-\x1f\x7f]/g,'').slice(0,24) : '';
const validCode = code => /^[A-Z2-9]{8}$/.test(code);

export class GameRoom {
  constructor(ctx, env) { this.ctx=ctx; this.env=env; this.room=null; this.queue=Promise.resolve(); }
  enqueue(task) { const result=this.queue.then(task); this.queue=result.catch(()=>{}); return result; }
  fetch(request) { return this.enqueue(()=>this.handleFetch(request)); }
  webSocketMessage(ws,data) { return this.enqueue(()=>this.handleMessage(ws,data)); }
  webSocketClose(ws) { return this.enqueue(()=>this.disconnect(ws)); }
  webSocketError(ws) { return this.enqueue(()=>this.disconnect(ws)); }
  alarm() { return this.enqueue(()=>this.handleAlarm()); }
  async load() { if (!this.room) this.room=await this.ctx.storage.get('room') || null; return this.room; }
  async save() { this.room.version++; this.room.updatedAt=Date.now(); await this.ctx.storage.put('room',this.room); await this.setAlarm(); }
  async setAlarm() {
    const r=this.room; if (!r) return;
    const times=[r.updatedAt+RETAIN];
    if (r.game?.phase==='running') times.push(r.game.deadline);
    if (r.game?.phase==='burst') times.push(r.game.burstAt+1550);
    for (const p of r.players) if (!p.connected && p.disconnectedAt && r.phase==='playing') times.push(p.disconnectedAt+GRACE);
    await this.ctx.storage.setAlarm(Math.max(Date.now()+1, Math.min(...times)));
  }
  sockets(id) { return this.ctx.getWebSockets().filter(s=>s.deserializeAttachment()?.id===id); }
  broadcast() { const data=JSON.stringify(publicState(this.room)); for (const ws of this.ctx.getWebSockets()) try { ws.send(data); } catch {} }
  async reconcile() {
    const r=await this.load(); if (!r) return false;
    const now=Date.now(); let changed=false;
    for (const p of r.players) if (p.connected && !this.sockets(p.id).some(s=>s.readyState===1)) {p.connected=false;p.disconnectedAt=now;changed=true;}
    if (r.game?.phase==='running' && expire(r.game,now)) {r.resultPlayerId=r.game.current; changed=true;}
    if (r.game?.phase==='burst' && now>=r.game.burstAt+1550) {finishBurst(r.game);changed=true;}
    if (changed) {await this.save();this.broadcast();}
    return changed;
  }
  async handleFetch(request) {
    const url=new URL(request.url), method=request.method;
    if (url.pathname.endsWith('/init') && method==='POST') {
      if (await this.load()) return json({error:'Raumcode belegt'},409);
      const code=url.pathname.split('/')[2]; if (!validCode(code)) return json({error:'Ungültiger Raumcode'},400);
      let input; try {input=await request.json();} catch {return json({error:'Ungültige Daten'},400);}
      const name=cleanName(input.name); if (!name) return json({error:'Name erforderlich'},400);
      const settings=clampSettings({...input.settings,count:2,names:[]});
      const id=token(), secret=token();
      this.room={code,version:0,phase:'lobby',hostId:id,settings,players:[{id,name,secret,connected:false,disconnectedAt:null}],game:null,resultPlayerId:null,updatedAt:Date.now()};
      await this.save(); return json({code,id,secret});
    }
    const r=await this.load(); if (!r) return json({error:'Raum nicht gefunden'},404);
    await this.reconcile();
    if (url.pathname.endsWith('/join') && method==='POST') {
      let input; try {input=await request.json();} catch {return json({error:'Ungültige Daten'},400);}
      const existing=r.players.find(p=>p.id===input.id && p.secret===input.secret);
      if (existing) return json({code:r.code,id:existing.id,secret:existing.secret});
      if (r.phase!=='lobby') return json({error:'Spiel bereits gestartet. Wiederbeitritt nur mit bestehender Sitzung möglich.'},409);
      if (r.players.length>=LIMIT) return json({error:'Raum ist voll'},409);
      const name=cleanName(input.name); if (!name) return json({error:'Name erforderlich'},400);
      if (r.players.some(p=>p.name.toLocaleLowerCase('de')===name.toLocaleLowerCase('de'))) return json({error:'Name bereits vergeben'},409);
      const id=token(),secret=token();r.players.push({id,name,secret,connected:false,disconnectedAt:null}); await this.save();this.broadcast();return json({code:r.code,id,secret});
    }
    if (url.pathname.endsWith('/connect') && request.headers.get('Upgrade')?.toLowerCase()==='websocket') {
      const id=url.searchParams.get('id'), secret=url.searchParams.get('secret');
      const player=r.players.find(p=>p.id===id && p.secret===secret); if (!player) return json({error:'Ungültige Sitzung'},403);
      for (const old of this.sockets(id)) try {old.close(4000,'Neue Verbindung');} catch {}
      const pair=new WebSocketPair();const [client,server]=Object.values(pair);
      this.ctx.acceptWebSocket(server);server.serializeAttachment({id, window:Date.now(), count:0});
      player.connected=true;player.disconnectedAt=null;await this.save();this.broadcast();
      return new Response(null,{status:101,webSocket:client});
    }
    return json({error:'Nicht gefunden'},404);
  }
  async handleMessage(ws, data) {
    const a=ws.deserializeAttachment();if (!a) return;
    const now=Date.now();if (now-a.window>10000){a.window=now;a.count=0;}a.count++;ws.serializeAttachment(a);
    if (a.count>20) {ws.close(1008,'Zu viele Nachrichten');return;}
    if (typeof data!=='string'||data.length>2048) {ws.close(1009,'Nachricht zu groß');return;}
    let msg;try {msg=JSON.parse(data);}catch{return;}
    const r=await this.load();if (!r)return;
    await this.reconcile();
    const p=r.players.find(x=>x.id===a.id);if(!p)return;
    if (msg.type==='sync'){ws.send(JSON.stringify(publicState(r)));return;}
    if (typeof msg.eventId!=='string'||!/^[-\w]{8,80}$/.test(msg.eventId)||!Number.isInteger(msg.version)||msg.version!==r.version)return;
    // The version gate makes retries and concurrent actions mutually exclusive.
    const host=p.id===r.hostId;let changed=false;
    switch(msg.type){
      case 'settings': if(host&&r.phase==='lobby'){r.settings=clampSettings({...r.settings,...msg.settings,count:Math.max(2,r.players.length),names:[]});changed=true;}break;
      case 'kick': if(host&&r.phase==='lobby'&&msg.playerId!==p.id){const i=r.players.findIndex(x=>x.id===msg.playerId);if(i>=0){for(const s of this.sockets(msg.playerId))s.close(4003,'Entfernt');r.players.splice(i,1);changed=true;}}break;
      case 'startGame': if(host&&r.phase==='lobby'&&r.players.length>=2&&r.players.every(x=>x.connected)){r.settings.count=r.players.length;r.settings.names=r.players.map(x=>x.name);r.game=newGame(r.settings);prepareRound(r.game,categories);r.phase='playing';changed=true;}break;
      case 'startRound': if(host&&r.phase==='playing'&&r.game?.phase==='preview'){changed=startRound(r.game,now);}break;
      case 'pass': if(r.phase==='playing'&&r.game?.phase==='running'&&r.players[r.game.current]?.id===p.id&&p.connected){changed=pass(r.game,now)==='passed';}break;
      case 'nextRound': if(host&&r.game?.phase==='result'){changed=prepareRound(r.game,categories);r.resultPlayerId=null;}break;
      case 'restart': if(host&&r.game?.phase==='winner'){r.settings.count=r.players.length;r.settings.names=r.players.map(x=>x.name);r.game=newGame(r.settings);changed=prepareRound(r.game,categories);r.resultPlayerId=null;}break;
      case 'skip': if(r.game?.phase==='running'&&r.players[r.game.current]?.disconnectedAt && now-r.players[r.game.current].disconnectedAt>=GRACE && r.players.some(x=>x.connected&&x.id===p.id)) {let n=r.game.current;for(let i=0;i<r.players.length;i++){n=nextActive(r.game,n);if(r.players[n]?.connected){r.game.current=n;changed=true;break;}}}break;
    }
    if(changed){await this.save();this.broadcast();}
    else ws.send(JSON.stringify({type:'rejected',state:publicState(r)}));
  }
  async disconnect(ws) {
    const a=ws.deserializeAttachment(),r=await this.load();if(!a||!r)return;
    if(this.sockets(a.id).some(s=>s!==ws&&s.readyState===1))return;
    const p=r.players.find(x=>x.id===a.id);if(!p||!p.connected)return;
    p.connected=false;p.disconnectedAt=Date.now();await this.save();this.broadcast();
  }
  async handleAlarm() {
    const r=await this.load();if(!r)return;
    await this.reconcile();
    if(Date.now()-r.updatedAt>=RETAIN && this.ctx.getWebSockets().length===0){await this.ctx.storage.deleteAll();this.room=null;return;}
    await this.setAlarm();
  }
}
