# Sudoku · Backtracking

Sudoku jugable en el navegador con un generador propio basado en **backtracking** que garantiza que cada tablero tiene **una única solución**. El generador está escrito en Python (servido con Flask) y portado a JavaScript, así que el juego funciona también sin servidor.

**[▶ Jugar en vivo](https://ramizzz8.github.io/sudoku-backtracking/)**

![Partida en nivel difícil](docs/captura.png)

## Cómo se genera un sudoku

1. **Tablero completo**: se recorre celda a celda probando los números del 1 al 9 en orden aleatorio. Si ninguno encaja, se retrocede a la celda anterior y se prueba el siguiente (backtracking).
2. **Quitar cifras**: se vacían celdas al azar y, tras cada una, un segundo backtracking cuenta las soluciones (parando en 2). Si aparece más de una, la cifra se vuelve a poner.
3. Se para al llegar a las pistas de cada nivel: 38 (fácil), 31 (medio) o 26 (difícil).

## Características del juego

- Tres niveles de dificultad, cronómetro y límite de 3 errores.
- **Notas a lápiz** para apuntar candidatos; se borran solas al colocar el número correcto en su fila, columna o bloque.
- Resaltado de la fila, columna y bloque de la celda seleccionada y de todas las celdas con el mismo número.
- Pistas, deshacer, borrar y ver la solución.
- El teclado numérico atenúa los números que ya están completos.
- Atajos: <kbd>1</kbd>–<kbd>9</kbd> escribir, <kbd>N</kbd> notas, <kbd>H</kbd> pista, <kbd>Supr</kbd> borrar, <kbd>Ctrl</kbd>+<kbd>Z</kbd> deshacer y flechas para moverse.

## Tecnologías

Python · Flask · JavaScript · HTML · CSS Grid

## Cómo ejecutarlo

Solo el navegador: abre `index.html` y se usará el generador en JavaScript.

Con el generador en Python:

```bash
git clone https://github.com/Ramizzz8/sudoku-backtracking.git
cd sudoku-backtracking
pip install -r requirements.txt
python app.py
```

Abre <http://127.0.0.1:5002>. También puedes generar uno en la terminal con `python sudoku.py`.

## Autor

**Andrés Ramírez** — [GitHub](https://github.com/Ramizzz8) · [LinkedIn](https://www.linkedin.com/in/andr%C3%A9s-ram%C3%ADrez-011936349/)
