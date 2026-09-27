/* ============================================================
   减压踢踏 · 辛普森混搭
   纯前端游戏：扭曲表情 / 拖拽五官 / 融合彩蛋
   音效与 BGM 全部用 Web Audio API 合成，无外部资源
   ============================================================ */
(() => {
  'use strict';

  /* ============================================================
     一、音频引擎（合成音效 + 低保真 BGM）
     ============================================================ */
  const AudioEngine = {
    ctx: null, master: null, bgmGain: null, sfxGain: null,
    bgmTimer: null, bgmStep: 0, bgmOn: true, muted: false,

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0;
      this.bgmGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.master);
    },
    resume() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    sfx(type) {
      if (this.muted) return;
      this.resume();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      ({ stretch: () => this._stretch(t), whimper: () => this._whimper(t),
         boing: () => this._boing(t), chin: () => this._chin(t),
         fusion: () => this._fusion(t), pop: () => this._pop(t) }[type] || (() => {}))();
    },
    // 橡胶拉伸（Stewie）
    _stretch(t) {
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      const lfo = this.ctx.createOscillator(), lfoG = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.25);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.55);
      lfo.type = 'sine'; lfo.frequency.value = 15; lfoG.gain.value = 22;
      lfo.connect(lfoG); lfoG.connect(osc.frequency);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.28, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t); lfo.start(t); osc.stop(t + 0.65); lfo.stop(t + 0.65);
    },
    // 小狗哼（Brian）
    _whimper(t) {
      [0, 0.16].forEach((d, i) => {
        const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
        osc.type = 'triangle';
        const f = 720 - i * 140;
        osc.frequency.setValueAtTime(f, t + d);
        osc.frequency.exponentialRampToValueAtTime(f * 0.55, t + d + 0.15);
        g.gain.setValueAtTime(0, t + d);
        g.gain.linearRampToValueAtTime(0.26, t + d + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.18);
        osc.connect(g); g.connect(this.sfxGain);
        osc.start(t + d); osc.stop(t + d + 0.2);
      });
    },
    // 头发弹（Marge）
    _boing(t) {
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      for (let i = 1; i <= 6; i++) osc.frequency.setValueAtTime(i % 2 ? 520 : 180, t + i * 0.05);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.4);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.32, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t); osc.stop(t + 0.5);
    },
    // 下巴下垂（Homer）
    _chin(t) {
      const o1 = this.ctx.createOscillator(), g1 = this.ctx.createGain();
      o1.type = 'sine'; o1.frequency.setValueAtTime(150, t);
      o1.frequency.exponentialRampToValueAtTime(55, t + 0.18);
      g1.gain.setValueAtTime(0, t); g1.gain.linearRampToValueAtTime(0.4, t + 0.02);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o1.connect(g1); g1.connect(this.sfxGain);
      o1.start(t); o1.stop(t + 0.35);
      // 弹跳第二声
      const o2 = this.ctx.createOscillator(), g2 = this.ctx.createGain();
      o2.type = 'sine'; o2.frequency.setValueAtTime(190, t + 0.2);
      o2.frequency.exponentialRampToValueAtTime(85, t + 0.4);
      g2.gain.setValueAtTime(0, t + 0.2); g2.gain.linearRampToValueAtTime(0.22, t + 0.22);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o2.connect(g2); g2.connect(this.sfxGain);
      o2.start(t + 0.2); o2.stop(t + 0.55);
    },
    _pop(t) {
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = 'square'; osc.frequency.setValueAtTime(820, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.08);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t); osc.stop(t + 0.12);
    },
    // 融合爆裂：噪声 + 随机音高
    _fusion(t) {
      const dur = 0.75;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.7;
      const g = this.ctx.createGain(); g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(bp); bp.connect(g); g.connect(this.sfxGain);
      src.start(t); src.stop(t + dur);
      for (let i = 0; i < 7; i++) {
        const o = this.ctx.createOscillator(), og = this.ctx.createGain();
        const tt = t + Math.random() * 0.65;
        o.type = 'square'; o.frequency.setValueAtTime(220 + Math.random() * 1300, tt);
        og.gain.setValueAtTime(0, tt); og.gain.linearRampToValueAtTime(0.12, tt + 0.01);
        og.gain.exponentialRampToValueAtTime(0.001, tt + 0.12);
        o.connect(og); og.connect(this.sfxGain);
        o.start(tt); o.stop(tt + 0.15);
      }
    },
    // BGM：低保真卡通曲调循环
    startBgm() {
      this.resume();
      if (!this.ctx || this.bgmTimer) return;
      if (this.bgmOn) this.bgmGain.gain.linearRampToValueAtTime(0.16, this.ctx.currentTime + 1.2);
      this.bgmStep = 0;
      const tempo = 88, stepDur = 60 / tempo / 2; // 八分音符
      // 和弦进行 C - Am - F - G（半音偏移）
      const chords = [[0,4,7],[9,12,16],[5,9,12],[7,11,14]];
      const root = 130.81; // C3
      const semi = s => root * Math.pow(2, s/12);
      const tick = () => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const bar = Math.floor(this.bgmStep / 16) % 4;
        const beat = this.bgmStep % 16;
        // 每小节首拍铺和弦 pad
        if (beat % 8 === 0) {
          chords[bar].forEach(s => {
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = 'sine'; o.frequency.value = semi(s) / 2;
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.4);
            g.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 8);
            o.connect(g); g.connect(this.bgmGain);
            o.start(t); o.stop(t + stepDur * 8 + 0.05);
          });
        }
        // 软底鼓
        if (beat % 4 === 0) {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(115, t);
          o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
          g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          o.connect(g); g.connect(this.bgmGain);
          o.start(t); o.stop(t + 0.2);
        }
        // 琶音旋律
        const ch = chords[bar];
        const note = ch[beat % 3] + 12;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'triangle'; o.frequency.value = semi(note);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 0.9);
        o.connect(g); g.connect(this.bgmGain);
        o.start(t); o.stop(t + stepDur);
        this.bgmStep++;
      };
      tick();
      this.bgmTimer = setInterval(tick, stepDur * 1000);
    },
    toggleBgm() {
      this.bgmOn = !this.bgmOn;
      if (this.ctx) this.bgmGain.gain.linearRampToValueAtTime(this.bgmOn ? 0.16 : 0, this.ctx.currentTime + 0.4);
      return this.bgmOn;
    },
    toggleMute() {
      this.muted = !this.muted;
      if (this.ctx) this.master.gain.value = this.muted ? 0 : 0.55;
      return this.muted;
    }
  };

  /* ============================================================
     二、角色数据：每个特征为一组 SVG（含 class="feat feat-xxx"）
     expressions：每次轻击循环切换的愚蠢表情（m 为强度倍率，1 普通，2 融合加倍）
     ============================================================ */
  const SKIN = '#FCD936', SKIN_DK = '#E8B918', OUT = '#1a1a1a';
  const stroke = (w) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  const CHARS = {
    homer: {
      name: '荷马', bg: '#5DADE2', sound: 'chin', face: SKIN,
      order: ['head','extra','hair','eyes','nose','mouth'],
      features: {
        head: `<g class="feat feat-head" data-feat="head">
          <ellipse cx="100" cy="120" rx="56" ry="62" fill="${SKIN}" ${stroke(4)}/>
          <ellipse cx="44" cy="124" rx="9" ry="13" fill="${SKIN}" ${stroke(3.5)}/>
          <ellipse cx="156" cy="124" rx="9" ry="13" fill="${SKIN}" ${stroke(3.5)}/>
        </g>`,
        hair: `<g class="feat feat-hair" data-feat="hair">
          <path d="M58 80 Q64 46 76 70 Q88 50 100 68 Q112 50 124 70 Q136 46 142 80 Q100 96 58 80 Z" fill="${SKIN_DK}" ${stroke(3.5)}/>
        </g>`,
        eyes: `<g class="feat feat-eyes" data-feat="eyes">
          <circle cx="80" cy="106" r="15" fill="#fff" ${stroke(3.5)}/>
          <circle cx="120" cy="106" r="15" fill="#fff" ${stroke(3.5)}/>
          <circle class="pupil" cx="82" cy="108" r="4.5" fill="${OUT}"/>
          <circle class="pupil" cx="118" cy="108" r="4.5" fill="${OUT}"/>
        </g>`,
        nose: `<g class="feat feat-nose" data-feat="nose">
          <path d="M88 118 Q100 140 112 118 Q112 130 100 136 Q88 130 88 118 Z" fill="${SKIN_DK}" ${stroke(3.5)}/>
        </g>`,
        mouth: `<g class="feat feat-mouth" data-feat="mouth">
          <path d="M82 150 Q100 162 118 150" fill="none" ${stroke(3.5)}/>
        </g>`,
        extra: `<g class="feat feat-extra" data-feat="extra">
          <path d="M64 150 Q100 188 136 150 Q142 170 100 184 Q58 170 64 150 Z" fill="${SKIN_DK}" ${stroke(3.5)}/>
          <circle cx="90" cy="172" r="1.6" fill="#7a5e00"/>
          <circle cx="100" cy="176" r="1.6" fill="#7a5e00"/>
          <circle cx="110" cy="172" r="1.6" fill="#7a5e00"/>
        </g>`
      },
      expressions: [
        m => ({ extra: `translateY(${16*m}px) scaleY(${1+0.35*m})`, mouth: `translateY(${10*m}px)` }),
        m => ({ eyes: `scaleY(${1+0.4*m})`, nose: `scaleY(${1+0.25*m})`, mouth: `scaleY(${1+0.6*m})` }),
        m => ({ extra: `translateY(${12*m}px) scaleY(${1+0.25*m})`, mouth: `translateY(${8*m}px) scaleY(${1.6+0.4*m})` })
      ]
    },

    marge: {
      name: '玛吉', bg: '#FF8B94', sound: 'boing', face: SKIN,
      order: ['head','extra','hair','eyes','nose','mouth'],
      features: {
        head: `<g class="feat feat-head" data-feat="head">
          <ellipse cx="100" cy="122" rx="48" ry="52" fill="${SKIN}" ${stroke(4)}/>
          <ellipse cx="52" cy="126" rx="8" ry="11" fill="${SKIN}" ${stroke(3.5)}/>
          <ellipse cx="148" cy="126" rx="8" ry="11" fill="${SKIN}" ${stroke(3.5)}/>
        </g>`,
        hair: `<g class="feat feat-hair" data-feat="hair">
          <path d="M62 90 Q52 14 100 6 Q148 14 138 90 Q100 70 62 90 Z" fill="#3D8FE0" ${stroke(4)}/>
          <ellipse cx="100" cy="22" rx="38" ry="26" fill="#3D8FE0" ${stroke(4)}/>
          <path d="M68 40 Q100 52 132 40" fill="none" ${stroke(2.5)} opacity="0.5"/>
        </g>`,
        eyes: `<g class="feat feat-eyes" data-feat="eyes">
          <circle cx="86" cy="112" r="11" fill="#fff" ${stroke(3)}/>
          <circle cx="114" cy="112" r="11" fill="#fff" ${stroke(3)}/>
          <circle cx="88" cy="114" r="3.5" fill="${OUT}"/>
          <circle cx="116" cy="114" r="3.5" fill="${OUT}"/>
          <path d="M77 102 L73 96 M86 100 L86 93 M95 102 L99 96" fill="none" ${stroke(2)}/>
          <path d="M105 102 L101 96 M114 100 L114 93 M123 102 L127 96" fill="none" ${stroke(2)}/>
        </g>`,
        nose: `<g class="feat feat-nose" data-feat="nose">
          <ellipse cx="100" cy="128" rx="6" ry="5" fill="${OUT}"/>
        </g>`,
        mouth: `<g class="feat feat-mouth" data-feat="mouth">
          <path d="M88 142 Q100 150 112 142" fill="none" ${stroke(3)}/>
          <path d="M92 144 Q100 148 108 144" fill="#C0392B" ${stroke(2)}/>
        </g>`,
        extra: `<g class="feat feat-extra" data-feat="extra">
          <g fill="#fff" ${stroke(1.5)}>
            <circle cx="76" cy="170" r="4"/><circle cx="88" cy="174" r="4"/><circle cx="100" cy="176" r="4"/>
            <circle cx="112" cy="174" r="4"/><circle cx="124" cy="170" r="4"/>
          </g>
        </g>`
      },
      expressions: [
        m => ({ hair: `skewX(${-12*m}deg) rotate(${-7*m}deg)` }),
        m => ({ hair: `skewX(${11*m}deg) rotate(${9*m}deg) scaleY(${1-0.08*m})` }),
        m => ({ hair: `rotate(${-11*m}deg)`, eyes: `scaleY(${1-0.5*m})`, mouth: `scaleY(${1+0.5*m})` })
      ]
    },

    stewie: {
      name: '斯特维', bg: '#A8E6CF', sound: 'stretch', face: SKIN,
      order: ['head','hair','extra','eyes','nose','mouth'],
      features: {
        head: `<g class="feat feat-head" data-feat="head">
          <ellipse cx="100" cy="105" rx="66" ry="52" fill="${SKIN}" ${stroke(4)}/>
        </g>`,
        hair: `<g class="feat feat-hair" data-feat="hair">
          <path d="M44 86 Q52 50 70 80 Q60 56 82 78 Q72 52 94 76" fill="none" stroke="#9a7b1a" stroke-width="6" stroke-linecap="round"/>
        </g>`,
        eyes: `<g class="feat feat-eyes" data-feat="eyes">
          <ellipse cx="82" cy="100" rx="9" ry="10" fill="#fff" ${stroke(3)}/>
          <ellipse cx="118" cy="100" rx="9" ry="10" fill="#fff" ${stroke(3)}/>
          <circle cx="84" cy="102" r="3.5" fill="${OUT}"/>
          <circle cx="120" cy="102" r="3.5" fill="${OUT}"/>
        </g>`,
        nose: `<g class="feat feat-nose" data-feat="nose">
          <path d="M95 116 L100 124 L105 116 Z" fill="${OUT}"/>
        </g>`,
        mouth: `<g class="feat feat-mouth" data-feat="mouth">
          <path d="M88 132 Q100 124 112 132" fill="none" ${stroke(3)}/>
        </g>`,
        extra: `<g class="feat feat-extra" data-feat="extra">
          <rect x="74" y="140" width="6" height="44" fill="#E53935" ${stroke(2)}/>
          <rect x="120" y="140" width="6" height="44" fill="#E53935" ${stroke(2)}/>
          <rect x="68" y="150" width="64" height="40" fill="#1565C0" ${stroke(2)}/>
        </g>`
      },
      expressions: [
        m => ({ head: `scaleY(${1+0.28*m})`, hair: `translateY(${-8*m}px)`, eyes: `translateY(${-4*m}px)` }),
        m => ({ head: `scaleX(${1+0.16*m}) scaleY(${1+0.12*m})` }),
        m => ({ head: `scaleY(${1+0.32*m}) scaleX(${1-0.06*m})`, eyes: `scaleX(${1+0.2*m})`, mouth: `scaleY(${1+0.5*m})` })
      ]
    },

    brian: {
      name: '布莱恩', bg: '#FFE66D', sound: 'whimper', face: '#F5F5F0',
      order: ['hair','head','snout','nose','eyes','mouth','extra'],
      features: {
        head: `<g class="feat feat-head" data-feat="head">
          <ellipse cx="100" cy="95" rx="55" ry="50" fill="#F5F5F0" ${stroke(4)}/>
        </g>`,
        hair: `<g class="feat feat-hair" data-feat="hair">
          <path d="M40 72 Q18 60 24 92 Q30 108 50 96 Z" fill="#F5F5F0" ${stroke(3.5)}/>
          <path d="M160 72 Q182 60 176 92 Q170 108 150 96 Z" fill="#F5F5F0" ${stroke(3.5)}/>
        </g>`,
        snout: `<g class="feat feat-snout" data-feat="snout">
          <ellipse cx="100" cy="138" rx="26" ry="22" fill="#F5F5F0" ${stroke(3.5)}/>
        </g>`,
        nose: `<g class="feat feat-nose" data-feat="nose">
          <ellipse cx="100" cy="130" rx="13" ry="10" fill="${OUT}"/>
          <ellipse cx="96" cy="127" rx="3" ry="2" fill="#444"/>
        </g>`,
        eyes: `<g class="feat feat-eyes" data-feat="eyes">
          <circle cx="80" cy="86" r="7" fill="#fff" ${stroke(3)}/>
          <circle cx="120" cy="86" r="7" fill="#fff" ${stroke(3)}/>
          <circle cx="80" cy="87" r="3.5" fill="${OUT}"/>
          <circle cx="120" cy="87" r="3.5" fill="${OUT}"/>
        </g>`,
        mouth: `<g class="feat feat-mouth" data-feat="mouth">
          <path d="M100 150 Q90 158 82 154" fill="none" ${stroke(3)}/>
          <path d="M100 150 Q110 158 118 154" fill="none" ${stroke(3)}/>
        </g>`,
        extra: `<g class="feat feat-extra" data-feat="extra">
          <rect x="68" y="158" width="64" height="12" rx="6" fill="#C0392B" ${stroke(3)}/>
          <circle cx="100" cy="164" r="6" fill="#F1C40F" ${stroke(2)}/>
        </g>`
      },
      expressions: [
        m => ({ nose: `scaleY(${1-0.65*m})`, snout: `scaleX(${1+0.08*m})` }),
        m => ({ nose: `scaleY(${1-0.5*m}) translateY(${4*m}px)`, snout: `scaleX(${1+0.12*m})`, eyes: `scaleY(${1+0.2*m})` }),
        m => ({ nose: `scaleX(${1+0.25*m}) scaleY(${1-0.45*m})`, hair: `rotate(${5*m}deg)` })
      ]
    }
  };

  const CHAR_KEYS = Object.keys(CHARS);
  const BG_COLORS = ['#FF6B6B','#4ECDC4','#5DADE2','#A8E6CF','#FF8B94','#C9B6F0','#6BCB77','#FFD93D','#FF8C42'];
  const ALL_FEATURES = ['hair','head','snout','eyes','nose','mouth','extra'];

  /* ============================================================
     三、游戏控制器
     ============================================================ */
  const $ = (s) => document.querySelector(s);
  const stage = $('#stage');
  const charWrap = $('#charWrap');
  const bgLayer = $('#bgLayer');
  const rippleLayer = $('#rippleLayer');
  const fusionTag = $('#fusionTag');
  const toast = $('#toast');
  const selector = $('#selector');

  const state = {
    current: 'homer',
    exprIdx: 0,
    fusion: null,        // {charA, charB, parts:{feat:{char,svg}}, order:[...]}
    bgIdx: 0,
    longPressTimer: null,
    longPressFired: false,
    holdPulseTimer: null
  };

  /* ---- 渲染单个角色 ---- */
  function buildCharSVG(key) {
    const c = CHARS[key];
    let inner = '';
    c.order.forEach(f => { if (c.features[f]) inner += c.features[f]; });
    return `<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" data-char="${key}">${inner}</svg>`;
  }

  /* ---- 渲染融合角色 ---- */
  function buildFusionSVG(charA, charB) {
    const a = CHARS[charA], b = CHARS[charB];
    // 收集所有出现过的特征
    const feats = new Set([...a.order, ...b.order]);
    // 每个特征随机取自 A 或 B（head 优先取 A 保证主体）
    const parts = {};
    const order = [];
    feats.forEach(f => {
      const useA = (f === 'head') ? Math.random() < 0.7 : Math.random() < 0.5;
      const src = (useA && a.features[f]) ? charA : (b.features[f] ? charB : charA);
      if (!CHARS[src].features[f]) return;
      parts[f] = { char: src, svg: CHARS[src].features[f] };
      order.push(f);
    });
    // 确保至少混合了两个角色
    const usedChars = new Set(Object.values(parts).map(p => p.char));
    if (usedChars.size < 2) {
      // 强制把一个特征换成另一角色
      const otherKey = charB;
      for (const f of Object.keys(parts)) {
        if (CHARS[otherKey].features[f]) { parts[f] = { char: otherKey, svg: CHARS[otherKey].features[f] }; break; }
      }
    }
    let inner = '';
    ALL_FEATURES.forEach(f => { if (parts[f]) inner += parts[f].svg; });
    return { svg: `<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" data-fusion="1">${inner}</svg>`, parts };
  }

  /* ---- 应用表情变换（普通 m=1 / 融合 m=2） ---- */
  function applyExpression(svgRoot, exprFn, m) {
    const transforms = exprFn(m);
    Object.keys(transforms).forEach(feat => {
      const el = svgRoot.querySelector('.feat-' + feat);
      if (el) el.style.transform = transforms[feat];
    });
  }
  function resetTransforms(svgRoot) {
    svgRoot.querySelectorAll('.feat').forEach(el => { el.style.transform = ''; el.classList.remove('held','dragging'); });
  }

  /* ---- 切换角色 ---- */
  function setCharacter(key) {
    state.current = key;
    state.fusion = null;
    state.exprIdx = 0;
    charWrap.className = '';
    void charWrap.offsetWidth;
    charWrap.innerHTML = buildCharSVG(key);
    charWrap.classList.add('entering', 'neutral');
    fusionTag.classList.add('hidden');
    charWrap.classList.remove('fusion');
    const c = CHARS[key];
    bgLayer.style.background = c.bg;
    document.querySelectorAll('.charBtn').forEach(b => b.classList.toggle('active', b.dataset.char === key));
    AudioEngine.sfx('pop');
  }

  /* ---- 触发普通扭曲（循环表情） ---- */
  function triggerDistortion() {
    if (state.fusion) { exitFusion(); return; }
    const c = CHARS[state.current];
    const svg = charWrap.querySelector('svg');
    if (!svg) return;
    state.exprIdx = (state.exprIdx + 1) % c.expressions.length;
    applyExpression(svg, c.expressions[state.exprIdx], 1);
    AudioEngine.sfx(c.sound);
    spawnRipple(0, 0, '#fff');
    // 1.6 秒后回弹
    clearTimeout(state._revertTimer);
    state._revertTimer = setTimeout(() => {
      const s = charWrap.querySelector('svg');
      if (s && !state.fusion) resetTransforms(s);
    }, 1600);
  }

  /* ---- 进入融合彩蛋模式 ---- */
  function enterFusion() {
    state.longPressFired = true;
    // 随机两个不同角色
    const pool = [...CHAR_KEYS];
    const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const b = pool[Math.floor(Math.random() * pool.length)];
    const built = buildFusionSVG(a, b);
    state.fusion = { charA: a, charB: b, parts: built.parts };
    charWrap.className = '';
    void charWrap.offsetWidth;
    charWrap.innerHTML = built.svg;
    charWrap.classList.add('fusion', 'entering');
    fusionTag.classList.remove('hidden');
    // 背景换色
    bgLayer.style.background = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
    // 全屏闪 + 涟漪
    const flash = document.createElement('div');
    flash.className = 'flash';
    rippleLayer.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
    spawnRipple(0, 0, '#fff');
    spawnRipple(-80, -40, '#ffd93d');
    spawnRipple(80, 40, '#fff');
    // 屏幕抖动
    const app = $('#app');
    app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake');
    showToast('🥚 ' + CHARS[a].name + ' × ' + CHARS[b].name + ' 融合！');
    AudioEngine.sfx('fusion');
    // 融合瞬间自动叠加两角色的加倍扭曲（表情更夸张）
    requestAnimationFrame(() => applyFusionDistortion(2));
  }

  /* ---- 融合模式扭曲：叠加两个原角色的扭曲，强度加倍，不回弹（保持夸张直到退出） ---- */
  function applyFusionDistortion(m) {
    if (!state.fusion) return;
    const { charA, charB, parts } = state.fusion;
    const svg = charWrap.querySelector('svg');
    if (!svg) return;
    const exprA = CHARS[charA].expressions[Math.floor(Math.random() * CHARS[charA].expressions.length)](m);
    const exprB = CHARS[charB].expressions[Math.floor(Math.random() * CHARS[charB].expressions.length)](m);
    // 对每个特征，应用其来源角色的表情变换（两角色扭曲叠加）
    Object.keys(parts).forEach(feat => {
      const el = svg.querySelector('.feat-' + feat);
      if (!el) return;
      const src = parts[feat].char;
      const t = (src === charA ? exprA[feat] : exprB[feat]) || '';
      el.style.transform = t;
    });
  }

  /* ---- 退出融合模式 ---- */
  function exitFusion() {
    state.fusion = null;
    charWrap.classList.remove('fusion');
    fusionTag.classList.add('hidden');
    setCharacter(state.current);
  }

  /* ---- 涟漪 ---- */
  function spawnRipple(dx, dy, color) {
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.setProperty('--rx', dx + 'px');
    r.style.setProperty('--ry', dy + 'px');
    if (color) r.style.borderColor = color;
    rippleLayer.appendChild(r);
    setTimeout(() => r.remove(), 850);
  }
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(state._toastTimer);
    state._toastTimer = setTimeout(() => toast.classList.add('hidden'), 1800);
  }

  /* ---- 背景轮换（每次扭曲时轻微换色） ---- */
  function cycleBg(base) {
    // 在角色主色基础上偶尔换鲜艳色
    if (Math.random() < 0.3) {
      bgLayer.style.background = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
    }
  }

  /* ============================================================
     四、交互处理：轻击 / 拖拽 / 长按
     ============================================================ */
  const DRAG_FEATS = ['eyes','nose','mouth','hair','extra','snout']; // 可拖动特征
  let pointer = null; // 当前交互状态

  function getSVGPoint(clientX, clientY, svg) {
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: clientX, y: clientY };
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  function hitTestFeature(clientX, clientY) {
    const svg = charWrap.querySelector('svg');
    if (!svg) return null;
    for (const feat of DRAG_FEATS) {
      const el = svg.querySelector('.feat-' + feat);
      if (!el) continue;
      const bbox = el.getBoundingClientRect();
      // 放大命中区方便手指
      const pad = 14;
      if (clientX >= bbox.left - pad && clientX <= bbox.right + pad &&
          clientY >= bbox.top - pad && clientY <= bbox.bottom + pad) {
        return { el, feat };
      }
    }
    return null;
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    AudioEngine.startBgm(); // 首次交互启动 BGM
    const cx = e.clientX, cy = e.clientY;
    state.longPressFired = false;
    const hit = hitTestFeature(cx, cy);
    pointer = {
      startX: cx, startY: cy,
      lastX: cx, lastY: cy,
      moved: false,
      dragging: false,
      featEl: hit ? hit.el : null,
      feat: hit ? hit.feat : null,
      dragStartPoint: null,
      svg: charWrap.querySelector('svg')
    };
    if (pointer.featEl) {
      const sp = getSVGPoint(cx, cy, pointer.svg);
      pointer.dragStartPoint = sp;
      // 记录该元素当前 transform 基础值（空）
      pointer.baseTransform = pointer.featEl.style.transform || '';
    }
    // 长按 3 秒触发融合（仅未在拖动且移动很少时）；融合态再长按 = 换一组新融合
    clearTimeout(state.longPressTimer);
    state.longPressTimer = setTimeout(() => {
      if (pointer && !pointer.dragging && !pointer.moved) {
        enterFusion();
      }
    }, 3000);
    // 长按脉冲反馈（1.5 秒后角色轻微抖动提示）
    clearTimeout(state.holdPulseTimer);
    state.holdPulseTimer = setTimeout(() => {
      if (pointer && !pointer.moved && !state.fusion) {
        charWrap.classList.add('fusion'); // 复用抖动样式作为提示
        setTimeout(() => { if (!state.fusion) charWrap.classList.remove('fusion'); }, 400);
      }
    }, 1500);
  }

  function onPointerMove(e) {
    if (!pointer) return;
    e.preventDefault();
    const cx = e.clientX, cy = e.clientY;
    const dx = cx - pointer.startX, dy = cy - pointer.startY;
    if (!pointer.moved && Math.hypot(dx, dy) > 10) {
      pointer.moved = true;
      // 取消长按（开始拖动则不触发融合）
      clearTimeout(state.longPressTimer);
      clearTimeout(state.holdPulseTimer);
      if (!state.fusion && pointer.featEl) {
        pointer.dragging = true;
        pointer.featEl.classList.add('dragging');
      }
    }
    if (pointer.dragging && pointer.featEl) {
      const sp = getSVGPoint(cx, cy, pointer.svg);
      const ox = sp.x - pointer.dragStartPoint.x;
      const oy = sp.y - pointer.dragStartPoint.y;
      // 用 translate 跟随手指，保留原 transform（如表情）
      pointer.featEl.style.transform = `translate(${ox}px, ${oy}px)`;
      pointer.lastX = cx; pointer.lastY = cy;
    }
  }

  function onPointerUp(e) {
    if (!pointer) return;
    clearTimeout(state.longPressTimer);
    clearTimeout(state.holdPulseTimer);
    // 仅清除“长按提示”用到的抖动样式；真正处于融合模式时保留
    if (!state.fusion) charWrap.classList.remove('fusion');
    const wasDragging = pointer.dragging;
    const moved = pointer.moved;
    const dur = (e.timeStamp || Date.now()) - (pointer.downTime || Date.now());

    if (wasDragging && pointer.featEl) {
      // 松手回弹
      pointer.featEl.classList.remove('dragging');
      pointer.featEl.style.transform = ''; // 回弹到中性
      AudioEngine.sfx('pop');
      spawnRipple(0, 0, '#fff');
    } else if (!state.longPressFired) {
      // 短按 = 轻击扭曲 / 退出融合
      if (state.fusion) {
        // 融合态再次轻击 = 退出融合（按屏幕说明“再点一下退出”）
        exitFusion();
      } else if (!moved) {
        triggerDistortion();
        cycleBg();
      }
    }
    pointer = null;
  }

  // 统一指针事件（鼠标 + 触摸 + 笔）
  stage.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  window.addEventListener('pointercancel', onPointerUp, { passive: false });
  // 阻止移动端默认滚动/缩放
  stage.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  stage.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());

  /* ============================================================
     五、UI 构建
     ============================================================ */
  function buildSelector() {
    selector.innerHTML = '';
    CHAR_KEYS.forEach(key => {
      const c = CHARS[key];
      const btn = document.createElement('button');
      btn.className = 'charBtn' + (key === state.current ? ' active' : '');
      btn.dataset.char = key;
      btn.setAttribute('aria-label', c.name);
      btn.innerHTML = `<div class="dot" style="background:${c.bg}"></div>`;
      btn.title = c.name;
      btn.addEventListener('click', () => setCharacter(key));
      selector.appendChild(btn);
    });
  }

  /* ---- 控制按钮 ---- */
  const bgmBtn = $('#bgmBtn'), muteBtn = $('#muteBtn');
  bgmBtn.addEventListener('click', () => {
    AudioEngine.resume();
    const on = AudioEngine.toggleBgm();
    bgmBtn.classList.toggle('off', !on);
    bgmBtn.textContent = on ? '🎵' : '🔇';
    if (on && !AudioEngine.bgmTimer) AudioEngine.startBgm();
  });
  muteBtn.addEventListener('click', () => {
    AudioEngine.resume();
    const m = AudioEngine.toggleMute();
    muteBtn.classList.toggle('off', m);
    muteBtn.textContent = m ? '🔇' : '🔊';
  });

  /* ---- 初始化 ---- */
  buildSelector();
  setCharacter('homer');
  // 浏览器要求用户手势后才能播放音频，首次交互会启动 BGM
  window.addEventListener('pointerdown', () => AudioEngine.startBgm(), { once: true });
})();
