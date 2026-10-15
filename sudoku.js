// ===================================================================
// Sudoku: generador por backtracking (equivalente a sudoku.py) y juego.
// Si la página la sirve Flask, los sudokus se generan en Python.
// ===================================================================

const PISTAS = { facil: 38, medio: 31, dificil: 26 };
const NOMBRES = { facil: 'fácil', medio: 'medio', dificil: 'difícil' };

// ---------------------- Generador ----------------------
const barajar = (lista) => {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
};

function esValido(t, fila, col, num) {
  for (let i = 0; i < 9; i++) if (t[fila][i] === num || t[i][col] === num) return false;
  const bf = Math.floor(fila / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let f = bf; f < bf + 3; f++) for (let c = bc; c < bc + 3; c++) if (t[f][c] === num) return false;
  return true;
}

function siguienteVacia(t) {
  for (let f = 0; f < 9; f++) for (let c = 0; c < 9; c++) if (t[f][c] === 0) return [f, c];
  return null;
}

function resolver(t, aleatorio = false) {
  const vacia = siguienteVacia(t);
  if (!vacia) return true;
  const [f, c] = vacia;
  const candidatos = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  if (aleatorio) barajar(candidatos);
  for (const num of candidatos) {
    if (esValido(t, f, c, num)) {
      t[f][c] = num;
      if (resolver(t, aleatorio)) return true;
      t[f][c] = 0; // retrocede
    }
  }
  return false;
}

function contarSoluciones(t, limite = 2) {
  const vacia = siguienteVacia(t);
  if (!vacia) return 1;
  const [f, c] = vacia;
  let total = 0;
  for (let num = 1; num <= 9 && total < limite; num++) {
    if (esValido(t, f, c, num)) {
      t[f][c] = num;
      total += contarSoluciones(t, limite - total);
      t[f][c] = 0;
    }
  }
  return total;
}

function generarLocal(dificultad) {
  const solucion = Array.from({ length: 9 }, () => Array(9).fill(0));
  resolver(solucion, true);
  const puzzle = solucion.map((fila) => [...fila]);
  let pistas = 81;
  for (const i of barajar([...Array(81).keys()])) {
    if (pistas <= PISTAS[dificultad]) break;
    const [f, c] = [Math.floor(i / 9), i % 9];
    const guardado = puzzle[f][c];
    puzzle[f][c] = 0;
    if (contarSoluciones(puzzle.map((fila) => [...fila])) !== 1) puzzle[f][c] = guardado;
    else pistas--;
  }
  return { puzzle, solucion };
}

// ---------------------- Estado del juego ----------------------
const $ = (id) => document.getElementById(id);
const tablero = $('tablero');
let estado; // { puzzle, solucion, valores[81], notas[81] (Set), fijas[81], errores, historial }
let seleccion = null;
let modoNotas = false;
let dificultad = 'medio';
let motorPython = false;
let cronometro;
let segundos = 0;

const fila = (i) => Math.floor(i / 9);
const col = (i) => i % 9;
const bloque = (i) => Math.floor(fila(i) / 3) * 3 + Math.floor(col(i) / 3);
const relacionadas = (a, b) => fila(a) === fila(b) || col(a) === col(b) || bloque(a) === bloque(b);

async function nuevoSudoku() {
  $('aviso').classList.add('oculto');
  tablero.style.opacity = 0.4;
  let datos;
  if (motorPython) {
    datos = await (await fetch(`api/nuevo?dificultad=${dificultad}`)).json();
  } else {
    await new Promise((r) => setTimeout(r)); // deja pintar la opacidad antes de calcular
    datos = generarLocal(dificultad);
  }
  const plano = datos.puzzle.flat();
  estado = {
    solucion: datos.solucion.flat(),
    valores: plano,
    fijas: plano.map((v) => v !== 0),
    notas: plano.map(() => new Set()),
    errores: 0,
    historial: [],
    terminado: false,
  };
  seleccion = null;
  segundos = 0;
  $('errores').textContent = 0;
  clearInterval(cronometro);
  cronometro = setInterval(() => {
    segundos++;
    $('tiempo').textContent = formatoTiempo(segundos);
  }, 1000);
  $('tiempo').textContent = '00:00';
  tablero.style.opacity = 1;
  pintar();
}

const formatoTiempo = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ---------------------- Dibujo ----------------------
function crearTablero() {
  for (let i = 0; i < 81; i++) {
    const celda = document.createElement('div');
    celda.className = 'celda';
    celda.setAttribute('role', 'gridcell');
    celda.addEventListener('click', () => {
      seleccion = i;
      pintar();
    });
    tablero.appendChild(celda);
  }
  for (let n = 1; n <= 9; n++) {
    const boton = document.createElement('button');
    boton.textContent = n;
    boton.addEventListener('click', () => escribir(n));
    $('teclado').appendChild(boton);
  }
}

function pintar() {
  const valorSel = seleccion !== null ? estado.valores[seleccion] : 0;
  [...tablero.children].forEach((celda, i) => {
    const valor = estado.valores[i];
    celda.className = 'celda';
    if (estado.fijas[i]) celda.classList.add('fija');
    if (seleccion !== null && relacionadas(i, seleccion)) celda.classList.add('relacionada');
    if (valorSel && valor === valorSel) celda.classList.add('mismo-numero');
    if (i === seleccion) celda.classList.add('seleccionada');
    if (valor && valor !== estado.solucion[i]) celda.classList.add('error');

    if (valor) celda.textContent = valor;
    else if (estado.notas[i].size) {
      celda.innerHTML = `<div class="notas">${[1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((n) => `<span>${estado.notas[i].has(n) ? n : ''}</span>`)
        .join('')}</div>`;
    } else celda.textContent = '';
  });

  // Atenúa en el teclado los números que ya están colocados 9 veces
  const usados = Array(10).fill(0);
  estado.valores.forEach((v, i) => v && v === estado.solucion[i] && usados[v]++);
  [...$('teclado').children].forEach((b, k) => b.classList.toggle('agotado', usados[k + 1] === 9));
}

