"""
API Flask pour la calculatrice.
Phase 1 : opérations de base (addition, soustraction, multiplication, division)
avec validation et gestion d'erreurs.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Autorise le frontend React (autre origine) à appeler cette API


# ---------------------------------------------------------------------------
# Logique métier : séparée de la couche HTTP pour rester testable facilement
# ---------------------------------------------------------------------------
def calculer(a: float, b: float, operation: str) -> float:
    """Effectue le calcul demandé et lève une erreur explicite si besoin."""
    if operation == "add":
        return a + b
    elif operation == "subtract":
        return a - b
    elif operation == "multiply":
        return a * b
    elif operation == "divide":
        if b == 0:
            raise ZeroDivisionError("Division par zéro impossible")
        return a / b
    else:
        raise ValueError(f"Opération inconnue : {operation}")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    """Simple route de vérification que le serveur tourne."""
    return jsonify({"status": "ok"}), 200


@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Corps de requête JSON manquant ou invalide"}), 400

    # --- Validation des champs requis ---
    for field in ("a", "b", "operation"):
        if field not in data:
            return jsonify({"error": f"Champ requis manquant : '{field}'"}), 400

    # --- Validation des types ---
    try:
        a = float(data["a"])
        b = float(data["b"])
    except (TypeError, ValueError):
        return jsonify({"error": "'a' et 'b' doivent être des nombres"}), 400

    operation = data["operation"]

    # --- Calcul avec gestion des erreurs métier ---
    try:
        resultat = calculer(a, b, operation)
    except ZeroDivisionError as e:
        return jsonify({"error": str(e)}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except OverflowError:
        return jsonify({"error": "Résultat trop grand"}), 400

    return jsonify({"result": resultat}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
