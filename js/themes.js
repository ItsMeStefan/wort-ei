export const THEMES = Object.freeze([
  {id:'classic',name:'Klassisch',description:'Das vertraute Wort-Ei.',symbol:'●',effect:'crack'},
  {id:'retro',name:'Retro-Arcade',description:'Pixel, Punkte und Arcade-Licht.',symbol:'▣',effect:'pixels'},
  {id:'halloween',name:'Halloween',description:'Mondschein und lustiger Spuk.',symbol:'☾',effect:'slime'},
  {id:'neon',name:'Neon',description:'Digitale Energie im Dunkeln.',symbol:'✦',effect:'energy'},
  {id:'winter',name:'Winter',description:'Schnee, Eis und Sternenglanz.',symbol:'❄',effect:'snow'}
]);
export const THEME_IDS = THEMES.map(theme=>theme.id);
export function themeById(id) { return THEMES.find(theme=>theme.id===id) || THEMES[0]; }
export function themeSettings(raw={}) {
  const theme=themeById(raw.theme).id;
  const themeMode=['fixed','party','round'].includes(raw.themeMode)?raw.themeMode:'fixed';
  const randomThemes=Array.isArray(raw.randomThemes)?[...new Set(raw.randomThemes.filter(id=>THEME_IDS.includes(id)))]:[...THEME_IDS];
  return {theme,themeMode,randomThemes:randomThemes.length?randomThemes:[theme]};
}
export function drawTheme(settings,previous=null,random=Math.random) {
  const options=settings.randomThemes?.filter(id=>THEME_IDS.includes(id)) || [settings.theme];
  const pool=options.length>1?options.filter(id=>id!==previous):options;
  return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))] || 'classic';
}
export function eggAppearance(themeId,eggType) {
  const theme=themeById(themeId);
  const type=['normal','turbo','double','golden','chaos'].includes(eggType)?eggType:'normal';
  return {theme:theme.id,type,effect:theme.effect};
}