// ---------------------- Acciones ----------------------
function guardarHistorial(i) {
  estado.historial.push({ i, valor: estado.valores[i], notas: new Set(estado.notas[i]) });
}

function escribir(n) {
  if (seleccion === null || estado.fijas[seleccion] || estado.terminado) return;
  guardarHistorial(seleccion);

  if (modoNotas) {
    const notas = estado.notas[seleccion];
    notas.has(n) ? notas.delete(n) : notas.add(n);
    estado.valores[seleccion] = 0;
  } else {
    estado.valores[seleccion] = estado.valores[seleccion] === n ? 0 : n;
    estado.notas[seleccion].clear();
    if (estado.valores[seleccion] && n !== estado.solucion[seleccion]) {
      estado.errores++;
      $('errores').textContent = estado.errores;
      if (estado.errores >= 3) return terminar(false);
    } else if (n === estado.solucion[seleccion]) {
      // Quita esa nota de las celdas relacionadas
      estado.notas.forEach((notas, j) => relacionadas(j, seleccion) && notas.delete(n));
    }
  }
  pintar();
  comprobarVictoria();
}

function borrar() {
  if (seleccion === null || estado.fijas[seleccion]) return;
  guardarHistorial(seleccion);
  estado.valores[seleccion] = 0;
  estado.notas[seleccion].clear();
  pintar();
}

function deshacer() {
  const ultimo = estado.historial.pop();
  if (!ultimo) return;
  estado.valores[ultimo.i] = ultimo.valor;
  estado.notas[ultimo.i] = ultimo.notas;
  seleccion = ultimo.i;
  pintar();
}

function pista() {
  if (estado.terminado) return;
  // Si la celda seleccionada no está bien, se usa esa; si no, una vacía al azar
  let i = seleccion;
  if (i === null || estado.valores[i] === estado.solucion[i]) {
    const vacias = estado.valores.map((v, k) => (v !== estado.solucion[k] ? k : -1)).filter((k) => k >= 0);
    if (!vacias.length) return;
    i = vacias[Math.floor(Math.random() * vacias.length)];
  }
  guardarHistorial(i);
  estado.valores[i] = estado.solucion[i];
  estado.notas[i].clear();
  seleccion = i;
  pintar();
  tablero.children[i].classList.add('pista-dada');
  comprobarVictoria();
}

function comprobarVictoria() {
  if (estado.valores.every((v, i) => v === estado.solucion[i])) terminar(true);
}

function terminar(gano) {
  estado.terminado = true;
  clearInterval(cronometro);
  $('aviso-titulo').textContent = gano ? '¡Resuelto! 🎉' : 'Fin de la partida';
  $('aviso-texto').textContent = gano
    ? `Nivel ${NOMBRES[dificultad]} en ${formatoTiempo(segundos)} con ${estado.errores} ${estado.errores === 1 ? 'error' : 'errores'}.`
    : 'Has cometido 3 errores. ¡Prueba otra vez!';
  $('aviso').classList.remove('oculto');
  pintar();
}

// ---------------------- Eventos ----------------------
$('borrar').addEventListener('click', borrar);
$('deshacer').addEventListener('click', deshacer);
$('pista').addEventListener('click', pista);
$('nuevo').addEventListener('click', nuevoSudoku);
$('otra').addEventListener('click', nuevoSudoku);
$('notas').addEventListener('click', () => {
  modoNotas = !modoNotas;
  $('notas').classList.toggle('activa', modoNotas);
  $('estado-notas').textContent = modoNotas ? 'ON' : 'OFF';
});
$('resolver').addEventListener('click', () => {
  estado.valores = [...estado.solucion];
  estado.terminado = true;
  clearInterval(cronometro);
  pintar();
});
document.querySelectorAll('.dificultades button').forEach((boton) => {
  boton.addEventListener('click', () => {
    document.querySelector('.dificultades .activa').classList.remove('activa');
    boton.classList.add('activa');
    dificultad = boton.dataset.dificultad;
    nuevoSudoku();
  });
});

document.addEventListener('keydown', (e) => {
  if (!estado) return;
  if (/^[1-9]$/.test(e.key)) escribir(+e.key);
  else if (['Backspace', 'Delete', '0'].includes(e.key)) borrar();
  else if (e.key.toLowerCase() === 'n') $('notas').click();
  else if (e.key.toLowerCase() === 'h') pista();
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') deshacer();
  else if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    const s = seleccion ?? 40;
    const mov = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
    seleccion = (s + mov + 81) % 81;
    pintar();
  }
});

// ---------------------- Arranque ----------------------
(async () => {
  crearTablero();
  try {
    const r = await fetch('api/nuevo?dificultad=facil', { signal: AbortSignal.timeout(1500) });
    motorPython = r.ok && (await r.json()).motor === 'python';
  } catch {
    motorPython = false;
  }
  $('motor').textContent = motorPython ? 'Generador: Python' : 'Generador: JavaScript';
  nuevoSudoku();
})();
