import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,prepareRound,startRound,pass,expire,finishBurst,nextActive,pickCategory,normalizeRestored} from '../js/game.js';
const categories=[{id:'a',level:'easy',text:'A'},{id:'b',level:'easy',text:'B'}];
function ready(count=3){const g=newGame({count,names:[],strikes:3,min:20,max:20});prepareRound(g,categories,()=>0);return g;}
test('two and ten players; timer survives fast passes and expiration wins a tie',()=>{for(const count of [2,10]){const g=ready(count);startRound(g,1000,()=>0);for(let i=0;i<100;i++)assert.equal(pass(g,1001+i),'passed');assert.equal(g.deadline,21000);const current=g.current;assert.equal(pass(g,21000),'expired');assert.equal(g.current,current);assert.equal(g.players[current].points,1);assert.equal(pass(g,21001),'ignored');assert.equal(expire(g,21002),false);}});
test('eliminated players are skipped and winner is found',()=>{const g=ready(2);g.players[1].points=2;startRound(g,1000,()=>0);pass(g,1001);expire(g,21000);finishBurst(g);assert.equal(g.phase,'winner');assert.equal(g.winner,0);});
test('round starter rotates and categories do not repeat before exhaustion',()=>{const g=ready();assert.equal(g.category.id,'a');g.phase='result';prepareRound(g,categories,()=>0);assert.equal(g.starter,1);assert.equal(g.category.id,'b');g.phase='result';prepareRound(g,categories,()=>0);assert.equal(g.category.id,'a');});
test('restored expired round applies exactly one penalty',()=>{const g=ready();startRound(g,1000,()=>0);normalizeRestored(g,22000);assert.equal(g.phase,'burst');assert.equal(g.players[0].points,1);normalizeRestored(g,22001);assert.equal(g.players[0].points,1);});
test('all difficulty pool and eliminated skip',()=>{const g=ready(3);g.players[1].points=3;assert.equal(nextActive(g,0),2);assert.equal(pickCategory(g,categories,()=>0).id,'b');});
