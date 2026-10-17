import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ADULT_PACKS,EDITIONS} from '../js/edition.js';
import {defaultsFor,clampSettings,matchingCategories,newGame,pickCategory,prepareRound,startRound,triggerChaos,normalizeRestored} from '../js/game.js';
import {themesFor} from '../js/themes.js';
import {categoryRuleTags} from '../js/extras.js';
import {burstLines,winnerLines,drawLine} from '../js/lines.js';
const adult=JSON.parse(readFileSync(new URL('../18/categories.json',import.meta.url)));
const classic=JSON.parse(readFileSync(new URL('../categories.json',import.meta.url)));
const validLevels=['easy','normal','hard'];

test('adult data has twelve balanced packs and 300 unique playable prompts',()=>{
 assert.deepEqual(adult.packs.map(p=>p.id),ADULT_PACKS);
 assert.equal(adult.categories.length,300);
 assert.equal(new Set(adult.categories.map(c=>c.id)).size,300);
 assert.equal(new Set(adult.categories.map(c=>c.text.toLocaleLowerCase('de'))).size,300);
 const classicIds=new Set(classic.categories.map(c=>c.id));
 for(const c of adult.categories){
  assert.ok(!classicIds.has(c.id));assert.ok(ADULT_PACKS.includes(c.pack));
  assert.ok(validLevels.includes(c.level));assert.ok([1,2,3].includes(c.intensity));
  assert.ok(c.text.length>=24&&c.text.length<=90,`${c.id} length`);
  assert.ok(/[?!]$/.test(c.text),`${c.id} punctuation`);
  assert.ok(Array.isArray(c.ruleTags)&&c.ruleTags.every(tag=>['open','short','tangible'].includes(tag)));
 }
 for(const pack of ADULT_PACKS){
  const items=adult.categories.filter(c=>c.pack===pack);assert.equal(items.length,25);
  for(const level of validLevels)for(const intensity of [1,2,3])assert.ok(items.some(c=>c.level===level&&c.intensity===intensity),`${pack} ${level}/${intensity}`);
 }
});

test('edition settings, packs and themes cannot cross',()=>{
 assert.notEqual(EDITIONS.classic.storageKey,EDITIONS.adult.storageKey);
 assert.deepEqual(clampSettings(defaultsFor('adult'),'adult').packs,ADULT_PACKS);
 assert.deepEqual(clampSettings({packs:['sex','alltag'],theme:'after-dark'},'classic').packs,['alltag']);
 assert.deepEqual(clampSettings({packs:['sex','alltag'],theme:'classic'},'adult').packs,['sex']);
 assert.equal(clampSettings({theme:'after-dark'},'classic').theme,'classic');
 assert.equal(themesFor('classic').some(t=>t.id==='after-dark'),false);
 assert.equal(themesFor('adult').some(t=>t.id==='after-dark'),true);
 const old=newGame({names:['Ada','Bert']});const grown=newGame({...defaultsFor('adult'),names:['Cora','Dora']});
 assert.equal(normalizeRestored(structuredClone(old),Date.now(),'adult'),null);
 assert.equal(normalizeRestored(structuredClone(grown),Date.now(),'classic'),null);
 assert.deepEqual(normalizeRestored(structuredClone(old)).players.map(p=>p.name),['Ada','Bert','Spieler 3']);
});

test('intensity, difficulty and packs filter independently',()=>{
 for(const intensity of [1,2,3])for(const difficulty of ['all',...validLevels])for(const pack of [ADULT_PACKS,['sex'],[]]){
  const s=clampSettings({...defaultsFor('adult'),packs:pack,intensity,difficulty},'adult');
  const pool=matchingCategories(s,adult.categories);
  assert.ok(pool.every(c=>c.intensity<=intensity&&pack.includes(c.pack)&&(difficulty==='all'||c.level===difficulty)));
  assert.equal(pool.length,adult.categories.filter(c=>c.intensity<=intensity&&pack.includes(c.pack)&&(difficulty==='all'||c.level===difficulty)).length);
 }
 assert.equal(matchingCategories(clampSettings(defaultsFor('classic')),adult.categories).length,0);
 assert.equal(matchingCategories(clampSettings(defaultsFor('adult'),'adult'),classic.categories).length,0);
});

test('adult category history and chaos remain inside current pool',()=>{
 const s=clampSettings({...defaultsFor('adult'),packs:['sex','dating'],difficulty:'easy',intensity:1,eggTypes:['chaos'],eggChance:'always',eggsEnabled:true},'adult');
 const g=newGame(s,'adult');const pool=matchingCategories(s,adult.categories);
 const seen=new Set();for(let i=0;i<pool.length;i++){const c=pickCategory(g,adult.categories,()=>0);assert.ok(!seen.has(c.id));seen.add(c.id);g.category=c;}
 const round=newGame(s,'adult');prepareRound(round,adult.categories,()=>0);assert.equal(round.eggType,'chaos');
 startRound(round,1000,()=>0);const previous=round.category.id, at=round.chaosAt, deadline=round.deadline;triggerChaos(round,adult.categories,at,()=>0);
 assert.notEqual(round.category.id,previous);assert.ok(pool.some(c=>c.id===round.category.id));assert.equal(round.chaosFreezeUntil,at+3000);
 assert.equal(round.deadline,deadline+3000);assert.ok(categoryRuleTags(round.category) instanceof Set);
});

test('adult result lines have sufficient variety and deterministic random boundaries',()=>{
 assert.ok(burstLines.length>=20);assert.ok(winnerLines.length>=15);
 assert.equal(new Set(burstLines).size,burstLines.length);
 assert.equal(new Set(winnerLines).size,winnerLines.length);
 assert.equal(drawLine(burstLines,()=>0),burstLines[0]);
 assert.equal(drawLine(winnerLines,()=>0.999),winnerLines.at(-1));
});
