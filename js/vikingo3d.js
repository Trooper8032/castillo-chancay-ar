/* Vikingo guía 3D – RIVERGREEN SOLUTIONS
   Modelo: "Barbarian" de KayKit Adventurers (Kay Lousberg, CC0) + casco "Viking Helmet" (Michael Fuchs, CC-BY 3.0, vía Poly Pizza).
   Requiere A-Frame 1.4.2 + aframe-extras 7.2.0 (animation-mixer). */

const BASE_VIKINGO = window.BASE_VIKINGO || '';
const MODELO_VIKINGO = BASE_VIKINGO + 'modelos/vikingo.glb';
const MODELO_CASCO = BASE_VIKINGO + 'modelos/casco-vikingo.glb';
const FONDO_ENV = BASE_VIKINGO + 'assets/fondos/playa-amanecer-env.jpg';

/* ---------- Iluminación de juego: tone mapping + mapa de entorno PBR ---------- */
AFRAME.registerComponent('entorno-juego', {
  schema: { env: { default: FONDO_ENV }, exposicion: { default: 0.95 } },
  init() {
    const r = this.el.renderer;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = this.data.exposicion;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const pmrem = new THREE.PMREMGenerator(r);
    new THREE.TextureLoader().load(this.data.env, tex => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.encoding = THREE.sRGBEncoding;
      this.el.object3D.environment = pmrem.fromEquirectangular(tex).texture;
      tex.dispose(); pmrem.dispose();
    });
  }
});

/* ---------- Modelo del vikingo: limpieza, casco, sombras y animaciones ---------- */
AFRAME.registerComponent('vikingo', {
  schema: { casco: { default: true } },
  init() {
    this.listo = false;
    this.el.setAttribute('gltf-model', MODELO_VIKINGO);
    this.el.addEventListener('model-loaded', () => this.preparar());
    this.el.addEventListener('animation-finished', () => { if (this.tras) { const t = this.tras; this.tras = null; t(); } });
  },
  preparar() {
    const m = this.el.getObject3D('mesh');
    const ocultar = ['Mug', '2H_Axe', '1H_Axe_Offhand'].concat(this.data.casco ? ['Barbarian_Hat'] : []);
    m.traverse(o => {
      if (ocultar.includes(o.name)) o.visible = false;
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(mt => { mt.envMapIntensity = 0.55; });
      }
    });
    if (this.data.casco) this.ponerCasco(m);
    this.listo = true;
    this.idle();
    this.el.emit('vikingo-listo');
  },
  ponerCasco(m) {
    let cabeza; m.traverse(o => { if (o.isBone && o.name === 'head') cabeza = o; });
    if (!cabeza) return;
    new THREE.GLTFLoader().load(MODELO_CASCO, g => {
      const casco = g.scene;
      casco.traverse(o => { if (o.isMesh) { o.castShadow = true; o.material.envMapIntensity = 1.2; o.material.metalness = Math.max(o.material.metalness || 0, 0.55); o.material.roughness = 0.38; } });
      // Posición objetivo en el espacio del modelo (cabeza del KayKit en pose de reposo)
      const s = 0.0195;
      const objetivo = new THREE.Matrix4().compose(new THREE.Vector3(0, 2.2, 0.0), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
      m.updateMatrixWorld(true);
      const raizInv = m.matrixWorld.clone().invert();
      const cabezaEnRaiz = raizInv.clone().multiply(cabeza.matrixWorld);
      const local = cabezaEnRaiz.invert().multiply(objetivo);
      local.decompose(casco.position, casco.quaternion, casco.scale);
      cabeza.add(casco);
      this.el.emit('casco-listo');
    });
  },
  clip(nombre, opciones = {}) {
    this.el.setAttribute('animation-mixer', Object.assign({ clip: nombre, loop: 'repeat', crossFadeDuration: 0.35, clampWhenFinished: false, timeScale: 1 }, opciones));
  },
  idle() { this.tras = null; this.clip('Idle'); },
  saludar() { this.clip('Cheer', { loop: 'once', clampWhenFinished: true }); this.tras = () => this.idle(); },
  // Al hablar: Idle más vivo (el clip Interact tapa la cara con el hacha)
  hablar(si) { if (this.tras) return; this.clip('Idle', { timeScale: si ? 1.5 : 1 }); }
});

