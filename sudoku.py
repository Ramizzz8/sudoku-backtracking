"""Generador de sudokus con backtracking.

1. Se rellena un tablero vacío probando números al azar y retrocediendo cuando no encajan.
2. Se van quitando números mientras el sudoku siga teniendo UNA sola solución.
"""

import random

PISTAS = {"facil": 38, "medio": 31, "dificil": 26}


def es_valido(tablero, fila, col, num):
    """Comprueba si `num` puede ir en (fila, col) sin repetirse en su fila, columna o bloque 3x3."""
    if num in tablero[fila]:
        return False
    if any(tablero[f][col] == num for f in range(9)):
        return False
    bf, bc = (fila // 3) * 3, (col // 3) * 3
    return all(tablero[f][c] != num for f in range(bf, bf + 3) for c in range(bc, bc + 3))


def _siguiente_vacia(tablero):
    for f in range(9):
        for c in range(9):
            if tablero[f][c] == 0:
                return f, c
    return None


def resolver(tablero, aleatorio=False):
    """Backtracking: rellena el tablero in situ. Devuelve True si encuentra solución."""
    vacia = _siguiente_vacia(tablero)
    if vacia is None:
        return True
    fila, col = vacia
    candidatos = list(range(1, 10))
    if aleatorio:
        random.shuffle(candidatos)
    for num in candidatos:
        if es_valido(tablero, fila, col, num):
            tablero[fila][col] = num
            if resolver(tablero, aleatorio):
                return True
            tablero[fila][col] = 0  # retrocede
    return False


def contar_soluciones(tablero, limite=2):
    """Cuenta soluciones hasta `limite` (basta con saber si hay más de una)."""
    vacia = _siguiente_vacia(tablero)
    if vacia is None:
        return 1
    fila, col = vacia
    total = 0
    for num in range(1, 10):
        if es_valido(tablero, fila, col, num):
            tablero[fila][col] = num
            total += contar_soluciones(tablero, limite - total)
            tablero[fila][col] = 0
            if total >= limite:
                break
    return total


def generar(dificultad="medio"):
    """Devuelve (puzzle, solucion) como listas 9x9; las celdas vacías del puzzle son 0."""
    solucion = [[0] * 9 for _ in range(9)]
    resolver(solucion, aleatorio=True)

    puzzle = [fila[:] for fila in solucion]
    objetivo = PISTAS.get(dificultad, PISTAS["medio"])
    celdas = [(f, c) for f in range(9) for c in range(9)]
    random.shuffle(celdas)
    pistas = 81
    for f, c in celdas:
        if pistas <= objetivo:
            break
        guardado = puzzle[f][c]
        puzzle[f][c] = 0
        # Si al quitarlo aparece más de una solución, se vuelve a poner
        if contar_soluciones([fila[:] for fila in puzzle]) != 1:
            puzzle[f][c] = guardado
        else:
            pistas -= 1
    return puzzle, solucion


if __name__ == "__main__":
    p, s = generar("dificil")
    for fila in p:
        print(" ".join(str(n) if n else "·" for n in fila))
