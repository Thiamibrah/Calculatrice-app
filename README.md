# Calculatrice React + Flask

Calculatrice full-stack développée en 4 phases progressives, avec un backend Python/Flask et un frontend React/Vite.

---

## Stack technique

| Couche    | Technologie                        |
|-----------|------------------------------------|
| Frontend  | React 18, Vite, CSS variables      |
| Backend   | Python 3.12, Flask 3, Flask-CORS   |
| Stockage  | SQLite (historique)                |
| Tests     | pytest                             |

---

## Installation et lancement

### Prérequis
- Python 3.10+ (`py --version`)
- Node.js 18+ (`node --version`)

### Backend

```bash
cd backend
py -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
python app.py
# → http://127.0.0.1:5001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Fonctionnalités

### Phase 1 — MVP fonctionnel
- Opérations de base : `+`, `-`, `×`, `÷`
- Gestion division par zéro
- Communication frontend ↔ backend via API REST

### Phase 2 — Robustesse
- Validation complète des entrées (NaN, Infinity, overflow)
- Pourcentage `%` avec contexte (`150 + 20%` → `30`)
- Changement de signe `±`
- Clavier physique (`0-9`, `+`, `-`, `*`, `/`, `Enter`, `Escape`, `Backspace`, `%`)
- Bouton ⌫ pour effacer le dernier chiffre
- Opérateur actif mis en surbrillance

### Phase 3 — Fonctions scientifiques
- Panneau scientifique (bouton **Sci** / **Basique**)
- Fonctions : `sin`, `cos`, `tan` (en degrés), `log₁₀`, `ln`
- `√`, `x²`, `xʸ`, `1/x`, `n!`
- Constantes : `π`, `e`
- Parenthèses `( )` avec évaluation imbriquée
- Raccourcis clavier en mode sci : `s` `c` `t` `r` `l` `n` `!` `^` `(` `)`

### Phase 4 — Confort et finition
- **Historique** : stockage SQLite, liste des 50 derniers calculs, clic pour réutiliser, suppression individuelle ou totale
- **Mémoire** : `MC`, `MR`, `M+`, `M-` avec indicateur `M` sur l'écran
- **Thème** : bascule clair ☀️ / sombre 🌙 via variables CSS
- **Responsive** : adapté mobile et desktop
- **Tests** : suite pytest couvrant toutes les routes et fonctions

---

## API REST

### Calcul

| Méthode | Route            | Description                        |
|---------|------------------|------------------------------------|
| POST    | `/api/calculate` | Effectue un calcul                 |
| GET     | `/api/health`    | Statut du serveur                  |

**Corps POST `/api/calculate`**
```json
{
  "a": 20,
  "b": 150,
  "operation": "percent",
  "expression": "20% de 150"
}
```

Opérations disponibles : `add`, `subtract`, `multiply`, `divide`, `pow`, `percent`, `toggle_sign`, `sqrt`, `square`, `inverse`, `sin`, `cos`, `tan`, `log`, `ln`, `factorial`, `pi`, `euler`

### Historique

| Méthode | Route                  | Description                |
|---------|------------------------|----------------------------|
| GET     | `/api/history`         | Liste des calculs (max 50) |
| DELETE  | `/api/history`         | Efface tout l'historique   |
| DELETE  | `/api/history/<id>`    | Supprime une entrée        |

### Mémoire

| Méthode | Route                  | Description     |
|---------|------------------------|-----------------|
| GET     | `/api/memory`          | Lire la mémoire |
| POST    | `/api/memory/add`      | M+              |
| POST    | `/api/memory/subtract` | M-              |
| POST    | `/api/memory/clear`    | MC              |

---

## Tests

```bash
cd backend
venv\Scripts\activate
pytest test_app.py -v
```

Couverture : opérations de base, cas limites (division par zéro, sqrt négatif, tan indéfini, factorielle décimale…), historique SQLite, mémoire.

---

## Structure du projet

```
calculatrice-app/
├── backend/
│   ├── app.py              # API Flask
│   ├── test_app.py         # Tests pytest
│   ├── requirements.txt
│   └── calculatrice.db     # Créé automatiquement au lancement
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Composant principal
│   │   ├── App.css         # Styles + variables de thème
│   │   ├── api.js          # Couche réseau
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── render.yaml             # Configuration déploiement Render
```

---

## Auteur

Projet réalisé dans le cadre d'un stage — Ibrahima Thiam
