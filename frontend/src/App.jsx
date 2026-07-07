import { useState } from 'react'
import { calculate } from './api'

// Correspondance entre le symbole affiché et l'opération envoyée au backend
const OPERATIONS = {
  '+': 'add',
  '-': 'subtract',
  '×': 'multiply',
  '÷': 'divide',
}

export default function App() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [waitingForNext, setWaitingForNext] = useState(false)
  const [error, setError] = useState(null)

  function inputDigit(digit) {
    setError(null)
    if (waitingForNext) {
      setDisplay(digit)
      setWaitingForNext(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  function inputDecimal() {
    setError(null)
    if (waitingForNext) {
      setDisplay('0.')
      setWaitingForNext(false)
      return
    }
    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  function clearAll() {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNext(false)
    setError(null)
  }

  function toggleSign() {
    setDisplay((parseFloat(display) * -1).toString())
  }

  async function performCalculation(a, b, op) {
    try {
      const result = await calculate(a, b, op)
      return result
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function handleOperation(nextOperation) {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation && !waitingForNext) {
      const result = await performCalculation(previousValue, inputValue, OPERATIONS[operation])
      if (result === null) return // erreur déjà affichée
      setDisplay(String(result))
      setPreviousValue(result)
    }

    setWaitingForNext(true)
    setOperation(nextOperation)
  }

  async function handleEquals() {
    if (operation === null || previousValue === null) return
    const inputValue = parseFloat(display)
    const result = await performCalculation(previousValue, inputValue, OPERATIONS[operation])
    if (result === null) return
    setDisplay(String(result))
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNext(false)
  }

  return (
    <div className="calculator">
      <div className="screen">
        <div className="expression">
          {previousValue !== null ? `${previousValue} ${operation ?? ''}` : ''}
        </div>
        <div className="result">{error ? 'Erreur' : display}</div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="keys">
        <button className="key key-function" onClick={clearAll}>AC</button>
        <button className="key key-function" onClick={toggleSign}>±</button>
        <button className="key key-function" onClick={() => {}}>%</button>
        <button className="key key-operator" onClick={() => handleOperation('÷')}>÷</button>

        <button className="key" onClick={() => inputDigit('7')}>7</button>
        <button className="key" onClick={() => inputDigit('8')}>8</button>
        <button className="key" onClick={() => inputDigit('9')}>9</button>
        <button className="key key-operator" onClick={() => handleOperation('×')}>×</button>

        <button className="key" onClick={() => inputDigit('4')}>4</button>
        <button className="key" onClick={() => inputDigit('5')}>5</button>
        <button className="key" onClick={() => inputDigit('6')}>6</button>
        <button className="key key-operator" onClick={() => handleOperation('-')}>-</button>

        <button className="key" onClick={() => inputDigit('1')}>1</button>
        <button className="key" onClick={() => inputDigit('2')}>2</button>
        <button className="key" onClick={() => inputDigit('3')}>3</button>
        <button className="key key-operator" onClick={() => handleOperation('+')}>+</button>

        <button className="key key-zero" onClick={() => inputDigit('0')}>0</button>
        <button className="key" onClick={inputDecimal}>.</button>
        <button className="key key-operator key-equals" onClick={handleEquals}>=</button>
      </div>
    </div>
  )
}
