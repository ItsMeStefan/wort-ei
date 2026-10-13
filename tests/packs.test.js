import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_IDS, clampSettings, matchingCategories, newGame, pickCategory, normalizeRestored} from '../js/game.js';

const {packs, categories} = JSON.parse(readFileSync(new URL('../categories.json', import.meta.url)));

test('all packs and categories are complete and unique', () => {
  assert.deepEqual(packs.map(p => p.id), PACK_IDS);
  assert.equal(categories.length, 365);
  assert.equal(new Set(categories.map(c => c.id)).size, categories.length);
  assert.equal(new Set(categories.map(c => c.text.toLocaleLowerCase('de'))).size, categories.length);
  const minimum = {alltag:225,mario:20,minecraft:20,pokemon:15,gaming:20,filme:15,schule:15,fantasie:20,natur:15};
  for (const [id,count] of Object.entries(minimum)) {
    const items=categories.filter(c=>c.pack===id);
    assert.ok(items.length>=count, `${id}: ${items.length}`);
    for (const item of items) {
      assert.ok(['easy','normal','hard'].includes(item.level));
      assert.ok(item.text.length>12);
    }
  }
});

test('one, several, all and no packs filter correctly at every difficulty', () => {
  for (const selected of [['mario'],['mario','minecraft'],PACK_IDS,[]]) {
    for (const difficulty of ['all','easy','normal','hard']) {
      const settings=clampSettings({packs:selected,difficulty});
      const pool=matchingCategories(settings,categories);
      assert.ok(pool.every(c=>selected.includes(c.pack)));
      assert.ok(pool.every(c=>difficulty==='all'||c.level===difficulty));
      assert.equal(pool.length, categories.filter(c=>selected.includes(c.pack)&&(difficulty==='all'||c.level===difficulty)).length);
    }
  }
  assert.equal(matchingCategories(clampSettings({packs:[]}),categories).length,0);
  assert.throws(()=>pickCategory(newGame({packs:[]}),categories),/Wähle mindestens/);
});

test('selection survives settings restore; old game remains on original pack', () => {
  assert.deepEqual(clampSettings(JSON.parse(JSON.stringify(clampSettings({packs:['mario','minecraft']})))).packs,['mario','minecraft']);
  const old=newGame({}); delete old.settings.packs;
  assert.deepEqual(normalizeRestored(old).settings.packs,['alltag']);
  assert.equal(matchingCategories(old.settings,[{id:'legacy',level:'easy',text:'Alt'}]).length,1);
});

test('balanced draws use every category before repeating and avoid a direct repeat', () => {
  const sample=categories.filter(c=>['mario','minecraft'].includes(c.pack)&&c.level==='easy');
  const game=newGame({packs:['mario','minecraft'],difficulty:'easy'});
  const drawn=[];
  for(let i=0;i<sample.length+1;i++) {
    const chosen=pickCategory(game,sample,()=>0);
    drawn.push(chosen);
    game.category=chosen;
  }
  assert.equal(new Set(drawn.slice(0,-1).map(c=>c.id)).size,sample.length);
  assert.notEqual(drawn.at(-1).id,drawn.at(-2).id);
  assert.ok(drawn.slice(0,10).filter(c=>c.pack==='mario').length>=4);
  assert.ok(drawn.slice(0,10).filter(c=>c.pack==='minecraft').length>=4);
});

test('an empty difficulty combination raises a readable error', () => {
  const game=newGame({packs:['mario'],difficulty:'hard'});
  assert.throws(()=>pickCategory(game,[{id:'one',pack:'mario',level:'easy',text:'Einfach'}]),/keine Kategorien/);
});
