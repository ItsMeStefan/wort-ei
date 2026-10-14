export const CHANCES = {rare:0.10,normal:0.25,often:0.50,always:1};

export const EGG_TYPES = [
  {id:'turbo',name:'Turbo-Ei',description:'Diese Runde könnte besonders schnell vorbei sein!',penalty:1},
  {id:'double',name:'Doppel-Matsch-Ei',description:'Beim Zerplatzen gibt es zwei Strafpunkte.',penalty:2},
  {id:'golden',name:'Goldenes Ei',description:'Beim Zerplatzen gibt es keinen Strafpunkt.',penalty:0},
  {id:'chaos',name:'Chaos-Ei',description:'Das Thema kann sich plötzlich ändern.',penalty:1}
];

// Ohne Metadaten sind nur universelle Regeln zulässig. Neue Kategorien können
// bei Bedarf ruleTags ergänzen; die mitgelieferten Kreativkategorien sind offen.
export function categoryRuleTags(category) {
  const tags = new Set(category.ruleTags || []);
  if (category.pack === 'fantasie') tags.add('open');
  if (category.pack === 'natur') tags.add('tangible');
  if (category.pack === 'fantasie' && !/Ausrede|Regel|sagen|Geräusch|Superkraft/i.test(category.text)) tags.add('short');
  return tags;
}

export const RULES = [
  {id:'robot',text:'Sprich deine Antwort mit Roboterstimme aus!',level:'easy'},
  {id:'whisper',text:'Flüstere deine Antwort!',level:'easy'},
  {id:'news',text:'Sage deine Antwort wie ein Nachrichtensprecher!',level:'easy'},
  {id:'dramatic',text:'Sage deine Antwort besonders dramatisch!',level:'easy'},
  {id:'pirate',text:'Sage deine Antwort wie ein Pirat!',level:'easy'},
  {id:'commentator',text:'Sage deine Antwort wie ein Sportkommentator!',level:'normal'},
  {id:'sleepy',text:'Sage deine Antwort wie jemand, der gleich einschläft!',level:'easy'},
  {id:'ghost',text:'Sage deine Antwort mit Geisterstimme!',level:'easy'},
  {id:'no-a',text:'Deine Antwort darf kein A enthalten!',level:'normal',needs:['open']},
  {id:'no-e',text:'Deine Antwort darf kein E enthalten!',level:'hard',needs:['open']},
  {id:'no-i',text:'Deine Antwort darf kein I enthalten!',level:'normal',needs:['open']},
  {id:'starts-s',text:'Deine Antwort muss mit S beginnen!',level:'normal',needs:['open']},
  {id:'starts-m',text:'Deine Antwort muss mit M beginnen!',level:'normal',needs:['open']},
  {id:'starts-vowel',text:'Deine Antwort muss mit einem Vokal beginnen!',level:'hard',needs:['open']},
  {id:'ends-n',text:'Deine Antwort muss mit N enden!',level:'hard',needs:['open']},
  {id:'ends-vowel',text:'Deine Antwort muss mit einem Vokal enden!',level:'hard',needs:['open']},
  {id:'contains-r',text:'Deine Antwort muss ein R enthalten!',level:'normal',needs:['open']},
  {id:'six-letters',text:'Deine Antwort muss mindestens sechs Buchstaben haben!',level:'normal',needs:['open']},
  {id:'eight-letters',text:'Deine Antwort muss mindestens acht Buchstaben haben!',level:'hard',needs:['open']},
  {id:'five-letters',text:'Deine Antwort darf höchstens fünf Buchstaben haben!',level:'hard',needs:['short']},
  {id:'two-words',text:'Deine Antwort muss aus mindestens zwei Wörtern bestehen!',level:'normal',needs:['open']},
  {id:'longer',text:'Ab der zweiten Antwort: Dein Begriff muss länger sein als der vorige!',level:'hard',needs:['open']},
  {id:'super',text:'Deine Antwort muss das Wort „super“ enthalten!',level:'normal',needs:['open']},
  {id:'three-syllables',text:'Deine Antwort muss genau drei Silben haben!',level:'hard',needs:['short']},
  {id:'touchable',text:'Nenne nur etwas, das man anfassen kann!',level:'normal',needs:['tangible']}
];

export function ruleCompatible(rule, category) {
  if (rule.excludeIds?.includes(category.id)) return false;
  const tags = categoryRuleTags(category);
  return (rule.needs || []).every(tag => tags.has(tag));
}

export function eligibleRules(category, difficulty) {
  const allowed = {easy:['easy'],normal:['easy','normal'],hard:['easy','normal','hard'],all:['easy','normal','hard']}[difficulty] || ['easy'];
  return RULES.filter(rule => allowed.includes(rule.level) && ruleCompatible(rule,category));
}
