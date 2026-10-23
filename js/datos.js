// Contenido del recorrido. Textos generales: validar con el Castillo antes de producción.
const ESTACIONES = [
  {
    id: 1, dialogo: ["¡Bienvenido, visitante, al Castillo de Chancay!", "Soy tu guía en este recorrido. Busca los 4 puntos, escanea cada marcador y resuelve los acertijos.", "¡Que empiece la aventura!"],
    nombre: 'La Portada', icono: '🏰', tema: 'Doña Consuelo Amat y León',
    titulo: 'La soñadora del castillo',
    historia: 'Según la tradición, este castillo frente al mar nació del sueño de doña Consuelo Amat y León: levantar una residencia con aire de fortaleza medieval, con torres, almenas y vista al océano Pacífico. Su idea convirtió un acantilado de la costa en un lugar de leyenda.',
    dato: 'Mira las torres y almenas: imitan a los castillos europeos, pero están hechas para mirar el mar.',
    acertijo: 'Me olvidaron por años, el viento y la sal me gastaron, pero manos pacientes me levantaron otra vez. ¿Dónde se cuenta mi renacer?',
    opciones: ['El Patio de la Memoria', 'Los Pasadizos', 'El Mirador del Pacífico'], correcta: 0
  },
  {
    id: 2, dialogo: ["¡Bien hecho, visitante! Llegaste al Patio de la Memoria.", "Estos muros tienen mucho que contar. Lee su historia y resuelve el acertijo."],
    nombre: 'El Patio de la Memoria', icono: '🧱', tema: 'Abandono y restauración',
    titulo: 'Del olvido al renacer',
    historia: 'Con el paso del tiempo el castillo quedó abandonado y la humedad, el salitre y los años dañaron sus muros. En la década de 1990 fue restaurado y abrió sus puertas como atractivo turístico, para que hoy cada visitante pueda recorrerlo.',
    dato: 'Observa los muros: en un edificio restaurado conviven partes antiguas y partes recuperadas.',
    acertijo: 'No tengo ventanas ni salones; soy estrecho, oscuro y guardo secretos. Las leyendas dicen que llevo hasta el mar. ¿Quién soy?',
    opciones: ['El Mirador del Pacífico', 'Los Pasadizos', 'La Portada'], correcta: 1
  },
  {
    id: 3, dialogo: ["Shhh… estás en Los Pasadizos.", "Dicen que estos caminos guardan secretos. ¿Te atreves a descubrirlos?"],
    nombre: 'Los Pasadizos', icono: '🕯️', tema: 'Pasadizos y leyendas',
    titulo: 'Caminos bajo la piedra',
    historia: 'El castillo tiene corredores, escaleras y pasadizos que se recorren entre muros gruesos. Alrededor de ellos nacieron muchas leyendas: túneles hacia el mar, rincones escondidos y pasos que solo conocían sus antiguos habitantes. ¿Cuánto es historia y cuánto imaginación? Decídelo tú.',
    dato: 'Las leyendas son parte del encanto: escúchalas, pero recuerda que no todas están comprobadas.',
    acertijo: 'Subo alto para ver lejos; frente a mí solo hay olas, horizonte y atardecer. Allí termina tu recorrido. ¿Dónde estoy?',
    opciones: ['La Portada', 'El Patio de la Memoria', 'El Mirador del Pacífico'], correcta: 2
  },
  {
    id: 4, dialogo: ["¡Lo lograste, visitante! Este es el Mirador del Pacífico.", "Disfruta la vista. Un último reto y completarás el recorrido."],
    nombre: 'El Mirador del Pacífico', icono: '🌊', tema: 'El castillo y el mar',
    titulo: 'Donde el castillo mira al océano',
    historia: 'El castillo se levanta sobre el acantilado frente al océano Pacífico. Desde sus terrazas se ve la bahía de Chancay, el ir y venir de las olas y algunos de los atardeceres más bonitos de la costa de Huaral.',
    dato: 'Toma tu mejor foto del atardecer y compártela con el recorrido en realidad aumentada.',
    acertijo: 'Último reto: ¿quién soñó este castillo frente al mar?',
    opciones: ['Un pirata del Pacífico', 'Doña Consuelo Amat y León', 'Un rey europeo'], correcta: 1
  }
];

const CLAVE = 'chancay-ar-progreso';
const Progreso = {
  leer() { try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { return []; } },
  marcar(id) { const p = new Set(this.leer()); p.add(id); localStorage.setItem(CLAVE, JSON.stringify([...p].sort())); },
  hecho(id) { return this.leer().includes(id); },
  completo() { return ESTACIONES.every(e => this.hecho(e.id)); },
  reiniciar() { localStorage.removeItem(CLAVE); }
};
