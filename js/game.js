import {themeSettings, drawTheme, themeById} from './themes.js';
import {CHANCES, EGG_TYPES, RULES, eligibleRules, ruleCompatible} from './extras.js';
import {editionById,CLASSIC_PACKS,CLASSIC_THEMES} from './edition.js';

export const STORAGE_KEY = 'wort-ei-v1';
export const PACK_IDS = CLASSIC_PACKS;
export const defaults = { count: 3, names: [], strikes: 3, difficulty: 'all', packs: [...PACK_IDS], min: 20, max: 50, sound: true, volume: 0.8, reduced: false, eggsEnabled: true, eggChance: 'normal', eggTypes: EGG_TYPES.map(type=>type.id), turboFactor: 0.6, rulesEnabled: true, ruleChance: 'normal', theme: 'classic', themeMode: 'fixed', randomThemes: CLASSIC_THEMES };
export function defaultsFor(edition='classic') { const config=editionById(edition); return {...defaults,edition:config.id,packs:[...config.packs],theme:config.defaultTheme,randomThemes:[...config.themes],intensity:2}; }
export function clampSettings(raw = {}, edition=raw.edition || 'classic') {
  const config=editionById(edition);
  const number = (x, fallback, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(Number(x)) ? Math.round(Number(x)) : fallback));
  const count = number(raw.count, 3, 2, 10);
  const min = number(raw.min, 20, 3, 180);
  const max = number(raw.max, 50, min, 300);
  return { edition:config.id, intensity:config.id==='adult'?number(raw.intensity,2,1,3):undefined, count, names: Array.from({length: count}, (_, i) => String(raw.names?.[i] || '').trim().slice(0, 24)), strikes: number(raw.strikes, 3, 1, 10), difficulty: ['all','easy','normal','hard'].includes(raw.difficulty) ? raw.difficulty : 'all', packs: Array.isArray(raw.packs) ? [...new Set(raw.packs.filter(id=>config.packs.includes(id)))] : [...config.packs], min, max: Math.max(min,max), sound: raw.sound !== false, volume: Math.min(1, Math.max(0, Number(raw.volume ?? 0.8))), reduced: raw.reduced === true,
    eggsEnabled: raw.eggsEnabled === true, eggChance: CHANCES[raw.eggChance] === undefined ? 'normal' : raw.eggChance,
    eggTypes: Array.isArray(raw.eggTypes) ? [...new Set(raw.eggTypes.filter(id=>EGG_TYPES.some(type=>type.id===id)))] : EGG_TYPES.map(type=>type.id),
    turboFactor: Math.min(0.9,Math.max(0.4,Number(raw.turboFactor) || 0.6)),
    rulesEnabled: raw.rulesEnabled === true, ruleChance: CHANCES[raw.ruleChance] === undefined ? 'normal' : raw.ruleChance, ...themeSettings(raw,config.id) };
}
export function matchingCategories(settings, categories) {
  return categories.filter(c => settings.packs.includes(c.pack || 'alltag') && (settings.difficulty === 'all' || c.level === settings.difficulty) && (settings.edition!=='adult' || Number.isInteger(c.intensity) && c.intensity<=settings.intensity));
}
export function newGame(settings, edition=settings?.edition || 'classic') {
  const s = clampSettings(settings,edition);
  const theme=s.themeMode==='fixed'?s.theme:drawTheme(s);
  return { version: 1, settings: s, theme, players: s.names.map((name,i) => ({ id: i, name: name || `Spieler ${i+1}`, points: 0 })), phase: 'ready', round: 0, starter: 0, current: 0, category: null, used: [], deadline: null, burstAt: null, penaltyApplied: false, winner: null, eggType: 'normal', usedEggs: [], rule: null, usedRules: [], chaosAt: null, chaosPasses: 0, chaosPassTarget: null, chaosChanges: 0, chaosChanged: false, chaosNoticeUntil: null, chaosFreezeUntil: null, ruleDropped: false };
}
export function pickRoundEgg(game, random = Math.random) {
  const selected = EGG_TYPES.filter(type=>game.settings.eggTypes.includes(type.id));
  if (!game.settings.eggsEnabled || !selected.length || random() >= CHANCES[game.settings.eggChance]) return 'normal';
  let available = selected.filter(type=>!game.usedEggs.includes(type.id));
  if (!available.length) { game.usedEggs=[]; available=selected; }
  if (available.length>1) available=available.filter(type=>type.id!==game.eggType);
  const chosen=available[Math.min(available.length-1,Math.floor(random()*available.length))];
  game.usedEggs.push(chosen.id);
  return chosen.id;
}
export function pickRoundRule(game, category, random = Math.random) {
  const difficulty=game.settings.difficulty==='all'?category.level:game.settings.difficulty;
  const eligible=eligibleRules(category,difficulty);
  if (!game.settings.rulesEnabled || !eligible.length || random() >= CHANCES[game.settings.ruleChance]) return null;
  let available=eligible.filter(rule=>!game.usedRules.includes(rule.id));
  if (!available.length) { game.usedRules=[]; available=eligible; }
  if (available.length>1) available=available.filter(rule=>rule.id!==game.rule?.id);
  const weights=difficulty==='hard'?{easy:0.6,normal:1,hard:3}:difficulty==='normal'?{easy:1,normal:2,hard:0}:{easy:1,normal:0,hard:0};
  const total=available.reduce((sum,rule)=>sum+weights[rule.level],0);
  let draw=random()*total;
  const chosen=available.find(rule=>(draw-=weights[rule.level])<0) || available.at(-1);
  game.usedRules.push(chosen.id);
  return chosen;
}
export function activeIds(game) { return game.players.filter(p => p.points < game.settings.strikes).map(p => p.id); }
export function nextActive(game, from) {
  const alive = activeIds(game);
  if (!alive.length) return null;
  for (let n = 1; n <= game.players.length; n++) {
    const id = (from + n) % game.players.length;
    if (alive.includes(id)) return id;
  }
  return alive[0];
}
export function pickCategory(game, categories, random = Math.random) {
  const pool = matchingCategories(game.settings, categories);
  if (!pool.length) throw new Error(game.settings.packs.length ? game.settings.edition==='adult'?'Für diese Themenpakete, Schwierigkeit und Geschmacksstufe gibt es keine Aufgaben.':'Für diese Themenpakete und Schwierigkeit gibt es keine Aufgaben.' : 'Wähle mindestens ein Themenpaket aus.');
  let unused = pool.filter(c => !game.used.includes(c.id));
  if (!unused.length) { game.used = []; unused = pool; }
  const previousId = game.category?.id;
  if (unused.length > 1) unused = unused.filter(c => c.id !== previousId);
  const counts = new Map();
  for (const c of pool) counts.set(c.pack || 'alltag', 0);
  for (const id of game.used) { const c = pool.find(item => item.id === id); if (c) counts.set(c.pack || 'alltag', counts.get(c.pack || 'alltag') + 1); }
  const minimum = Math.min(...unused.map(c => counts.get(c.pack || 'alltag')));
  let balanced = unused.filter(c => counts.get(c.pack || 'alltag') === minimum);
  const previousPack = game.category?.pack || 'alltag';
  if (balanced.some(c => (c.pack || 'alltag') !== previousPack)) balanced = balanced.filter(c => (c.pack || 'alltag') !== previousPack);
  const chosen = balanced[Math.min(balanced.length - 1, Math.floor(random() * balanced.length))];
  game.used.push(chosen.id);
  return chosen;
}
export function prepareRound(game, categories, random = Math.random) {
  if (!['ready','result'].includes(game.phase)) return false;
  if (activeIds(game).length <= 1) { game.phase = 'winner'; game.winner = activeIds(game)[0] ?? null; return true; }
  game.starter = game.round === 0 ? activeIds(game)[0] : nextActive(game, game.starter);
  game.current = game.starter;
  game.category = pickCategory(game, categories, random);
  game.eggType = pickRoundEgg(game, random);
  game.rule = pickRoundRule(game, game.category, random);
  game.round++;
  game.deadline = null; game.burstAt = null; game.penaltyApplied = false;
  game.chaosAt=null; game.chaosPasses=0; game.chaosPassTarget=null; game.chaosChanges=0; game.chaosChanged=false; game.chaosNoticeUntil=null; game.chaosFreezeUntil=null; game.ruleDropped=false;
  if (game.settings.themeMode==='round' && game.round>1) game.theme=drawTheme(game.settings,game.theme,random);
  game.phase = 'preview';
  return true;
}
export function startRound(game, now = Date.now(), random = Math.random) {
  if (game.phase !== 'preview') return false;
  const range = game.settings.max - game.settings.min + 1;
  const normalSeconds=game.settings.min + Math.floor(random() * range);
  const seconds=game.eggType==='turbo'?Math.max(3,Math.round(normalSeconds*game.settings.turboFactor)):normalSeconds;
  game.deadline = now + seconds * 1000;
  if (game.eggType==='chaos') {
    game.chaosAt=now+Math.max(250,Math.floor(seconds*1000*(0.2+random()*0.35)));
    game.chaosPassTarget=2+Math.min(3,Math.floor(random()*4));
  }
  game.phase = 'running'; return true;
}
export function triggerChaos(game, categories, now = Date.now(), random = Math.random) {
  if (game.phase!=='running' || game.eggType!=='chaos' || game.chaosChanges>=3 || now>=game.deadline || now<(game.chaosFreezeUntil || 0)) return false;
  const ready=game.chaosChanges===0
    ? Number.isFinite(game.chaosAt) && (now>=game.chaosAt || game.chaosPasses>=game.chaosPassTarget)
    : game.chaosPasses>=game.chaosPassTarget;
  if (!ready || now<((game.chaosNoticeUntil || 0)-3400)) return false;
  const alternatives=matchingCategories(game.settings,categories).filter(c=>c.id!==game.category.id);
  if (!alternatives.length) {game.chaosAt=null;game.chaosPasses=0;return false;}
  game.ruleDropped=false;
  let pool=alternatives;
  if (game.rule) {
    const compatible=pool.filter(c=>ruleCompatible(game.rule,c));
    if (compatible.length) pool=compatible;
    else {game.rule=null;game.ruleDropped=true;}
  }
  const unused=pool.filter(c=>!game.used.includes(c.id));
  if (unused.length) pool=unused;
  game.category=pickCategory(game,pool,random);
  game.chaosChanges=(game.chaosChanges || 0)+1;
  game.chaosChanged=true;
  game.chaosPasses=0;
  game.chaosPassTarget=game.chaosChanges<3?2+Math.min(3,Math.floor(random()*4)):null;
  game.chaosAt=null;
  game.chaosFreezeUntil=now+3000;
  game.deadline+=3000;
  game.chaosNoticeUntil=now+5000;
  return true;
}
export function expire(game, now = Date.now()) {
  if (game.phase !== 'running' || !Number.isFinite(game.deadline) || now < game.deadline) return false;
  game.phase = 'burst'; game.burstAt = now; game.chaosAt=null; game.chaosNoticeUntil=null; game.chaosFreezeUntil=null;
  if (!game.penaltyApplied) { game.players[game.current].points+=EGG_TYPES.find(type=>type.id===game.eggType)?.penalty ?? 1; game.penaltyApplied = true; }
  return true;
}
export function pass(game, now = Date.now()) {
  if (expire(game, now)) return 'expired';
  if (game.phase !== 'running') return 'ignored';
  if (now<(game.chaosFreezeUntil || 0)) return 'frozen';
  game.current = nextActive(game, game.current);
  if (game.eggType==='chaos' && game.chaosChanges<3 && (game.chaosChanges===0 || now>=((game.chaosNoticeUntil || 0)-3400))) game.chaosPasses=(game.chaosPasses || 0)+1;
  return 'passed';
}
export function finishBurst(game) {
  if (game.phase !== 'burst') return false;
  const alive = activeIds(game);
  if (alive.length === 1) { game.phase = 'winner'; game.winner = alive[0]; }
  else game.phase = 'result';
  return true;
}
export function goldenReveal(game, now = Date.now()) {
  return game?.phase==='burst' && game.eggType==='golden' && now-(game.burstAt ?? now)>=1150;
}
export function burstDuration(game) { return game?.eggType==='golden' ? 3400 : 1600; }
export function normalizeRestored(game, now = Date.now(), edition='classic') {
  if (!game || game.version !== 1 || !Array.isArray(game.players)) return null;
  if ((game.settings?.edition || 'classic')!==edition) return null;
  if (!Array.isArray(game.settings?.packs)) game.settings = {...game.settings, packs:edition==='classic'?['alltag']:editionById(edition).packs};
  game.settings = clampSettings(game.settings,edition);
  game.theme=editionById(edition).themes.includes(game.theme)?game.theme:game.settings.theme;
  if (!EGG_TYPES.some(type=>type.id===game.eggType)) game.eggType='normal';
  if (!Array.isArray(game.usedEggs)) game.usedEggs=[];
  if (!Array.isArray(game.usedRules)) game.usedRules=[];
  if (!game.rule || !RULES.some(rule=>rule.id===game.rule.id) || !ruleCompatible(game.rule,game.category || {})) game.rule=null;
  if (game.chaosChanged !== true) game.chaosChanged=false;
  if (!Number.isFinite(game.chaosPasses)) game.chaosPasses=0;
  if (!Number.isInteger(game.chaosPassTarget) || game.chaosPassTarget<2 || game.chaosPassTarget>5) game.chaosPassTarget=3;
  if (!Number.isFinite(game.chaosChanges)) game.chaosChanges=game.chaosChanged?1:0;
  game.chaosChanges=Math.min(3,Math.max(0,Math.floor(game.chaosChanges)));
  if (!Number.isFinite(game.chaosFreezeUntil) || game.chaosFreezeUntil<=now) game.chaosFreezeUntil=null;
  if (game.chaosChanges>0) game.chaosAt=null;
  if (game.phase==='running' && game.eggType==='chaos' && game.chaosChanges<3 && Number.isFinite(game.chaosAt) && game.chaosAt>=game.deadline && now<game.deadline) game.chaosAt=now;
  if (game.phase === 'running') expire(game, now);
  if (game.phase === 'burst' && now - (game.burstAt ?? now) >= burstDuration(game)) finishBurst(game);
  return game;
}
