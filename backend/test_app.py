"""
Tests unitaires pour la calculatrice Flask.
Couvre : opérations de base, fonctions scientifiques, historique, mémoire.
Lancer : pytest test_app.py -v
"""

import pytest
import json
from app import app, init_db, _memory
import os

# Utiliser une DB de test séparée
TEST_DB = "test_calculatrice.db"


@pytest.fixture
def client(tmp_path, monkeypatch):
    """Client de test Flask avec base SQLite temporaire."""
    import app as app_module
    db_path = str(tmp_path / "test.db")
    monkeypatch.setattr(app_module, "DB_PATH", db_path)
    # Remettre la mémoire à zéro entre chaque test
    app_module._memory["value"] = 0.0
    app.config["TESTING"] = True
    init_db()
    with app.test_client() as client:
        yield client


def post_calc(client, payload):
    return client.post(
        "/api/calculate",
        data=json.dumps(payload),
        content_type="application/json",
    )


# ---------------------------------------------------------------------------
# Santé
# ---------------------------------------------------------------------------
class TestHealth:
    def test_health(self, client):
        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.get_json()
        assert data["status"] == "ok"
        assert data["phase"] == 4


# ---------------------------------------------------------------------------
# Opérations de base
# ---------------------------------------------------------------------------
class TestOperationsBase:
    def test_addition(self, client):
        res = post_calc(client, {"a": 3, "b": 4, "operation": "add"})
        assert res.status_code == 200
        assert res.get_json()["result"] == 7

    def test_soustraction(self, client):
        res = post_calc(client, {"a": 10, "b": 3, "operation": "subtract"})
        assert res.get_json()["result"] == 7

    def test_multiplication(self, client):
        res = post_calc(client, {"a": 6, "b": 7, "operation": "multiply"})
        assert res.get_json()["result"] == 42

    def test_division(self, client):
        res = post_calc(client, {"a": 15, "b": 3, "operation": "divide"})
        assert res.get_json()["result"] == 5

    def test_division_par_zero(self, client):
        res = post_calc(client, {"a": 5, "b": 0, "operation": "divide"})
        assert res.status_code == 400
        assert "zéro" in res.get_json()["error"].lower()

    def test_resultat_decimal(self, client):
        res = post_calc(client, {"a": 1, "b": 3, "operation": "divide"})
        assert abs(res.get_json()["result"] - 1 / 3) < 1e-10

    def test_nombres_negatifs(self, client):
        res = post_calc(client, {"a": -5, "b": -3, "operation": "add"})
        assert res.get_json()["result"] == -8

    def test_operation_inconnue(self, client):
        res = post_calc(client, {"a": 1, "b": 2, "operation": "modulo"})
        assert res.status_code == 400

    def test_champ_manquant(self, client):
        res = post_calc(client, {"a": 5, "operation": "add"})
        assert res.status_code == 400

    def test_valeur_non_numerique(self, client):
        res = post_calc(client, {"a": "abc", "b": 2, "operation": "add"})
        assert res.status_code == 400


# ---------------------------------------------------------------------------
# Phase 2 : percent, toggle_sign
# ---------------------------------------------------------------------------
class TestPhase2:
    def test_percent(self, client):
        # 20% de 150 = 30
        res = post_calc(client, {"a": 20, "b": 150, "operation": "percent"})
        assert res.get_json()["result"] == 30

    def test_percent_simple(self, client):
        # 50% de 1 = 0.5
        res = post_calc(client, {"a": 50, "b": 1, "operation": "percent"})
        assert res.get_json()["result"] == pytest.approx(0.5)

    def test_toggle_sign_positif(self, client):
        res = post_calc(client, {"a": 5, "b": 0, "operation": "toggle_sign"})
        assert res.get_json()["result"] == -5

    def test_toggle_sign_negatif(self, client):
        res = post_calc(client, {"a": -3, "b": 0, "operation": "toggle_sign"})
        assert res.get_json()["result"] == 3

    def test_toggle_sign_zero(self, client):
        res = post_calc(client, {"a": 0, "b": 0, "operation": "toggle_sign"})
        assert res.get_json()["result"] == 0


