export const STORAGE_KEY = 'wort-ei-v1';
export const PACK_IDS = ['alltag','mario','minecraft','pokemon','gaming','filme','schule','fantasie','natur'];
export const defaults = { count: 3, names: [], strikes: 3, difficulty: 'all', packs: [...PACK_IDS], min: 20, max: 50, sound: true, volume: 0.8, reduced: false };
export function clampSettings(raw = {}) {
  const number = (x, fallback, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(Number(x)) ? Math.round(Number(x)) : fallback));
  const count = number(raw.count, 3, 2, 10);
  const min = number(raw.min, 20, 3, 180);
  const max = number(raw.max, 50, min, 300);
  return { count, names: Array.from({length: count}, (_, i) => String(raw.names?.[i] || '').trim().slice(0, 24)), strikes: number(raw.strikes, 3, 1, 10), difficulty: ['all','easy','normal','hard'].includes(raw.difficulty) ? raw.difficulty : 'all', packs: Array.isArray(raw.packs) ? [...new Set(raw.packs.filter(id=>PACK_IDS.includes(id)))] : [...PACK_IDS], min, max: Math.max(min,max), sound: raw.sound !== false, volume: Math.min(1, Math.max(0, Number(raw.volume ?? 0.8))), reduced: raw.reduced === true };
}
export function matchingCategories(settings, categories) {
  return categories.filter(c => settings.packs.includes(c.pack || 'alltag') && (settings.difficulty === 'all' || c.level === settings.difficulty));
}
export function newGame(settings) {
  const s = clampSettings(settings);
  return { version: 1, settings: s, players: s.names.map((name,i) => ({ id: i, name: name || `Spieler ${i+1}`, points: 0 })), phase: 'ready', round: 0, starter: 0, current: 0, category: null, used: [], deadline: null, burstAt: null, penaltyApplied: false, winner: null };
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
  if (!pool.length) throw new Error(game.settings.packs.length ? 'Für diese Themenpakete und Schwierigkeit gibt es keine Kategorien.' : 'Wähle mindestens ein Themenpaket aus.');
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
  game.round++;
  game.deadline = null; game.burstAt = null; game.penaltyApplied = false;
  game.phase = 'preview';
  return true;
}
export function startRound(game, now = Date.now(), random = Math.random) {
  if (game.phase !== 'preview') return false;
  const range = game.settings.max - game.settings.min + 1;
  game.deadline = now + (game.settings.min + Math.floor(random() * range)) * 1000;
  game.phase = 'running'; return true;
}
export function expire(game, now = Date.now()) {
  if (game.phase !== 'running' || !Number.isFinite(game.deadline) || now < game.deadline) return false;
  game.phase = 'burst'; game.burstAt = now;
  if (!game.penaltyApplied) { game.players[game.current].points++; game.penaltyApplied = true; }
  return true;
}
export function pass(game, now = Date.now()) {
  if (expire(game, now)) return 'expired';
  if (game.phase !== 'running') return 'ignored';
  game.current = nextActive(game, game.current);
  return 'passed';
}
export function finishBurst(game) {
  if (game.phase !== 'burst') return false;
  const alive = activeIds(game);
  if (alive.length === 1) { game.phase = 'winner'; game.winner = alive[0]; }
  else game.phase = 'result';
  return true;
}
export function normalizeRestored(game, now = Date.now()) {
  if (!game || game.version !== 1 || !Array.isArray(game.players)) return null;
  if (!Array.isArray(game.settings?.packs)) game.settings = {...game.settings, packs:['alltag']};
  game.settings = clampSettings(game.settings);
  if (game.phase === 'running') expire(game, now);
  if (game.phase === 'burst' && now - (game.burstAt || now) > 1600) finishBurst(game);
  return game;
}
