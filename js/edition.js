export const CLASSIC_PACKS = ['alltag','mario','minecraft','pokemon','gaming','filme','schule','fantasie','natur'];
export const ADULT_PACKS = ['sex','dating','dark','horror','crime','gross','party','taboo','work','daily','hell','moral'];
export const CLASSIC_THEMES = ['classic','retro','halloween','neon','winter'];
export const ADULT_THEMES = ['after-dark',...CLASSIC_THEMES];
export const EDITIONS = Object.freeze({
  classic: {id:'classic',storageKey:'wort-ei-v1',packs:CLASSIC_PACKS,themes:CLASSIC_THEMES,defaultTheme:'classic',categoryUrl:'./categories.json'},
  adult: {id:'adult',storageKey:'wort-ei-adult-v1',packs:ADULT_PACKS,themes:ADULT_THEMES,defaultTheme:'after-dark',categoryUrl:'./categories.json',gateKey:'wort-ei-adult-confirmed'}
});
export function editionById(id) { return EDITIONS[id] || EDITIONS.classic; }