/* ---------- Efecto de aparición: anillo de luz + chispas + escala con rebote ---------- */
function texturaDestello() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,230,150,0.9)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
function texturaSombra() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
AFRAME.registerComponent('aparicion', {
  schema: { objetivo: { type: 'selector' }, escala: { default: 1 }, radio: { default: 1 } },
  init() {
    const R = this.data.radio;
    const grupo = this.grupo = new THREE.Group(); this.el.object3D.add(grupo);
    // sombra de contacto (blob) + plano que recibe la sombra real
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.6 * R, 1.6 * R), new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.005; this.el.object3D.add(blob); this.blob = blob; blob.visible = false;
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(4 * R, 4 * R), new THREE.ShadowMaterial({ opacity: 0.32 }));
    suelo.rotation.x = -Math.PI / 2; suelo.position.y = 0.01; suelo.receiveShadow = true; this.el.object3D.add(suelo);
    // anillo de energía
    const anillo = this.anillo = new THREE.Mesh(new THREE.RingGeometry(0.55 * R, 0.68 * R, 64),
      new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    anillo.rotation.x = -Math.PI / 2; anillo.position.y = 0.02; grupo.add(anillo);
    // columna de luz
    const col = this.columna = new THREE.Mesh(new THREE.CylinderGeometry(0.6 * R, 0.75 * R, 3 * R, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x8fe3ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    col.position.y = 1.5 * R; grupo.add(col);
    // chispas
    const N = 160, pos = new Float32Array(N * 3); this.vel = [];
    for (let i = 0; i < N; i++) this.vel.push({ a: Math.random() * Math.PI * 2, r: (0.2 + Math.random() * 0.6) * R, v: (0.6 + Math.random() * 1.6) * R, f: Math.random() });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.chispas = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09 * R, map: texturaDestello(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffc35a }));
    grupo.add(this.chispas);
    this.t = -1;
    if (this.data.objetivo) this.data.objetivo.object3D.scale.setScalar(0.0001);
    this.el.addEventListener('aparecer', () => this.aparecer());
  },
  aparecer() { this.t = 0; this.blob.visible = true; Sonidos.aparicion(); },
  tick(_, dt) {
    if (this.t < 0) return;
    this.t += dt / 1000; const t = this.t;
    // escala con rebote (easeOutBack)
    if (this.data.objetivo) {
      const k = Math.min(Math.max((t - 0.25) / 0.7, 0), 1), c1 = 1.9, c3 = c1 + 1;
      const e = k === 0 ? 0.0001 : 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
      this.data.objetivo.object3D.scale.setScalar(Math.max(e, 0.0001) * this.data.escala);
    }
    this.blob.material.opacity = Math.min(t / 0.8, 1);
    const ani = this.anillo; ani.material.opacity = t < 1.8 ? Math.sin(Math.min(t / 1.8, 1) * Math.PI) * 0.95 : 0;
    ani.scale.setScalar(0.6 + t * 0.9);
    this.columna.material.opacity = t < 1.4 ? Math.sin(Math.min(t / 1.4, 1) * Math.PI) * 0.35 : 0;
    this.columna.scale.set(1 - Math.min(t / 1.4, 1) * 0.6, 1, 1 - Math.min(t / 1.4, 1) * 0.6);
    const p = this.chispas.geometry.attributes.position;
    this.vel.forEach((s, i) => {
      const u = Math.max(t - s.f * 0.5, 0), a = s.a + u * 2.2;
      p.setXYZ(i, Math.cos(a) * s.r * (1 + u * 0.4), u * s.v, Math.sin(a) * s.r * (1 + u * 0.4));
    });
    p.needsUpdate = true;
    this.chispas.material.opacity = t < 3.4 ? Math.min(t * 3, 1) * (1 - t / 3.4) : 0;
    if (t > 3.6) { this.t = -1; this.grupo.visible = false; }
  }
});

/* ---------- Brillo de runas en la base (modo demo) ---------- */
AFRAME.registerComponent('pulso', {
  schema: { min: { default: 0.4 }, max: { default: 1.4 }, vel: { default: 1.6 } },
  tick(t) { const m = this.el.getObject3D('mesh'); if (m) m.material.emissiveIntensity = this.data.min + (this.data.max - this.data.min) * (0.5 + 0.5 * Math.sin(t / 1000 * this.data.vel * Math.PI)); }
});

