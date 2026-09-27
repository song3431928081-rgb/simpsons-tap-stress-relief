/* ============================================================
   Simpsons Spoof · 减压踢踏（Canvas 版）
   - 轻击扭曲特征 / 长按 3 秒 GLITCH MODE / 上传图片
   - 全部音频用 Web Audio API 合成，无外部资源
   ============================================================ */
(() => {
  'use strict';

  /* ============================================================
     一、音频引擎
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
      ({ boing: () => this._boing(t), whimper: () => this._whimper(t),
         stretch: () => this._stretch(t), chin: () => this._chin(t),
         fusion: () => this._fusion(t), pop: () => this._pop(t) }[type] || (() => {}))();
    },
    _stretch(t) {
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.25);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.55);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.28, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t); osc.stop(t + 0.65);
    },
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
    _chin(t) {
      const o1 = this.ctx.createOscillator(), g1 = this.ctx.createGain();
      o1.type = 'sine'; o1.frequency.setValueAtTime(150, t);
      o1.frequency.exponentialRampToValueAtTime(55, t + 0.18);
      g1.gain.setValueAtTime(0, t); g1.gain.linearRampToValueAtTime(0.4, t + 0.02);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o1.connect(g1); g1.connect(this.sfxGain);
      o1.start(t); o1.stop(t + 0.35);
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
    startBgm() {
      this.resume();
      if (!this.ctx || this.bgmTimer) return;
      if (this.bgmOn) this.bgmGain.gain.linearRampToValueAtTime(0.16, this.ctx.currentTime + 1.2);
      this.bgmStep = 0;
      const tempo = 88, stepDur = 60 / tempo / 2;
      const chords = [[0,4,7],[9,12,16],[5,9,12],[7,11,14]];
      const root = 130.81;
      const semi = s => root * Math.pow(2, s/12);
      const tick = () => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const bar = Math.floor(this.bgmStep / 16) % 4;
        const beat = this.bgmStep % 16;
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
        if (beat % 4 === 0) {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(115, t);
          o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
          g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          o.connect(g); g.connect(this.bgmGain);
          o.start(t); o.stop(t + 0.2);
        }
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
     二、角色绘制（Canvas 2D）
     每个角色：{ name, bg, sound, features:[{id,label,hitbox,x,y,w,h}], draw(ctx,w,h,dist) }
     dist: { featId: 0~1 } 扭曲强度
     ============================================================ */
  const SKIN = '#FCD936', SKIN_DK = '#E8B918', OUT = '#1a1a1a';

  // 画甜甜圈（可缩放旋转）
  function drawDonut(ctx, cx, cy, r, scaleX, scaleY, rot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot || 0);
    ctx.scale(scaleX || 1, scaleY || 1);
    // 外圆（粉色糖霜）
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FF7EB3';
    ctx.fill();
    ctx.lineWidth = r * 0.12;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    // 内孔
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = r * 0.1;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    // 糖屑
    const colors = ['#fff', '#FFD400', '#7CFC00', '#00BFFF', '#FF4500'];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rr = r * 0.62;
      ctx.save();
      ctx.translate(Math.cos(a) * rr, Math.sin(a) * rr);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(-r * 0.06, -r * 0.02, r * 0.12, r * 0.04);
      ctx.restore();
    }
    ctx.restore();
  }

  // Homer 辛普森（吃甜甜圈）
  function drawHomer(ctx, W, H, dist) {
    const d = (id, def) => (dist[id] != null ? dist[id] : def || 0);
    const donutS = 1 + d('donut', 0) * 1.6;
    const bellyS = 1 + d('belly', 0) * 0.5;
    const mouthS = 1 + d('mouth', 0) * 0.8;
    const headTilt = d('head', 0) * 0.15;

    // 背景云
    ctx.fillStyle = '#B8E0F5';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W * 0.5, H * 0.62);
    ctx.rotate(headTilt);

    // 腿
    ctx.fillStyle = SKIN;
    ctx.strokeStyle = OUT; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(-W*0.06, H*0.22, W*0.05, H*0.05, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.06, H*0.22, W*0.05, H*0.05, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // 鞋
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.ellipse(-W*0.06, H*0.26, W*0.06, H*0.03, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.06, H*0.26, W*0.06, H*0.03, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 蓝裤
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.moveTo(-W*0.14, H*0.05);
    ctx.lineTo(W*0.14, H*0.05);
    ctx.lineTo(W*0.12, H*0.2);
    ctx.lineTo(-W*0.12, H*0.2);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 白衫 + 大肚子
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, -H*0.02, W*0.22 * bellyS, H*0.16 * bellyS, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // 手臂
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.ellipse(-W*0.22, -H*0.02, W*0.05, H*0.12, -0.3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.22, -H*0.02, W*0.05, H*0.12, 0.3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // 手
    ctx.beginPath(); ctx.arc(-W*0.24, H*0.06, W*0.04, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(W*0.24, H*0.06, W*0.04, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 脖子
    ctx.fillStyle = SKIN;
    ctx.fillRect(-W*0.05, -H*0.14, W*0.1, H*0.06);
    ctx.strokeRect(-W*0.05, -H*0.14, W*0.1, H*0.06);

    // 头
    ctx.beginPath();
    ctx.ellipse(0, -H*0.2, W*0.18, H*0.18, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // 头顶秃
    ctx.beginPath();
    ctx.ellipse(0, -H*0.3, W*0.1, H*0.06, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // 耳朵
    ctx.beginPath(); ctx.arc(-W*0.17, -H*0.2, W*0.025, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(W*0.17, -H*0.2, W*0.025, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-W*0.06, -H*0.22, W*0.05, H*0.055, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.06, -H*0.22, W*0.05, H*0.055, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.arc(-W*0.06, -H*0.22, W*0.015, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.06, -H*0.22, W*0.015, 0, Math.PI*2); ctx.fill();

    // 鼻子
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.ellipse(0, -H*0.16, W*0.04, H*0.025, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // 嘴 + 牙
    ctx.save();
    ctx.translate(0, -H*0.12);
    ctx.scale(mouthS, mouthS);
    ctx.fillStyle = '#8B2500';
    ctx.beginPath();
    ctx.ellipse(0, 0, W*0.06, H*0.04, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-W*0.055, -H*0.04, W*0.11, H*0.02);
    ctx.strokeRect(-W*0.055, -H*0.04, W*0.11, H*0.02);
    ctx.restore();

    // 甜甜圈（拿在右手边嘴边）
    drawDonut(ctx, -W*0.13, -H*0.1, W*0.065 * donutS, donutS, donutS, -0.4);

    ctx.restore();
  }

  // Marge
  function drawMarge(ctx, W, H, dist) {
    const d = (id, def) => (dist[id] != null ? dist[id] : def || 0);
    const hairBend = d('hair', 0) * 0.5;
    const headTilt = d('head', 0) * 0.1;

    ctx.fillStyle = '#FFE4F1';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W*0.5, H*0.6);
    ctx.rotate(headTilt);

    // 脖子
    ctx.fillStyle = SKIN; ctx.strokeStyle = OUT; ctx.lineWidth = 4;
    ctx.fillRect(-W*0.04, -H*0.08, W*0.08, H*0.06);
    ctx.strokeRect(-W*0.04, -H*0.08, W*0.08, H*0.06);

    // 绿裙
    ctx.fillStyle = '#16A085';
    ctx.beginPath();
    ctx.moveTo(-W*0.2, H*0.0);
    ctx.lineTo(W*0.2, H*0.0);
    ctx.lineTo(W*0.16, H*0.22);
    ctx.lineTo(-W*0.16, H*0.22);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 头
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.ellipse(0, -H*0.18, W*0.16, H*0.16, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // 蓝色高卷发
    ctx.save();
    ctx.rotate(hairBend);
    ctx.fillStyle = '#3D8FE0';
    ctx.beginPath();
    ctx.moveTo(-W*0.16, -H*0.26);
    ctx.bezierCurveTo(-W*0.2, -H*0.55, -W*0.05, -H*0.6, 0, -H*0.55);
    ctx.bezierCurveTo(W*0.05, -H*0.6, W*0.2, -H*0.55, W*0.16, -H*0.26);
    ctx.bezierCurveTo(W*0.1, -H*0.32, -W*0.1, -H*0.32, -W*0.16, -H*0.26);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-W*0.05, -H*0.2, W*0.035, H*0.04, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.05, -H*0.2, W*0.035, H*0.04, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.arc(-W*0.05, -H*0.19, W*0.012, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.05, -H*0.19, W*0.012, 0, Math.PI*2); ctx.fill();

    // 鼻子
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(0, -H*0.14, W*0.02, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 嘴
    ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.arc(0, -H*0.1, W*0.025, 0, Math.PI); ctx.stroke();

    // 珍珠项链
    ctx.fillStyle = '#fff';
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(i * W*0.025, -H*0.04, W*0.012, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
    }

    ctx.restore();
  }

  // Bart
  function drawBart(ctx, W, H, dist) {
    const d = (id, def) => (dist[id] != null ? dist[id] : def || 0);
    const hairShake = d('hair', 0);
    const mouthS = 1 + d('mouth', 0) * 0.8;

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W*0.5, H*0.62);

    // 腿
    ctx.fillStyle = SKIN; ctx.strokeStyle = OUT; ctx.lineWidth = 4;
    ctx.fillRect(-W*0.06, H*0.06, W*0.04, H*0.1); ctx.strokeRect(-W*0.06, H*0.06, W*0.04, H*0.1);
    ctx.fillRect(W*0.02, H*0.06, W*0.04, H*0.1); ctx.strokeRect(W*0.02, H*0.06, W*0.04, H*0.1);
    // 鞋
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.ellipse(-W*0.04, H*0.16, W*0.04, H*0.025, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.04, H*0.16, W*0.04, H*0.025, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 蓝短裤
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.moveTo(-W*0.1, -H*0.02);
    ctx.lineTo(W*0.1, -H*0.02);
    ctx.lineTo(W*0.08, H*0.06);
    ctx.lineTo(-W*0.08, H*0.06);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 橙T恤
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.moveTo(-W*0.12, -H*0.1);
    ctx.lineTo(W*0.12, -H*0.1);
    ctx.lineTo(W*0.1, -H*0.02);
    ctx.lineTo(-W*0.1, -H*0.02);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 手臂
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.ellipse(-W*0.14, -H*0.06, W*0.03, H*0.06, -0.2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.14, -H*0.06, W*0.03, H*0.06, 0.2, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 头
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.ellipse(0, -H*0.18, W*0.14, H*0.14, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // 锯齿头
    ctx.save();
    ctx.translate(0, -H*0.28);
    const spikes = 9;
    ctx.beginPath();
    ctx.moveTo(-W*0.14, 0);
    for (let i = 0; i < spikes; i++) {
      const x1 = -W*0.14 + (i + 0.5) * (W*0.28/spikes);
      const x2 = -W*0.14 + (i + 1) * (W*0.28/spikes);
      const yOff = hairShake * Math.sin(i + Date.now()*0.02) * 4;
      ctx.lineTo(x1, -H*0.06 + yOff);
      ctx.lineTo(x2, 0);
    }
    ctx.fillStyle = SKIN;
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-W*0.04, -H*0.2, W*0.03, H*0.035, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.04, -H*0.2, W*0.03, H*0.035, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.arc(-W*0.04, -H*0.19, W*0.01, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.04, -H*0.19, W*0.01, 0, Math.PI*2); ctx.fill();

    // 鼻子
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(0, -H*0.15, W*0.018, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 嘴（大笑）
    ctx.save();
    ctx.translate(0, -H*0.11);
    ctx.scale(mouthS, mouthS);
    ctx.fillStyle = '#8B2500';
    ctx.beginPath(); ctx.ellipse(0, 0, W*0.04, H*0.025, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // Lisa
  function drawLisa(ctx, W, H, dist) {
    const d = (id, def) => (dist[id] != null ? dist[id] : def || 0);
    const hairGrow = d('hair', 0);
    const saxSpin = d('sax', 0);

    ctx.fillStyle = '#FFE4B5';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W*0.5, H*0.6);

    // 腿
    ctx.fillStyle = SKIN; ctx.strokeStyle = OUT; ctx.lineWidth = 4;
    ctx.fillRect(-W*0.05, H*0.04, W*0.035, H*0.1); ctx.strokeRect(-W*0.05, H*0.04, W*0.035, H*0.1);
    ctx.fillRect(W*0.015, H*0.04, W*0.035, H*0.1); ctx.strokeRect(W*0.015, H*0.04, W*0.035, H*0.1);
    // 玛丽珍鞋
    ctx.fillStyle = '#C0392B';
    ctx.beginPath(); ctx.ellipse(-W*0.03, H*0.14, W*0.035, H*0.02, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.03, H*0.14, W*0.035, H*0.02, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 红裙
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.moveTo(-W*0.12, -H*0.04);
    ctx.lineTo(W*0.12, -H*0.04);
    ctx.lineTo(W*0.15, H*0.08);
    ctx.lineTo(-W*0.15, H*0.08);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 手臂
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.ellipse(-W*0.13, -H*0.02, W*0.025, H*0.05, -0.3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.13, -H*0.02, W*0.025, H*0.05, 0.3, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 头
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.ellipse(0, -H*0.16, W*0.13, H*0.13, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // 星形头发
    ctx.save();
    ctx.translate(0, -H*0.26);
    ctx.rotate(saxSpin * 0.5);
    ctx.fillStyle = SKIN;
    const starR = W * (0.08 + hairGrow * 0.04);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI/2;
      const r = i % 2 === 0 ? starR : starR * 0.5;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-W*0.035, -H*0.17, W*0.025, H*0.03, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W*0.035, -H*0.17, W*0.025, H*0.03, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.arc(-W*0.035, -H*0.16, W*0.008, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.035, -H*0.16, W*0.008, 0, Math.PI*2); ctx.fill();

    // 鼻子
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(0, -H*0.12, W*0.015, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 嘴
    ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.arc(0, -H*0.09, W*0.02, 0, Math.PI); ctx.stroke();

    // 萨克斯
    ctx.save();
    ctx.translate(W*0.08, -H*0.08);
    ctx.rotate(saxSpin * 2);
    ctx.fillStyle = '#F1C40F';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(W*0.1, H*0.02, W*0.12, H*0.12, W*0.04, H*0.14);
    ctx.bezierCurveTo(-W*0.04, H*0.16, -W*0.02, H*0.04, 0, 0);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // 角色定义
  const CHARS = [
    { name: 'Homer', bg: '#87CEEB', sound: 'boing',
      features: [
        { id: 'donut', label: '甜甜圈', x: 0.37, y: 0.5, w: 0.16, h: 0.14 },
        { id: 'belly', label: '肚子', x: 0.5, y: 0.6, w: 0.3, h: 0.2 },
        { id: 'mouth', label: '嘴', x: 0.5, y: 0.48, w: 0.1, h: 0.06 },
        { id: 'head', label: '头', x: 0.5, y: 0.42, w: 0.3, h: 0.2 }
      ],
      draw: drawHomer },
    { name: 'Marge', bg: '#FFE4F1', sound: 'boing',
      features: [
        { id: 'hair', label: '头发', x: 0.5, y: 0.2, w: 0.35, h: 0.35 },
        { id: 'head', label: '头', x: 0.5, y: 0.42, w: 0.28, h: 0.28 },
        { id: 'mouth', label: '嘴', x: 0.5, y: 0.5, w: 0.06, h: 0.04 }
      ],
      draw: drawMarge },
    { name: 'Bart', bg: '#87CEEB', sound: 'stretch',
      features: [
        { id: 'hair', label: '头发', x: 0.5, y: 0.3, w: 0.3, h: 0.15 },
        { id: 'mouth', label: '嘴', x: 0.5, y: 0.5, w: 0.08, h: 0.05 },
        { id: 'head', label: '头', x: 0.5, y: 0.42, w: 0.26, h: 0.26 }
      ],
      draw: drawBart },
    { name: 'Lisa', bg: '#FFE4B5', sound: 'whimper',
      features: [
        { id: 'hair', label: '星发', x: 0.5, y: 0.3, w: 0.2, h: 0.2 },
        { id: 'sax', label: '萨克斯', x: 0.6, y: 0.5, w: 0.15, h: 0.15 },
        { id: 'head', label: '头', x: 0.5, y: 0.44, w: 0.24, h: 0.24 }
      ],
      draw: drawLisa }
  ];

  /* ============================================================
     三、游戏状态与渲染
     ============================================================ */
  const canvas = document.getElementById('charCanvas');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const bgLayer = document.getElementById('bgLayer');
  const holdHint = document.getElementById('holdHint');
  const glitchTitle = document.getElementById('glitchTitle');
  const glitchOverlay = document.getElementById('glitchOverlay');
  const actionBar = document.getElementById('actionBar');
  const exitBtn = document.getElementById('exitGlitchBtn');
  const toast = document.getElementById('toast');

  const state = {
    charIdx: 0,
    customImg: null,       // 用户上传的图片
    dist: {},              // 当前扭曲 {featId: 0~1}
    distTimers: {},        // 回弹定时器
    glitch: false,
    glitchTime: 0,
    longPressTimer: null,
    holdFired: false,
    pointer: null,
    rafId: null
  };

  function resizeCanvas() {
    const r = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }
  window.addEventListener('resize', resizeCanvas);

  // 渲染主循环
  function render() {
    const W = parseFloat(canvas.style.width);
    const H = parseFloat(canvas.style.height);
    ctx.clearRect(0, 0, W, H);

    if (state.glitch) {
      renderGlitch(W, H);
    } else {
      renderNormal(W, H);
    }
  }

  function renderNormal(W, H) {
    const char = CHARS[state.charIdx];
    if (state.customImg) {
      // 上传图片模式：居中绘制，保留比例
      const img = state.customImg;
      const ir = img.width / img.height;
      const sr = W / H;
      let dw, dh;
      if (ir > sr) { dw = W; dh = W / ir; } else { dh = H; dw = H * ir; }
      ctx.drawImage(img, (W - dw)/2, (H - dh)/2, dw, dh);
    } else {
      char.draw(ctx, W, H, state.dist);
    }
  }

  // GLITCH 渲染：把正常画面先画到离屏，再做 RGB 分离 + 切片 + 旋转
  const offscreen = document.createElement('canvas');
  const offCtx = offscreen.getContext('2d');
  function renderGlitch(W, H) {
    state.glitchTime += 0.016;
    offscreen.width = W; offscreen.height = H;
    offCtx.clearRect(0, 0, W, H);

    const char = CHARS[state.charIdx];
    if (state.customImg) {
      const img = state.customImg;
      const ir = img.width / img.height;
      const sr = W / H;
      let dw, dh;
      if (ir > sr) { dw = W; dh = W / ir; } else { dh = H; dw = H * ir; }
      offCtx.drawImage(img, (W - dw)/2, (H - dh)/2, dw, dh);
    } else {
      char.draw(offCtx, W, H, state.dist);
    }

    // 整体旋转 + 脉动缩放
    const rot = Math.sin(state.glitchTime * 3) * 0.15;
    const sc = 1 + Math.sin(state.glitchTime * 8) * 0.08;
    ctx.save();
    ctx.translate(W/2, H/2);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    ctx.translate(-W/2, -H/2);

    // RGB 分离绘制
    const slices = 16;
    const sliceH = H / slices;
    for (let i = 0; i < slices; i++) {
      const sy = i * sliceH;
      const offset = (Math.random() - 0.5) * 30 * (Math.random() < 0.4 ? 1 : 0.1);
      // R 通道偏左
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.8;
      ctx.drawImage(offscreen, 0, sy, W, sliceH, offset, sy, W, sliceH);
      // 用红绿蓝分别 tint
      drawChannel(offscreen, 0, sy, W, sliceH, offset - 6, sy, '255,0,0');
      drawChannel(offscreen, 0, sy, W, sliceH, offset + 6, sy, '0,255,255');
      drawChannel(offscreen, 0, sy, W, sliceH, offset, sy, '0,255,0');
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // 像素块：随机方块色彩反转
    for (let i = 0; i < 8; i++) {
      const bx = Math.random() * W;
      const by = Math.random() * H;
      const bw = 20 + Math.random() * 80;
      const bh = 4 + Math.random() * 12;
      ctx.fillStyle = `hsl(${Math.random()*360},100%,60%)`;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(bx, by, bw, bh);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // 边缘暗角
    const grad = ctx.createRadialGradient(W/2, H/2, W*0.2, W/2, H/2, W*0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // 用一个单色版本绘制某通道（模拟 RGB 分离）
  function drawChannel(src, sx, sy, sw, sh, dx, dy, rgb) {
    const c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    const cc = c.getContext('2d');
    cc.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
    const img = cc.getImageData(0, 0, sw, sh);
    const [r, g, b] = rgb.split(',').map(Number);
    for (let i = 0; i < img.data.length; i += 4) {
      const gray = (img.data[i] + img.data[i+1] + img.data[i+2]) / 3;
      img.data[i] = r > 0 ? gray : 0;
      img.data[i+1] = g > 0 ? gray : 0;
      img.data[i+2] = b > 0 ? gray : 0;
    }
    cc.putImageData(img, 0, 0);
    ctx.drawImage(c, dx, dy);
  }

  // 动画循环（GLITCH 模式持续重绘）
  function loop() {
    if (state.glitch) render();
    state.rafId = requestAnimationFrame(loop);
  }

  /* ============================================================
     四、交互
     ============================================================ */
  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function hitFeature(px, py) {
    if (state.customImg) return null; // 上传图片模式无特征
    const char = CHARS[state.charIdx];
    let best = null, bestDist = Infinity;
    char.features.forEach(f => {
      const dx = px - f.x, dy = py - f.y;
      const d = Math.hypot(dx, dy);
      // 命中区域放大
      if (d < Math.max(f.w, f.h) * 0.8 && d < bestDist) { best = f; bestDist = d; }
    });
    return best;
  }

  function triggerFeature(feat) {
    if (!feat) {
      // 点击空白：轻微整体扭曲
      const char = CHARS[state.charIdx];
      if (char.features.length) feat = char.features[0];
      else return;
    }
    state.dist[feat.id] = 1;
    clearTimeout(state.distTimers[feat.id]);
    state.distTimers[feat.id] = setTimeout(() => {
      // 弹性回弹
      const start = performance.now();
      const from = state.dist[feat.id] || 0;
      const dur = 400;
      function step(now) {
        const t = Math.min(1, (now - start) / dur);
        const ease = 1 - Math.pow(1 - t, 3);
        state.dist[feat.id] = from * (1 - ease);
        if (!state.glitch) render();
        if (t < 1) requestAnimationFrame(step);
        else state.dist[feat.id] = 0;
      }
      requestAnimationFrame(step);
    }, 1200);
    AudioEngine.sfx(CHARS[state.charIdx].sound);
    if (!state.glitch) render();
  }

  function onPointerDown(e) {
    e.preventDefault();
    AudioEngine.startBgm();
    state.holdFired = false;
    state.pointer = { x: e.clientX, y: e.clientY, moved: false };
    clearTimeout(state.longPressTimer);
    state.longPressTimer = setTimeout(() => {
      if (state.pointer && !state.pointer.moved) {
        enterGlitch();
        state.holdFired = true;
      }
    }, 3000);
  }

  function onPointerMove(e) {
    if (!state.pointer) return;
    if (Math.hypot(e.clientX - state.pointer.x, e.clientY - state.pointer.y) > 10) {
      state.pointer.moved = true;
      clearTimeout(state.longPressTimer);
    }
  }

  function onPointerUp(e) {
    if (!state.pointer) return;
    clearTimeout(state.longPressTimer);
    const moved = state.pointer.moved;
    state.pointer = null;
    if (state.holdFired) return;
    if (moved) return;
    if (state.glitch) {
      // GLITCH 模式点击画布 = 继续 glitch 效果（不退出，退出用按钮）
      AudioEngine.sfx('fusion');
      return;
    }
    // 普通模式：轻击扭曲最近特征
    const p = canvasPoint(e);
    const feat = hitFeature(p.x, p.y);
    triggerFeature(feat);
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

  /* ============================================================
     五、GLITCH 模式
     ============================================================ */
  function enterGlitch() {
    state.glitch = true;
    state.glitchTime = 0;
    glitchTitle.classList.remove('hidden');
    glitchOverlay.classList.remove('hidden');
    holdHint.classList.add('hidden');
    actionBar.classList.add('glitch');
    bgLayer.style.background = '#1a1a1a';
    // 随机扭曲所有特征
    const char = CHARS[state.charIdx];
    char.features.forEach(f => { state.dist[f.id] = Math.random(); });
    AudioEngine.sfx('fusion');
    const app = document.getElementById('app');
    app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake');
    showToast('🎮 GLITCH MODE!');
    render();
  }

  function exitGlitch() {
    state.glitch = false;
    glitchTitle.classList.add('hidden');
    glitchOverlay.classList.add('hidden');
    holdHint.classList.remove('hidden');
    actionBar.classList.remove('glitch');
    bgLayer.style.background = CHARS[state.charIdx].bg;
    state.dist = {};
    render();
  }

  exitBtn.addEventListener('click', () => { AudioEngine.sfx('pop'); exitGlitch(); });

  /* ============================================================
     六、角色切换 + 上传
     ============================================================ */
  function setChar(idx) {
    state.charIdx = (idx + CHARS.length) % CHARS.length;
    state.customImg = null;
    state.dist = {};
    if (state.glitch) exitGlitch();
    bgLayer.style.background = CHARS[state.charIdx].bg;
    render();
    AudioEngine.sfx('pop');
  }

  document.getElementById('nextCharBtn').addEventListener('click', () => {
    setChar(state.charIdx + 1);
  });

  // UPLOAD
  const fileInput = document.getElementById('fileInput');
  document.getElementById('uploadBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        state.customImg = img;
        state.dist = {};
        if (state.glitch) exitGlitch();
        bgLayer.style.background = '#1a1a1a';
        showToast('📷 图片已加载 · 长按 3s 可 GLITCH');
        render();
        AudioEngine.sfx('pop');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });

  /* ============================================================
     七、UI 辅助
     ============================================================ */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(state._toastTimer);
    state._toastTimer = setTimeout(() => toast.classList.add('hidden'), 1800);
  }

  // 音频按钮
  document.getElementById('bgmBtn').addEventListener('click', () => {
    AudioEngine.resume();
    const on = AudioEngine.toggleBgm();
    const b = document.getElementById('bgmBtn');
    b.classList.toggle('off', !on);
    b.textContent = on ? '🎵' : '🔇';
    if (on && !AudioEngine.bgmTimer) AudioEngine.startBgm();
  });
  document.getElementById('muteBtn').addEventListener('click', () => {
    AudioEngine.resume();
    const m = AudioEngine.toggleMute();
    const b = document.getElementById('muteBtn');
    b.classList.toggle('off', m);
    b.textContent = m ? '🔇' : '🔊';
  });

  /* ============================================================
     八、初始化
     ============================================================ */
  bgLayer.style.background = CHARS[0].bg;
  resizeCanvas();
  loop();
  window.addEventListener('pointerdown', () => AudioEngine.startBgm(), { once: true });
})();
