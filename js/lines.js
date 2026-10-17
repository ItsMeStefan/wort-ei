export const burstLines = [
  'Das Ei ist geplatzt. Deine Würde schon vorher.','Selbst die Hölle schämt sich gerade.','Tja. Das war wohl zu viel für dich.',
  'Die Antwort war schlecht. Das Timing noch schlechter.','Das Ei hat mehr durchgemacht als deine letzte Beziehung.',
  'Ein kleiner Knall für das Ei. Ein großer für dein Ego.','Du warst heiß. Das Ei war schneller.','Die Schale ist hin. Dein Ruf auch.',
  'Selbst der Sensenmann hätte besser gepasst.','Dieser Matsch bleibt an dir kleben.','Das war keine Glanzleistung, aber immerhin ein Knall.',
  'Dein Timing hat heute Hausverbot.','Das Ei hat aufgegeben. Verständlich.','Ein Punkt für das Chaos. Keiner für deine Würde.',
  'Jetzt weiß jeder, wer das Ei beleidigt hat.','Kurz Hoffnung, dann sehr viel Eigelb.','Sogar dein Schutzengel schaut weg.',
  'Das war ein Abgang mit Flecken.','Du hast das Ei übernommen. Es hat es persönlich genommen.','Die Runde endet. Die Peinlichkeit bleibt.'
];
export const winnerLines = [
  'Gewonnen. Charakterlich trotzdem fragwürdig.','Du bist der letzte Überlebende. Glückwunsch, du Monster.',
  'Ein Sieg, den du deiner Familie besser nicht erklärst.','Du hast gewonnen. Dein Anstand nicht.',
  'Das Ei hat alle anderen erwischt. Du darfst angeben.','Der Pokal ist imaginär. Der schlechte Ruf bleibt.',
  'Gegen diese Runde war die Hölle harmlos.','Du warst schneller als deine Ausreden.',
  'Ein Triumph mit schmutzigen Händen.','Du bist das letzte Ei im Karton.',
  'Glückwunsch. Die anderen reden bestimmt noch darüber.','Sieger. Ob das ein Kompliment ist, bleibt offen.',
  'Dein Timing war erschreckend gut.','Du hast gewonnen und niemand ist stolz darauf.','Am Ende bleibt nur dein fragwürdiger Ruhm.'
];
export function drawLine(lines,random=Math.random) { return lines[Math.min(lines.length-1,Math.floor(random()*lines.length))]; }
