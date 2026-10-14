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

export function playChaosAlarm(settings, themeId='classic') {
  if (!settings.sound || settings.volume<=0) return;
  try {
    unlockAudio(); if (!context) return;
    const wave={retro:'square',halloween:'sawtooth',neon:'triangle',winter:'sine'}[themeId] || 'square';
    const start=context.currentTime;
    [0,0.18,0.36].forEach((offset,index)=>{
      const at=start+offset, oscillator=context.createOscillator(), gain=context.createGain();
      oscillator.type=wave;
      oscillator.frequency.setValueAtTime(index===1?740:510,at);
      oscillator.frequency.exponentialRampToValueAtTime(index===1?430:290,at+0.14);
      gain.gain.setValueAtTime(0.001,at);
      gain.gain.linearRampToValueAtTime(settings.volume*0.15,at+0.015);
      gain.gain.exponentialRampToValueAtTime(0.001,at+0.15);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at); oscillator.stop(at+0.16);
    });
  } catch { /* Sound is optional. */ }
}

// Sound dispatch is cosmetic: the game only reports the burst event.
let lastBurstSound=0;
export function playBurst(settings,themeId='classic',eggType='normal') {
  if (!settings.sound || settings.volume<=0) return;
  const now=Date.now(); if (now-lastBurstSound<180) return; lastBurstSound=now;
  if (themeId==='classic') { crack(settings); return; }
  try {
    unlockAudio(); if (!context) return;
    const profiles={retro:[440,165,'square'],halloween:[330,95,'sawtooth'],neon:[850,135,'triangle'],winter:[1250,450,'sine']};
    const [start,end,wave]=profiles[themeId] || profiles.retro;
    const t=context.currentTime, osc=context.createOscillator(), gain=context.createGain();
    osc.type=wave; osc.frequency.setValueAtTime(start,t);
    osc.frequency.exponentialRampToValueAtTime(end,t+0.22);
    gain.gain.setValueAtTime(Math.max(.001,settings.volume*(eggType==='golden'?.12:.2)),t);
    gain.gain.exponentialRampToValueAtTime(.001,t+0.24);
    osc.connect(gain).connect(context.destination); osc.start(t); osc.stop(t+0.24);
  } catch { crack(settings); }
}

export function playGoldReveal(settings) {
  if (!settings.sound || settings.volume<=0) return;
  try {
    unlockAudio(); if (!context || context.state!=='running') return;
    const start=context.currentTime;
    [523.25,659.25,783.99,1046.5].forEach((frequency,index)=>{
      const at=start+index*0.12, oscillator=context.createOscillator(), gain=context.createGain();
      oscillator.type='sine'; oscillator.frequency.setValueAtTime(frequency,at);
      gain.gain.setValueAtTime(0.001,at);
      gain.gain.linearRampToValueAtTime(settings.volume*0.14,at+0.025);
      gain.gain.exponentialRampToValueAtTime(0.001,at+0.32);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at); oscillator.stop(at+0.33);
    });
  } catch { /* Sound is optional. */ }
}
