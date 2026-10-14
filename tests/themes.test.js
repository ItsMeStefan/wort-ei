import test from 'node:test';
import assert from 'node:assert/strict';
import {THEMES,THEME_IDS,themeSettings,themeById,drawTheme,eggAppearance} from '../js/themes.js';
import {clampSettings,newGame,prepareRound,startRound,triggerChaos,expire,finishBurst} from '../js/game.js';
import {playBurst, playGoldReveal, playChaosAlarm} from '../js/audio.js';

const categories=[{id:'a',text:'NENNE EIN TIER',level:'easy',pack:'alltag'},{id:'b',text:'NENNE EIN OBST',level:'easy',pack:'alltag'}];
const base={names:['A','B'],packs:['alltag'],difficulty:'easy',min:20,max:20,eggsEnabled:false,rulesEnabled:false};

test('five themes are distinct and old settings restore to classic',()=>{
  assert.equal(new Set(THEME_IDS).size,5);
  assert.deepEqual(THEME_IDS,['classic','retro','halloween','neon','winter']);
  assert.equal(clampSettings(base).theme,'classic');
  for(const id of THEME_IDS) assert.equal(clampSettings({...base,theme:id}).theme,id);
  assert.equal(themeById('missing').id,'classic');
  assert.equal(themeSettings({theme:'missing',themeMode:'wrong'}).themeMode,'fixed');
});

test('theme selection survives settings and game serialization',()=>{
  const settings=clampSettings({...base,theme:'neon',themeMode:'fixed'});
  assert.equal(clampSettings(JSON.parse(JSON.stringify(settings))).theme,'neon');
  assert.equal(JSON.parse(JSON.stringify(newGame(settings))).theme,'neon');
});

test('all egg types have a safe presentation in all five worlds',()=>{
  for(const theme of THEMES) for(const type of ['normal','turbo','double','golden','chaos']) {
    const appearance=eggAppearance(theme.id,type);
    assert.equal(appearance.theme,theme.id); assert.equal(appearance.type,type); assert.ok(appearance.effect);
  }
  assert.deepEqual(eggAppearance('missing','missing'),{theme:'classic',type:'normal',effect:'crack'});
});

test('party and round selection only use enabled worlds and avoid repeats',()=>{
  const settings=clampSettings({...base,themeMode:'party',randomThemes:['retro','winter']});
  assert.ok(['retro','winter'].includes(newGame(settings).theme));
  assert.equal(drawTheme(settings,'retro',()=>0),'winter');
  assert.equal(drawTheme({...settings,randomThemes:['retro']},'retro',()=>.9),'retro');
  const game=newGame({...settings,themeMode:'round'}); game.theme='retro';
  prepareRound(game,categories,()=>0); assert.equal(game.theme,'retro');
  startRound(game,1000,()=>0); assert.equal(game.theme,'retro');
  expire(game,25000); finishBurst(game);
  prepareRound(game,categories,()=>0); assert.equal(game.theme,'winter');
  startRound(game,30000,()=>0); assert.equal(game.theme,'winter');
});

test('all worlds keep the existing egg mechanics and chaos does not switch world',()=>{
  for(const theme of THEME_IDS) {
    const game=newGame({...base,theme});
    prepareRound(game,categories,()=>0);
    game.eggType='turbo'; game.settings.turboFactor=.5;
    startRound(game,1000,()=>0);
    assert.equal(game.deadline,11000); assert.equal(game.theme,theme);
    game.eggType='chaos'; game.chaosAt=2000;
    triggerChaos(game,categories,2000,()=>0); assert.equal(game.theme,theme);
    game.eggType='double'; expire(game,14000); assert.equal(game.players[game.current].points,2);
    const golden=newGame({...base,theme}); prepareRound(golden,categories,()=>0);
    golden.eggType='golden'; startRound(golden,1000,()=>0); expire(golden,21000);
    assert.equal(golden.players[golden.current].points,0);
  }
});

test('muted burst effects return without audio APIs',()=>{
  for(const theme of THEME_IDS) assert.doesNotThrow(()=>playBurst({sound:false,volume:1},theme,'normal'));
  assert.doesNotThrow(()=>playGoldReveal({sound:false,volume:1}));
  assert.doesNotThrow(()=>playGoldReveal({sound:true,volume:0}));
  for(const theme of THEME_IDS) assert.doesNotThrow(()=>playChaosAlarm({sound:false,volume:1},theme));
});