# ---------------------------------------------------------------------------
# Phase 3 : fonctions scientifiques
# ---------------------------------------------------------------------------
class TestScientifique:
    def test_sqrt(self, client):
        res = post_calc(client, {"a": 9, "operation": "sqrt"})
        assert res.get_json()["result"] == 3

    def test_sqrt_negatif(self, client):
        res = post_calc(client, {"a": -4, "operation": "sqrt"})
        assert res.status_code == 400

    def test_square(self, client):
        res = post_calc(client, {"a": 5, "operation": "square"})
        assert res.get_json()["result"] == 25

    def test_pow(self, client):
        res = post_calc(client, {"a": 2, "b": 8, "operation": "pow"})
        assert res.get_json()["result"] == 256

    def test_inverse(self, client):
        res = post_calc(client, {"a": 4, "operation": "inverse"})
        assert res.get_json()["result"] == pytest.approx(0.25)

    def test_inverse_zero(self, client):
        res = post_calc(client, {"a": 0, "operation": "inverse"})
        assert res.status_code == 400

    def test_sin_90(self, client):
        res = post_calc(client, {"a": 90, "operation": "sin"})
        assert res.get_json()["result"] == pytest.approx(1.0)

    def test_cos_0(self, client):
        res = post_calc(client, {"a": 0, "operation": "cos"})
        assert res.get_json()["result"] == pytest.approx(1.0)

    def test_tan_45(self, client):
        res = post_calc(client, {"a": 45, "operation": "tan"})
        assert res.get_json()["result"] == pytest.approx(1.0)

    def test_tan_90_indefini(self, client):
        res = post_calc(client, {"a": 90, "operation": "tan"})
        assert res.status_code == 400

    def test_log_1000(self, client):
        res = post_calc(client, {"a": 1000, "operation": "log"})
        assert res.get_json()["result"] == pytest.approx(3.0)

    def test_log_negatif(self, client):
        res = post_calc(client, {"a": -1, "operation": "log"})
        assert res.status_code == 400

    def test_ln_e(self, client):
        import math
        res = post_calc(client, {"a": math.e, "operation": "ln"})
        assert res.get_json()["result"] == pytest.approx(1.0)

    def test_factorial_5(self, client):
        res = post_calc(client, {"a": 5, "operation": "factorial"})
        assert res.get_json()["result"] == 120

    def test_factorial_0(self, client):
        res = post_calc(client, {"a": 0, "operation": "factorial"})
        assert res.get_json()["result"] == 1

    def test_factorial_negatif(self, client):
        res = post_calc(client, {"a": -1, "operation": "factorial"})
        assert res.status_code == 400

    def test_factorial_decimal(self, client):
        res = post_calc(client, {"a": 3.5, "operation": "factorial"})
        assert res.status_code == 400

    def test_pi(self, client):
        import math
        res = post_calc(client, {"operation": "pi"})
        assert res.get_json()["result"] == pytest.approx(math.pi)

    def test_euler(self, client):
        import math
        res = post_calc(client, {"operation": "euler"})
        assert res.get_json()["result"] == pytest.approx(math.e)


# ---------------------------------------------------------------------------
# Phase 4 : historique
# ---------------------------------------------------------------------------
class TestHistorique:
    def test_historique_vide(self, client):
        res = client.get("/api/history")
        assert res.status_code == 200
        assert res.get_json() == []

    def test_calcul_enregistre(self, client):
        post_calc(client, {"a": 2, "b": 3, "operation": "add", "expression": "2 + 3"})
        res = client.get("/api/history")
        data = res.get_json()
        assert len(data) == 1
        assert data[0]["expression"] == "2 + 3"
        assert data[0]["result"] == 5

    def test_calcul_sans_expression_non_enregistre(self, client):
        post_calc(client, {"a": 2, "b": 3, "operation": "add"})
        res = client.get("/api/history")
        assert res.get_json() == []

    def test_effacer_historique(self, client):
        post_calc(client, {"a": 1, "b": 1, "operation": "add", "expression": "1 + 1"})
        client.delete("/api/history")
        res = client.get("/api/history")
        assert res.get_json() == []

    def test_supprimer_entree(self, client):
        post_calc(client, {"a": 1, "b": 2, "operation": "add", "expression": "1 + 2"})
        entry_id = client.get("/api/history").get_json()[0]["id"]
        client.delete(f"/api/history/{entry_id}")
        res = client.get("/api/history")
        assert res.get_json() == []


# ---------------------------------------------------------------------------
# Phase 4 : mémoire
# ---------------------------------------------------------------------------
class TestMemoire:
    def test_recall_initial(self, client):
        res = client.get("/api/memory")
        assert res.status_code == 200
        assert res.get_json()["value"] == 0

    def test_memory_add(self, client):
        res = client.post("/api/memory/add",
                          data=json.dumps({"value": 5}),
                          content_type="application/json")
        assert res.get_json()["value"] == 5

    def test_memory_subtract(self, client):
        client.post("/api/memory/add",
                    data=json.dumps({"value": 10}),
                    content_type="application/json")
        res = client.post("/api/memory/subtract",
                          data=json.dumps({"value": 3}),
                          content_type="application/json")
        assert res.get_json()["value"] == 7

    def test_memory_clear(self, client):
        client.post("/api/memory/add",
                    data=json.dumps({"value": 42}),
                    content_type="application/json")
        res = client.post("/api/memory/clear")
        assert res.get_json()["value"] == 0

    def test_memory_recall_apres_add(self, client):
        client.post("/api/memory/add",
                    data=json.dumps({"value": 7}),
                    content_type="application/json")
        res = client.get("/api/memory")
        assert res.get_json()["value"] == 7
