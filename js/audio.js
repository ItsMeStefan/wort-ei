let context;
export function unlockAudio() {
  try { context ||= new (window.AudioContext || window.webkitAudioContext)(); if (context.state === 'suspended') context.resume(); } catch { /* Sound is optional. */ }
}
export function crack(settings) {
  if (!settings.sound || settings.volume <= 0) return;
  try {
    unlockAudio(); if (!context) return;
    const duration = 0.42, samples = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, samples, context.sampleRate), data = buffer.getChannelData(0);
    for (let i=0;i<samples;i++) { const t=i/context.sampleRate; data[i]=(Math.random()*2-1)*Math.exp(-t*17)*(t<0.035?1:0.5); }
    const source=context.createBufferSource(), filter=context.createBiquadFilter(), gain=context.createGain();
    source.buffer=buffer; filter.type='lowpass'; filter.frequency.setValueAtTime(3000,context.currentTime); filter.frequency.exponentialRampToValueAtTime(240,context.currentTime+duration);
    gain.gain.value=settings.volume*0.9; source.connect(filter).connect(gain).connect(context.destination); source.start();
    const osc=context.createOscillator(), og=context.createGain(); osc.type='triangle'; osc.frequency.setValueAtTime(180,context.currentTime); osc.frequency.exponentialRampToValueAtTime(70,context.currentTime+0.22); og.gain.setValueAtTime(settings.volume*0.35,context.currentTime); og.gain.exponentialRampToValueAtTime(0.001,context.currentTime+0.23); osc.connect(og).connect(context.destination); osc.start(); osc.stop(context.currentTime+0.24);
  } catch { /* Browsers may block or omit audio. */ }
}

export function tap(settings) {
  if (!settings.sound || settings.volume <= 0) return;
  try {
    unlockAudio(); if (!context) return;
    const now=context.currentTime, osc=context.createOscillator(), gain=context.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(520,now);
    osc.frequency.exponentialRampToValueAtTime(310,now+0.08);
    gain.gain.setValueAtTime(Math.max(0.001,settings.volume*0.12),now);
    gain.gain.exponentialRampToValueAtTime(0.001,now+0.09);
    osc.connect(gain).connect(context.destination);
    osc.start(now); osc.stop(now+0.09);
  } catch { /* Sound is optional. */ }
}
