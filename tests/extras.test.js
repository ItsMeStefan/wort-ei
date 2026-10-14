import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHANCES, EGG_TYPES, RULES, eligibleRules, ruleCompatible} from '../js/extras.js';
import {clampSettings, newGame, prepareRound, startRound, expire, finishBurst, pass, pickRoundEgg, pickRoundRule, triggerChaos, normalizeRestored} from '../js/game.js';

const all=JSON.parse(readFileSync(new URL('../categories.json',import.meta.url))).categories;
const sample=[
  {id:'a',pack:'fantasie',level:'easy',text:'Nenne etwas, das ein Alien essen könnte!'},
  {id:'b',pack:'alltag',level:'easy',text:'Nenne ein Tier!'},
  {id:'c',pack:'fantasie',level:'easy',text:'Nenne etwas, das ein Drache sammelt!'}
];
const fixed=(type,options={})=>newGame({count:2,names:['Mia','Tim'],strikes:2,packs:['fantasie','alltag'],min:20,max:20,eggsEnabled:true,eggChance:'always',eggTypes:[type],rulesEnabled:false,...options});

test('definitions are complete, unique and have valid settings',()=>{
  assert.deepEqual(EGG_TYPES.map(type=>type.id),['turbo','double','golden','chaos']);
  assert.ok(RULES.length>=25);
  assert.equal(new Set(RULES.map(rule=>rule.id)).size,RULES.length);
  assert.ok(RULES.every(rule=>['easy','normal','hard'].includes(rule.level)&&rule.text.length>15));
  assert.ok(RULES.every(rule=>!['sing','reason','advert','sound','gesture','nickname','repeat','clap','sentence','question'].includes(rule.id)));
  assert.deepEqual(Object.values(CHANCES),[0.1,0.25,0.5,1]);
  assert.equal(all.length,365);
});

test('classic mode keeps the original timer, penalty and no extra rule',()=>{
  const game=newGame({min:20,max:20,eggsEnabled:false,rulesEnabled:false});
  prepareRound(game,sample,()=>0);startRound(game,1000,()=>0);
  assert.equal(game.eggType,'normal');assert.equal(game.rule,null);assert.equal(game.deadline,21000);
  expire(game,21000);assert.equal(game.players[0].points,1);
});

test('turbo shortens the sampled duration without revealing or resetting the timer',()=>{
  const game=fixed('turbo',{turboFactor:0.6});prepareRound(game,sample,()=>0);startRound(game,1000,()=>0);
  assert.equal(game.deadline,13000);
  for(let i=0;i<10;i++) pass(game,1100+i);
  assert.equal(game.deadline,13000);
  const tiny=fixed('turbo',{min:3,max:3,turboFactor:0.4});prepareRound(tiny,sample,()=>0);startRound(tiny,0,()=>0);
  assert.equal(tiny.deadline,3000);
});

test('double penalty is applied once and can eliminate the active player',()=>{
  const game=fixed('double');prepareRound(game,sample,()=>0);startRound(game,0,()=>0);
  assert.equal(pass(game,20000),'expired');
  assert.equal(game.players[0].points,2);
  assert.equal(expire(game,21000),false);assert.equal(game.players[0].points,2);
  finishBurst(game);assert.equal(game.phase,'winner');assert.equal(game.winner,1);
});

test('golden egg ends the round without a penalty',()=>{
  const game=fixed('golden');prepareRound(game,sample,()=>0);startRound(game,0,()=>0);
  assert.equal(expire(game,20000),true);assert.equal(game.players[0].points,0);
  finishBurst(game);assert.equal(game.phase,'result');
});

test('chaos changes category once without changing deadline or active player',()=>{
  const game=fixed('chaos');prepareRound(game,sample,()=>0);startRound(game,0,()=>0);
  const deadline=game.deadline,current=game.current,first=game.category.id;
  assert.equal(game.chaosAt,5000);
  assert.equal(triggerChaos(game,sample,4999,()=>0),false);
  assert.equal(triggerChaos(game,sample,5000,()=>0),true);
  assert.notEqual(game.category.id,first);assert.equal(game.current,current);assert.equal(game.deadline,deadline);
  assert.equal(triggerChaos(game,sample,6000,()=>0),false);
});

test('round may burst before chaos; expired rounds cannot switch categories',()=>{
  const game=fixed('chaos',{min:3,max:3});prepareRound(game,sample,()=>0);startRound(game,0,()=>0.9);
  const first=game.category.id;
  assert.ok(game.chaosAt>game.deadline);
  expire(game,3000);
  assert.equal(triggerChaos(game,sample,14000,()=>0),false);
  assert.equal(game.category.id,first);
});

