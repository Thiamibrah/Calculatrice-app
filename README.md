# Calculatrice React + Flask

Application de calculatrice avec une architecture séparée : un frontend **React** (Vite) pour l'interface, et un backend **Flask** qui expose une API REST effectuant les calculs.

## Stack technique

- **Frontend** : React 18, Vite
- **Backend** : Flask 3, Flask-CORS
- **Communication** : API REST JSON

## Architecture

```
calculatrice-app/
├── backend/
│   ├── app.py              # API Flask (routes + logique de calcul)
│   └── requirements.txt    # Dépendances Python
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Composant principal (interface calculatrice)
│   │   ├── App.css         # Styles
│   │   ├── api.js          # Appels HTTP vers le backend
│   │   └── main.jsx        # Point d'entrée React
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Installation et lancement

### 1. Backend (Flask)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Sous Windows : venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Le serveur démarre sur **http://127.0.0.1:5000**

### 2. Frontend (React)

Dans un second terminal :

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur **http://127.0.0.1:5173**

> Le fichier `vite.config.js` redirige automatiquement les appels `/api/*` vers le backend Flask (port 5000), donc pas de configuration CORS supplémentaire nécessaire côté navigateur.

## API — documentation

### `GET /api/health`
Vérifie que le serveur est actif.

**Réponse 200 :**
```json
{ "status": "ok" }
```

### `POST /api/calculate`
Effectue une opération arithmétique.

**Corps de la requête :**
```json
{
  "a": 5,
  "b": 3,
  "operation": "add"
}
```

**Opérations disponibles :** `add`, `subtract`, `multiply`, `divide`

**Réponse 200 (succès) :**
```json
{ "result": 8.0 }
```

**Réponse 400 (erreur, ex. division par zéro) :**
```json
{ "error": "Division par zéro impossible" }
```

## Fonctionnalités — État d'avancement

- [x] Phase 1 — Opérations de base (+, -, ×, ÷) avec architecture front/back fonctionnelle
- [ ] Phase 2 — Robustesse (validation complète, clavier physique, %, ±)
- [ ] Phase 3 — Fonctions scientifiques (√, x², parenthèses, trigonométrie)
- [ ] Phase 4 — Confort (historique, mémoire, thème clair/sombre, tests)

## Auteur

Projet réalisé dans le cadre d'un stage — Ibrahima Thiam