/* ---------- Sonidos sintetizados en el navegador (propios, sin archivos de terceros) ---------- */
const Sonidos = {
  ctx: null,
  get mudo() { return localStorage.getItem('chancay-ar-mudo') === '1'; },
  set mudo(v) { localStorage.setItem('chancay-ar-mudo', v ? '1' : '0'); },
  desbloquear() { try { this.ctx = this.ctx || window.__audioCtx || new (window.AudioContext || window.webkitAudioContext)(); this.ctx.resume(); } catch (e) {} },
  tono(f, ini, dur, tipo = 'sine', vol = 0.12, fFin) {
    if (this.mudo || !this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime + ini;
    o.type = tipo; o.frequency.setValueAtTime(f, t); if (fFin) o.frequency.exponentialRampToValueAtTime(fFin, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  },
  aparicion() { this.tono(180, 0, 0.9, 'sawtooth', 0.04, 900); [523, 659, 784, 1047, 1319].forEach((f, i) => this.tono(f, 0.15 + i * 0.09, 0.7, 'triangle', 0.09)); this.tono(2093, 0.65, 1.2, 'sine', 0.05); },
  letra() { this.tono(420 + Math.random() * 120, 0, 0.05, 'square', 0.025); },
  click() { this.tono(660, 0, 0.08, 'triangle', 0.08); this.tono(990, 0.05, 0.1, 'triangle', 0.06); },
  exito() { [523, 659, 784, 1047].forEach((f, i) => this.tono(f, i * 0.1, 0.5, 'triangle', 0.1)); },
  error() { this.tono(220, 0, 0.25, 'sawtooth', 0.05, 140); }
};

/* ---------- Voz del navegador ---------- */
function hablarVikingo(texto, boton, alTerminar) {
  if (!('speechSynthesis' in window)) { alert('Tu navegador no tiene voz disponible.'); return; }
  const sy = window.speechSynthesis;
  if (sy.speaking) { sy.cancel(); if (boton) boton.innerHTML = '🔊 Escuchar'; alTerminar && alTerminar(); return; }
  const u = new SpeechSynthesisUtterance(texto);
  const voces = sy.getVoices(), pref = ['es-PE', 'es-419', 'es-US', 'es-MX', 'es-ES'];
  u.voice = pref.map(l => voces.find(v => v.lang.replace('_', '-') === l)).find(Boolean) || voces.find(v => v.lang.startsWith('es')) || null;
  u.lang = u.voice ? u.voice.lang : 'es-PE'; u.rate = 0.95; u.pitch = 0.7;
  if (boton) boton.innerHTML = '⏹ Detener';
  u.onend = u.onerror = () => { if (boton) boton.innerHTML = '🔊 Escuchar'; alTerminar && alTerminar(); };
  sy.speak(u);
}
if ('speechSynthesis' in window) speechSynthesis.getVoices();

/* ---------- Caja de diálogo estilo videojuego con efecto máquina de escribir ---------- */
class Dialogo {
  constructor(raiz, { paginas, alHablar, alFinal }) {
    this.raiz = raiz; this.paginas = paginas; this.i = 0; this.alHablar = alHablar; this.alFinal = alFinal;
    this.txt = raiz.querySelector('.dlg-texto'); this.sig = raiz.querySelector('.dlg-sig'); this.acc = raiz.querySelector('.dlg-acciones');
    raiz.querySelector('.dlg-caja').addEventListener('click', e => { if (e.target.closest('button')) return; this.avanzar(); });
  }
  mostrar() { this.raiz.classList.add('ver'); this.escribir(); }
  escribir() {
    const t = this.paginas[this.i]; this.escribiendo = true; this.txt.textContent = ''; this.sig.classList.add('oculto');
    this.acc.classList.toggle('oculto', this.i < this.paginas.length - 1);
    this.alHablar && this.alHablar(true);
    // Basado en tiempo (no en ticks): mismo ritmo en celulares lentos
    let k = 0; const t0 = performance.now(); clearInterval(this.iv);
    this.iv = setInterval(() => {
      const n = Math.min(t.length, Math.floor((performance.now() - t0) / 28));
      if (n > k) { k = n; this.txt.textContent = t.slice(0, k); if (t[k - 1] !== ' ') Sonidos.letra(); }
      if (k >= t.length) this.terminar();
    }, 30);
  }
  terminar() {
    clearInterval(this.iv); this.txt.textContent = this.paginas[this.i]; this.escribiendo = false;
    this.alHablar && this.alHablar(false);
    if (this.i < this.paginas.length - 1) this.sig.classList.remove('oculto'); else this.alFinal && this.alFinal();
  }
  avanzar() {
    if (this.escribiendo) return this.terminar();
    if (this.i < this.paginas.length - 1) { this.i++; Sonidos.click(); this.escribir(); }
  }
  textoCompleto() { return this.paginas.join(' '); }
}

Object.assign(window, { Sonidos, Dialogo, hablarVikingo });
