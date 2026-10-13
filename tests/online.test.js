import test from 'node:test';
import assert from 'node:assert/strict';
import {GameRoom} from '../worker/room.js';

function fixture() {
  const data=new Map(), sockets=[];
  const ctx={storage:{get:async k=>data.get(k),put:async(k,v)=>data.set(k,structuredClone(v)),setAlarm:async n=>{ctx.alarmAt=n;},deleteAll:async()=>data.clear()},getWebSockets:()=>sockets};
  const room=new GameRoom(ctx,{});
  async function post(path,body){const r=await room.fetch(new Request(`https://example.test${path}`,{method:'POST',body:JSON.stringify(body)}));return {status:r.status,body:await r.json()};}
  function socket(id){const messages=[];const ws={readyState:1,deserializeAttachment:()=>({id,window:Date.now(),count:0}),serializeAttachment(){},send:d=>messages.push(JSON.parse(d)),close(){ws.readyState=3;}};sockets.push(ws);return {ws,messages};}
  async function action(ws,type,extra={}){await room.webSocketMessage(ws,JSON.stringify({type,eventId:crypto.randomUUID(),version:room.room.version,...extra}));}
  return {room,ctx,post,socket,action};
}
async function started() {
  const f=fixture();const host=(await f.post('/rooms/ABCDEFGH/init',{name:'Max',settings:{strikes:1,min:3,max:3}})).body;
  const guest=(await f.post('/rooms/ABCDEFGH/join',{name:'Tim'})).body;
  const h=f.socket(host.id),g=f.socket(guest.id);
  for(const p of f.room.room.players)p.connected=true;
  await f.room.save();await f.action(h.ws,'startGame');await f.action(h.ws,'startRound');
  return {...f,host,guest,h,g};
}
test('room is isolated, join validates names and size, sessions are stable',async()=>{
  const f=fixture();const a=(await f.post('/rooms/ABCDEFGH/init',{name:'Max'})).body;
  assert.equal((await f.post('/rooms/ABCDEFGH/join',{name:'Max'})).status,409);
  const again=(await f.post('/rooms/ABCDEFGH/join',{id:a.id,secret:a.secret,name:'Other'})).body;
  assert.equal(again.id,a.id);assert.equal(f.room.room.players.length,1);
  const other=fixture();assert.equal(other.room.room,null);assert.equal((await other.post('/rooms/ABCDEFGH/init',{name:'Lisa'})).status,200);
});
test('host permissions, turn permissions and stale duplicate versions',async()=>{
  const f=await started();const before=f.room.room.version;
  await f.action(f.g.ws,'pass');assert.equal(f.room.room.version,before);
  const msg={type:'pass',eventId:crypto.randomUUID(),version:before};
  await f.room.webSocketMessage(f.h.ws,JSON.stringify(msg));await f.room.webSocketMessage(f.h.ws,JSON.stringify(msg));
  assert.equal(f.room.room.version,before+1);assert.equal(f.room.room.game.current,1);
  await f.action(f.h.ws,'pass');assert.equal(f.room.room.game.current,1);
});
test('server timer is secret, persists through passes and ends once',async()=>{
  const f=await started();const initial=f.room.room.game.deadline;
  await f.action(f.h.ws,'pass');assert.equal(f.room.room.game.deadline,initial);
  assert.equal(f.h.messages.at(-1).game.deadline,null);
  f.room.room.game.deadline=Date.now()-1;await f.room.save();await f.room.alarm();
  assert.equal(f.room.room.game.phase,'burst');assert.equal(f.room.room.game.players[1].points,1);
  await f.room.alarm();assert.equal(f.room.room.game.players[1].points,1);
  f.room.room.game.burstAt=Date.now()-2000;await f.room.alarm();
  assert.equal(f.room.room.game.phase,'winner');assert.equal(f.room.room.game.winner,0);
});
test('disconnected active player can be skipped after grace, host connection is irrelevant to timer',async()=>{
  const f=await started();f.room.room.players[0].connected=false;f.room.room.players[0].disconnectedAt=Date.now()-61000;f.h.ws.readyState=3;await f.room.save();
  await f.action(f.g.ws,'skip');assert.equal(f.room.room.game.current,1);
  f.room.room.game.deadline=Date.now()-1;await f.room.save();await f.room.alarm();
  assert.equal(f.room.room.game.players[1].points,1);
});

test('two concurrent messages with the same version advance only once',async()=>{
  const f=await started(),version=f.room.room.version;
  const one=JSON.stringify({type:'pass',eventId:crypto.randomUUID(),version});
  const two=JSON.stringify({type:'pass',eventId:crypto.randomUUID(),version});
  await Promise.all([f.room.webSocketMessage(f.h.ws,one),f.room.webSocketMessage(f.h.ws,two)]);
  assert.equal(f.room.room.version,version+1);assert.equal(f.room.room.game.current,1);
});
test('three players and elimination preserve the shared rotation rules',async()=>{
  const f=fixture();const host=(await f.post('/rooms/ABCDEFGH/init',{name:'Max',settings:{strikes:1,min:3,max:3}})).body;
  const second=(await f.post('/rooms/ABCDEFGH/join',{name:'Tim'})).body;
  const third=(await f.post('/rooms/ABCDEFGH/join',{name:'Lisa'})).body;
  const sockets=[host,second,third].map(p=>f.socket(p.id));
  f.room.room.players.forEach(p=>p.connected=true);await f.room.save();
  await f.action(sockets[0].ws,'startGame');await f.action(sockets[0].ws,'startRound');
  f.room.room.game.deadline=Date.now()-1;await f.room.save();await f.room.alarm();
  f.room.room.game.burstAt=Date.now()-2000;await f.room.alarm();
  assert.equal(f.room.room.game.phase,'result');assert.equal(f.room.room.game.players[0].points,1);
  await f.action(sockets[0].ws,'nextRound');assert.equal(f.room.room.game.starter,1);
  await f.action(sockets[0].ws,'startRound');await f.action(sockets[1].ws,'pass');
  assert.equal(f.room.room.game.current,2);
});
