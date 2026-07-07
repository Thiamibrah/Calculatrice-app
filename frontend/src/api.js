/**
 * Appelle l'API Flask pour effectuer un calcul.
 * Sépare la logique réseau du composant React (plus facile à tester/maintenir).
 */
export async function calculate(a, b, operation) {
  const response = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a, b, operation }),
  })

  const data = await response.json()

  if (!response.ok) {
    // Le backend renvoie {"error": "..."} avec un code 4xx
    throw new Error(data.error || 'Erreur inconnue')
  }

  return data.result
}
