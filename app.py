"""Servidor Flask: genera los sudokus en Python.

La web (index.html) usa esta API si está disponible; abierta sin servidor
(por ejemplo en GitHub Pages) usa el generador equivalente en JavaScript.
"""

import time

from flask import Flask, jsonify, request, send_from_directory

from sudoku import PISTAS, generar

app = Flask(__name__, static_folder=".", static_url_path="")


@app.route("/")
def inicio():
    return send_from_directory(".", "index.html")


@app.get("/api/nuevo")
def nuevo():
    dificultad = request.args.get("dificultad", "medio")
    if dificultad not in PISTAS:
        dificultad = "medio"
    inicio_ms = time.perf_counter()
    puzzle, solucion = generar(dificultad)
    return jsonify(
        motor="python",
        dificultad=dificultad,
        puzzle=puzzle,
        solucion=solucion,
        ms=round((time.perf_counter() - inicio_ms) * 1000),
    )


if __name__ == "__main__":
    app.run(debug=True, port=5002)
