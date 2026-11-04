/* 步調 Pace: 20 notification sounds and 20 alarm sounds (A has 3 and 4). They are tiny synthesized tunes (no audio files),
   added to A's own tables SOUNDS (long alarm, 15 s loop of a short melody) and NOTIFY (the 1–2 s ping before it) and to the two pickers in Settings.
   Also adds 「試聽通知聲」 and lets a ping use a waveform other than sine. Loaded after A's own script (in C and in A-next). */
(() => {
  if (typeof SOUNDS === 'undefined' || typeof NOTIFY === 'undefined' || typeof playNotifyPing !== 'function') return;
  const sel1 = document.getElementById('notifySound'), sel2 = document.getElementById('alarmSound');
  if (!sel1 || !sel2) return;

  // [id, 名稱, English, waveform, gain, notes [Hz, start s, length s]]
  const PINGS = [
    ['water', '水滴', 'Water drop', 'sine', .25, [[1200, 0, .18], [800, .06, .3]]],
    ['marimba', '馬林巴', 'Marimba', 'triangle', .3, [[784, 0, .3], [988, .14, .3], [1175, .28, .5]]],
    ['bubble', '泡泡', 'Bubbles', 'sine', .22, [[500, 0, .1], [900, .05, .12], [1400, .1, .2]]],
    ['glass', '玻璃杯', 'Glass', 'sine', .16, [[2093, 0, .8], [2637, .02, .7]]],
    ['harp', '豎琴', 'Harp', 'triangle', .28, [[523, 0, .5], [659, .1, .5], [784, .2, .5], [1047, .3, .8]]],
    ['wood', '木魚', 'Wood block', 'square', .12, [[392, 0, .12], [392, .2, .12]]],
    ['coin', '金幣', 'Coin', 'square', .12, [[988, 0, .08], [1319, .08, .6]]],
    ['jingle', '小鈴鐺', 'Little bell', 'sine', .2, [[1760, 0, .4], [2093, .15, .5], [1760, .4, .5]]],
    ['sonar', '聲納', 'Sonar', 'sine', .25, [[1000, 0, .7], [1000, .45, .4]]],
    ['sparkle', '閃亮', 'Sparkle', 'sine', .16, [[1568, 0, .2], [1976, .07, .2], [2349, .14, .2], [3136, .21, .5]]],
    ['knock', '敲門', 'Knock', 'triangle', .4, [[200, 0, .1], [200, .18, .1], [200, .36, .1]]],
    ['whistle', '口哨', 'Whistle', 'sine', .22, [[1500, 0, .2], [2000, .15, .4]]],
    ['retro', '復古遊戲', 'Retro game', 'square', .1, [[523, 0, .07], [659, .07, .07], [784, .14, .07], [1047, .21, .25]]],
    ['soft', '輕柔', 'Soft', 'sine', .16, [[440, 0, .9], [554, .2, .9]]],
    ['doorbell', '門鈴', 'Doorbell', 'sine', .25, [[659, 0, .5], [523, .5, .9]]],
    ['pluck', '撥弦', 'Pluck', 'sawtooth', .09, [[330, 0, .3], [494, .1, .3]]],
    ['triple', '三連音', 'Triple beep', 'sine', .22, [[587, 0, .25], [587, .25, .25], [880, .5, .6]]]
  ];
  // [id, 名稱, English, waveform, melody (Hz), seconds between notes, note length, gain]
  const ALARMS = [
    ['musicbox', '音樂盒', 'Music box', 'triangle', [1047, 1319, 1568, 2093, 1568, 1319], .3, .5, .22],
    ['organ', '電子琴', 'Organ', 'square', [262, 330, 392, 523, 392, 330], .22, .2, .08],
    ['windchime', '風鈴', 'Wind chimes', 'sine', [1568, 1760, 2093, 1760, 2349, 1976], .35, .8, .22],
    ['siren', '警報', 'Siren', 'sawtooth', [600, 900], .5, .45, .09],
    ['radar', '雷達', 'Radar', 'sine', [1200, 900], .8, .15, .25],
    ['tower', '鐘塔', 'Clock tower', 'sine', [196, 147, 165, 98], .9, 1.2, .35],
    ['space', '太空', 'Space', 'triangle', [330, 440, 554, 660, 554, 440], .3, .3, .2],
    ['cuckoo', '布穀鳥', 'Cuckoo', 'sine', [784, 622], .6, .3, .3],
    ['digital', '數位鬧鐘', 'Digital clock', 'square', [1319, 1319, 1319, 1047], .12, .08, .1],
    ['lullaby', '搖籃曲', 'Lullaby', 'sine', [392, 392, 587, 587, 659, 659, 587], .4, .5, .25],
    ['jazz', '爵士', 'Jazz', 'triangle', [262, 330, 392, 466, 440, 392, 330, 294], .3, .3, .28],
    ['march', '進行曲', 'March', 'square', [392, 392, 523, 392, 523, 659], .25, .2, .09],
    ['dream', '夢境', 'Dream', 'sine', [262, 330, 392, 494, 392, 330], .5, 1, .22],
    ['kalimba', '拇指琴', 'Kalimba', 'triangle', [523, 659, 784, 659, 880, 784, 659, 523], .22, .4, .3],
    ['tick', '時鐘滴答', 'Ticking clock', 'square', [2000, 1500], .5, .04, .1],
    ['popcorn', '爆米花', 'Popcorn', 'square', [1319, 988, 1175, 1047, 1568, 1175], .13, .06, .1]
  ];

  for (const [id, , , type, gain, notes] of PINGS) { notes.type = type; notes.gain = gain; NOTIFY[id] = notes; }
  for (const [id, , , type, seq, step, dur, gain] of ALARMS) SOUNDS[id] = { type, seq, step, dur, gain };
  const add = (sel, list) => { for (const x of list) sel.add(new Option(x[1], x[0])); };
  add(sel1, PINGS); add(sel2, ALARMS);
  window.PACE_SOUND_NAMES = Object.fromEntries([...PINGS, ...ALARMS].map(x => [x[1], x[2]]));

  // pings can now say which waveform and loudness they use (the old ones stay sine / .25)
  window.playNotifyPing = playNotifyPing = function (ctx, t0) {
    const notes = NOTIFY[prefGet('planner-notify-sound', 'ding')] || NOTIFY.ding, type = notes.type || 'sine', peak = notes.gain || .25;
    for (const [f, dt, len] of notes) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + dt);
      g.gain.exponentialRampToValueAtTime(peak, t0 + dt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + len);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0 + dt); o.stop(t0 + dt + len + 0.02);
      alarmNodes.push(o);
    }
  };

  // a button to hear only the short ping (the existing one plays the ping and then the long alarm)
  const test = document.getElementById('alarmTest');
  if (test && !document.getElementById('pingTest')) {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'btn', id: 'pingTest', textContent: '試聽通知聲' });
    test.before(b);
    b.addEventListener('click', () => {
      try {
        stopAlarmSound();
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        const ctx = playChime.ctx || (playChime.ctx = new AC()); if (ctx.state === 'suspended') ctx.resume();
        playNotifyPing(ctx, ctx.currentTime + .05);
      } catch (e) {}
    });
  }
  // choosing a sound plays it once, so you hear what you picked
  sel1.addEventListener('change', () => document.getElementById('pingTest')?.click());
  // the saved choice may be one of the new ones: the picker was filled before they existed
  try { sel1.value = prefGet('planner-notify-sound', 'ding'); sel2.value = prefGet('planner-alarm-sound', 'bell'); } catch (e) {}
})();
