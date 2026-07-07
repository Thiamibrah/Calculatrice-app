/**
 * Couche réseau — appels vers l'API Flask.
 * Phase 1 : opérations de base
 * Phase 2 : percent, toggle_sign
 * Phase 3 : fonctions scientifiques
 * Phase 4 : historique, mémoire
 */
// En production, VITE_API_URL pointe vers le backend Render
// En développement, le proxy Vite redirige /api vers localhost:5001
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

async function callApi(body) {
  const response = await fetch(`${API_BASE}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Erreur inconnue')
  return data.result
}

// ── Opérations binaires ──────────────────────────────────────────────────────
export const calculate     = (a, b, operation, expression) => callApi({ a, b, operation, expression })
export const calculatePow  = (a, b, expression)            => callApi({ a, b, operation: 'pow', expression })

// ── Phase 2 ──────────────────────────────────────────────────────────────────
export const calculatePercent = (a, b) => callApi({ a, b, operation: 'percent' })
export const toggleSign       = (a)    => callApi({ a, operation: 'toggle_sign' })

// ── Fonctions unaires ────────────────────────────────────────────────────────
export const calcSqrt      = (a, expression) => callApi({ a, operation: 'sqrt',      expression })
export const calcSquare    = (a, expression) => callApi({ a, operation: 'square',    expression })
export const calcInverse   = (a, expression) => callApi({ a, operation: 'inverse',   expression })
export const calcSin       = (a, expression) => callApi({ a, operation: 'sin',       expression })
export const calcCos       = (a, expression) => callApi({ a, operation: 'cos',       expression })
export const calcTan       = (a, expression) => callApi({ a, operation: 'tan',       expression })
export const calcLog       = (a, expression) => callApi({ a, operation: 'log',       expression })
export const calcLn        = (a, expression) => callApi({ a, operation: 'ln',        expression })
export const calcFactorial = (a, expression) => callApi({ a, operation: 'factorial', expression })

// ── Constantes ───────────────────────────────────────────────────────────────
export const getPI    = () => callApi({ operation: 'pi' })
export const getEuler = () => callApi({ operation: 'euler' })

// ── Historique ───────────────────────────────────────────────────────────────
export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/history`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur historique')
  return data
}

export async function clearHistory() {
  const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Erreur effacement historique')
}

export async function deleteHistoryEntry(id) {
  const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Erreur suppression entrée')
}

// ── Mémoire ──────────────────────────────────────────────────────────────────
export async function memoryRecall() {
  const res = await fetch(`${API_BASE}/memory`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur mémoire')
  return data.value
}

export async function memoryAdd(value) {
  const res = await fetch(`${API_BASE}/memory/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur M+')
  return data.value
}

export async function memorySubtract(value) {
  const res = await fetch(`${API_BASE}/memory/subtract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur M-')
  return data.value
}

export async function memoryClear() {
  const res = await fetch(`${API_BASE}/memory/clear`, { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur MC')
  return data.value
}