test('disabled egg types and empty selection always produce a normal egg',()=>{
  const game=fixed('turbo',{eggTypes:['golden']});
  assert.equal(pickRoundEgg(game,()=>0),'golden');
  game.settings.eggTypes=[];assert.equal(pickRoundEgg(game,()=>0),'normal');
  game.settings.eggTypes=['turbo'];game.settings.eggsEnabled=false;assert.equal(pickRoundEgg(game,()=>0),'normal');
});

test('frequency thresholds are independent for eggs and rules',()=>{
  const game=fixed('turbo',{eggChance:'rare',rulesEnabled:true,ruleChance:'always'});
  assert.equal(pickRoundEgg(game,()=>0.11),'normal');
  assert.ok(pickRoundRule(game,sample[0],()=>0.99));
  game.settings.eggChance='always';game.settings.ruleChance='rare';
  assert.equal(pickRoundEgg(game,()=>0.99),'turbo');
  assert.equal(pickRoundRule(game,sample[0],()=>0.11),null);
});

test('restricted rules require compatible categories and appropriate difficulty',()=>{
  const noA=RULES.find(rule=>rule.id==='no-a');
  assert.equal(ruleCompatible(noA,sample[0]),true);
  assert.equal(ruleCompatible(noA,sample[1]),false);
  assert.equal(eligibleRules(sample[1],'easy').some(rule=>rule.needs?.length),false);
  assert.equal(eligibleRules(sample[0],'easy').some(rule=>rule.level==='hard'),false);
  assert.ok(eligibleRules(sample[0],'hard').some(rule=>rule.id==='no-e'));
  assert.equal(eligibleRules(sample[1],'hard').some(rule=>rule.id==='five-letters'),false);
  const game=fixed('turbo',{rulesEnabled:true,ruleChance:'always',difficulty:'easy'});
  const first=pickRoundRule(game,sample[0],()=>0);
  const second=pickRoundRule(game,sample[0],()=>0);
  assert.notEqual(first.id,second.id);
});

test('chaos keeps a compatible rule or visibly drops it when needed',()=>{
  const game=fixed('chaos',{rulesEnabled:true,ruleChance:'always'});
  prepareRound(game,[sample[0],sample[2]],()=>0);
  game.rule=RULES.find(rule=>rule.id==='no-a');startRound(game,0,()=>0);
  assert.equal(triggerChaos(game,[sample[0],sample[1],sample[2]],5000,()=>0),true);
  assert.equal(game.category.id,'c');assert.equal(game.rule.id,'no-a');assert.equal(game.ruleDropped,false);
  const reused=fixed('chaos',{rulesEnabled:true,ruleChance:'always'});
  prepareRound(reused,[sample[0],sample[2]],()=>0);
  reused.rule=RULES.find(rule=>rule.id==='no-a');
  reused.used.push('c');startRound(reused,0,()=>0);
  assert.equal(triggerChaos(reused,sample,5000,()=>0),true);
  assert.equal(reused.category.id,'c');assert.equal(reused.rule.id,'no-a');
  const other=fixed('chaos');prepareRound(other,[sample[0]],()=>0);other.rule=RULES.find(rule=>rule.id==='no-a');startRound(other,0,()=>0);
  assert.equal(triggerChaos(other,[sample[0],sample[1]],5000,()=>0),true);
  assert.equal(other.category.id,'b');assert.equal(other.rule,null);assert.equal(other.ruleDropped,true);
});

test('settings restore both systems while legacy games remain classic',()=>{
  const settings=clampSettings({eggsEnabled:true,eggChance:'often',eggTypes:['turbo','chaos'],turboFactor:0.7,rulesEnabled:true,ruleChance:'rare'});
  assert.deepEqual(clampSettings(JSON.parse(JSON.stringify(settings))),settings);
  const legacy=newGame({});delete legacy.settings.eggsEnabled;delete legacy.settings.rulesEnabled;delete legacy.eggType;
  normalizeRestored(legacy);
  assert.equal(legacy.eggType,'normal');assert.equal(legacy.settings.eggsEnabled,false);assert.equal(legacy.settings.rulesEnabled,false);
  const oldRule=newGame({});oldRule.category=sample[0];oldRule.rule={id:'sing',text:'Singe deine Antwort!',level:'easy'};
  normalizeRestored(oldRule);
  assert.equal(oldRule.rule,null);
});

test('special eggs and a rule can run together without additional timers or penalties',()=>{
  const game=fixed('double',{rulesEnabled:true,ruleChance:'always'});
  prepareRound(game,sample,()=>0);assert.ok(game.rule);
  startRound(game,1000,()=>0);
  assert.equal(game.deadline,21000);assert.equal(game.chaosAt,null);
  expire(game,21000);expire(game,21001);
  assert.equal(game.players[0].points,2);
});
