"""
API Flask pour la calculatrice.
Phase 1 : opérations de base
Phase 2 : overflow, NaN, pourcentage, changement de signe
Phase 3 : fonctions scientifiques
Phase 4 : historique SQLite, mémoire (M+, M-, MR, MC)
"""

import math
import sqlite3
import os
from datetime import datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MAX_VALUE = 1e300
MAX_FACTORIAL = 170

# Chemin de la base de données SQLite (à côté de app.py)
DB_PATH = os.path.join(os.path.dirname(__file__), 'calculatrice.db')

# Mémoire en RAM (simple, suffit pour une appli mono-utilisateur)
_memory = {"value": 0.0}


# ---------------------------------------------------------------------------
# Base de données SQLite
# ---------------------------------------------------------------------------
def get_db():
    """Retourne la connexion SQLite associée à la requête en cours."""
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    """Crée les tables si elles n'existent pas."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                expression TEXT    NOT NULL,
                result     REAL    NOT NULL,
                created_at TEXT    NOT NULL
            )
        """)
        conn.commit()


# ---------------------------------------------------------------------------
# Logique métier
# ---------------------------------------------------------------------------
def calculer(a: float, b: float, operation: str) -> float:
    ops_sans_input = {"pi", "euler"}
    if operation not in ops_sans_input:
        for val, name in ((a, "a"),):
            if math.isnan(val):
                raise ValueError(f"'{name}' n'est pas un nombre valide (NaN)")
            if math.isinf(val):
                raise ValueError(f"'{name}' est infini")
            if abs(val) > MAX_VALUE:
                raise OverflowError(f"'{name}' dépasse la valeur maximale autorisée")

    if operation == "add":
        result = a + b
    elif operation == "subtract":
        result = a - b
    elif operation == "multiply":
        result = a * b
    elif operation == "divide":
        if b == 0:
            raise ZeroDivisionError("Division par zéro impossible")
        result = a / b
    elif operation == "pow":
        try:
            result = math.pow(a, b)
        except ValueError:
            raise ValueError(f"Impossible de calculer {a} ^ {b}")
    elif operation == "percent":
        result = a / 100.0 * b
    elif operation == "toggle_sign":
        result = -a
    elif operation == "sqrt":
        if a < 0:
            raise ValueError("Racine carrée d'un nombre négatif impossible")
        result = math.sqrt(a)
    elif operation == "square":
        result = a * a
    elif operation == "inverse":
        if a == 0:
            raise ZeroDivisionError("Division par zéro (1/x)")
        result = 1 / a
    elif operation == "sin":
        result = math.sin(math.radians(a))
    elif operation == "cos":
        result = math.cos(math.radians(a))
    elif operation == "tan":
        if math.isclose(math.cos(math.radians(a)), 0, abs_tol=1e-10):
            raise ValueError(f"tan({a}°) est indéfini")
        result = math.tan(math.radians(a))
    elif operation == "log":
        if a <= 0:
            raise ValueError("log10 défini uniquement pour les nombres > 0")
        result = math.log10(a)
    elif operation == "ln":
        if a <= 0:
            raise ValueError("ln défini uniquement pour les nombres > 0")
        result = math.log(a)
    elif operation == "factorial":
        if a < 0:
            raise ValueError("Factorielle définie uniquement pour les entiers ≥ 0")
        if a != int(a):
            raise ValueError("Factorielle définie uniquement pour les entiers")
        n = int(a)
        if n > MAX_FACTORIAL:
            raise OverflowError(f"Factorielle trop grande (max {MAX_FACTORIAL}!)")
        result = float(math.factorial(n))
    elif operation == "pi":
        result = math.pi
    elif operation == "euler":
        result = math.e
    else:
        raise ValueError(f"Opération inconnue : {operation}")

    if math.isnan(result):
        raise ValueError("Le résultat n'est pas un nombre valide")
    if math.isinf(result):
        raise OverflowError("Dépassement de capacité — résultat infini")
    if abs(result) > MAX_VALUE:
        raise OverflowError("Résultat trop grand pour être affiché")

    return result


def format_result(resultat: float):
    if resultat == int(resultat) and abs(resultat) < 1e15:
        return int(resultat)
    return resultat


# ---------------------------------------------------------------------------
# Routes — Calcul
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "phase": 4}), 200


@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Corps de requête JSON manquant ou invalide"}), 400

    operation = data.get("operation")
    if not operation:
        return jsonify({"error": "Champ requis manquant : 'operation'"}), 400

    ops_sans_input = {"pi", "euler"}
    ops_unaires = {
        "toggle_sign", "sqrt", "square", "inverse",
        "sin", "cos", "tan", "log", "ln", "factorial"
    }

    if operation not in ops_sans_input:
        if "a" not in data:
            return jsonify({"error": "Champ requis manquant : 'a'"}), 400
        if operation not in ops_unaires and "b" not in data:
            return jsonify({"error": "Champ requis manquant : 'b'"}), 400

    try:
        a = float(data.get("a", 0))
        b = float(data.get("b", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "'a' et 'b' doivent être des nombres"}), 400

    try:
        resultat = calculer(a, b, operation)
    except ZeroDivisionError as e:
        return jsonify({"error": str(e)}), 400
    except (ValueError, OverflowError) as e:
        return jsonify({"error": str(e)}), 400

    resultat = format_result(resultat)

    # Sauvegarder dans l'historique si expression significative
    expression = data.get("expression", "")
    if expression:
        db = get_db()
        db.execute(
            "INSERT INTO history (expression, result, created_at) VALUES (?, ?, ?)",
            (expression, float(resultat), datetime.utcnow().isoformat())
        )
        db.commit()

    return jsonify({"result": resultat}), 200


# ---------------------------------------------------------------------------
# Routes — Historique
# ---------------------------------------------------------------------------
@app.route("/api/history", methods=["GET"])
def get_history():
    db = get_db()
    rows = db.execute(
        "SELECT id, expression, result, created_at FROM history ORDER BY id DESC LIMIT 50"
    ).fetchall()
    return jsonify([dict(row) for row in rows]), 200


@app.route("/api/history", methods=["DELETE"])
def clear_history():
    db = get_db()
    db.execute("DELETE FROM history")
    db.commit()
    return jsonify({"message": "Historique effacé"}), 200


@app.route("/api/history/<int:entry_id>", methods=["DELETE"])
def delete_history_entry(entry_id):
    db = get_db()
    db.execute("DELETE FROM history WHERE id = ?", (entry_id,))
    db.commit()
    return jsonify({"message": "Entrée supprimée"}), 200


# ---------------------------------------------------------------------------
# Routes — Mémoire
# ---------------------------------------------------------------------------
@app.route("/api/memory", methods=["GET"])
def memory_recall():
    return jsonify({"value": _memory["value"]}), 200


@app.route("/api/memory/add", methods=["POST"])
def memory_add():
    data = request.get_json(silent=True) or {}
    try:
        val = float(data.get("value", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Valeur invalide"}), 400
    _memory["value"] += val
    return jsonify({"value": _memory["value"]}), 200


@app.route("/api/memory/subtract", methods=["POST"])
def memory_subtract():
    data = request.get_json(silent=True) or {}
    try:
        val = float(data.get("value", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Valeur invalide"}), 400
    _memory["value"] -= val
    return jsonify({"value": _memory["value"]}), 200


@app.route("/api/memory/clear", methods=["POST"])
def memory_clear():
    _memory["value"] = 0.0
    return jsonify({"value": 0.0}), 200


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5001)
