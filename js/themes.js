import {editionById} from './edition.js';
export const THEMES = Object.freeze([
  {id:'classic',name:'Klassisch',description:'Das vertraute Wort-Ei.',symbol:'●',effect:'crack'},
  {id:'retro',name:'Retro-Arcade',description:'Pixel, Punkte und Arcade-Licht.',symbol:'▣',effect:'pixels'},
  {id:'halloween',name:'Halloween',description:'Mondschein und lustiger Spuk.',symbol:'☾',effect:'slime'},
  {id:'neon',name:'Neon',description:'Digitale Energie im Dunkeln.',symbol:'✦',effect:'energy'},
  {id:'winter',name:'Winter',description:'Schnee, Eis und Sternenglanz.',symbol:'❄',effect:'snow'}
]);
export const AFTER_DARK = Object.freeze({id:'after-dark',name:'After Dark',description:'Dunkel, frech und ziemlich fragwürdig.',symbol:'✹',effect:'crack'});
export const THEME_IDS = THEMES.map(theme=>theme.id);
export function themesFor(edition='classic') { const ids=editionById(edition).themes; return [AFTER_DARK,...THEMES].filter(theme=>ids.includes(theme.id)); }
export function themeById(id) { return [AFTER_DARK,...THEMES].find(theme=>theme.id===id) || THEMES[0]; }
export function themeSettings(raw={},edition='classic') {
  const config=editionById(edition);
  const theme=config.themes.includes(raw.theme)?raw.theme:config.defaultTheme;
  const themeMode=['fixed','party','round'].includes(raw.themeMode)?raw.themeMode:'fixed';
  const randomThemes=Array.isArray(raw.randomThemes)?[...new Set(raw.randomThemes.filter(id=>config.themes.includes(id)))]:[...config.themes];
  return {theme,themeMode,randomThemes:randomThemes.length?randomThemes:[theme]};
}
export function drawTheme(settings,previous=null,random=Math.random) {
  const allowed=editionById(settings.edition).themes;
  const options=settings.randomThemes?.filter(id=>allowed.includes(id)) || [settings.theme];
  const pool=options.length>1?options.filter(id=>id!==previous):options;
  return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))] || 'classic';
}
export function eggAppearance(themeId,eggType) {
  const theme=themeById(themeId);
  const type=['normal','turbo','double','golden','chaos'].includes(eggType)?eggType:'normal';
  return {theme:theme.id,type,effect:theme.effect};
}
