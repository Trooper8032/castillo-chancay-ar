// Textos y voz del vikingo para la portada (el modelo 3D está en js/vikingo3d.js).
const SALUDO_VIKINGO = '¡Bienvenido, visitante, al Castillo de Chancay! Soy tu guía en este recorrido. Busca los 4 puntos, escanea cada marcador y resuelve los acertijos. ¡Que empiece la aventura!';
const CAMEO_VIKINGO = {
  2: '¡Bien hecho, visitante! Estos muros tienen mucho que contar.',
  3: 'Shhh… dicen que estos pasadizos guardan secretos.',
  4: '¡Lo lograste! Mira qué vista tan bonita del Pacífico.'
};

// Voz del navegador (Web Speech API). Prefiere voces es-PE / es-419 / es-US / es-ES.
function hablarVikingo(texto, boton) {
  if (!('speechSynthesis' in window)) { alert('Tu navegador no tiene voz disponible.'); return; }
  const sy = window.speechSynthesis;
  if (sy.speaking) { sy.cancel(); if (boton) boton.textContent = '🔊 Escuchar al vikingo'; return; }
  const u = new SpeechSynthesisUtterance(texto);
  const voces = sy.getVoices();
  const pref = ['es-PE', 'es-419', 'es-US', 'es-MX', 'es-ES'];
  u.voice = pref.map(l => voces.find(v => v.lang.replace('_', '-') === l)).find(Boolean) || voces.find(v => v.lang.startsWith('es')) || null;
  u.lang = u.voice ? u.voice.lang : 'es-PE';
  u.rate = 0.98; u.pitch = 0.75;
  if (boton) { boton.textContent = '⏹ Detener'; u.onend = u.onerror = () => boton.textContent = '🔊 Escuchar al vikingo'; }
  sy.speak(u);
}
if ('speechSynthesis' in window) speechSynthesis.getVoices(); // precarga la lista de voces
