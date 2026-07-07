import { useState, useEffect, useCallback } from 'react'
import {
  calculate, calculatePercent, calculatePow, toggleSign,
  calcSqrt, calcSquare, calcInverse,
  calcSin, calcCos, calcTan,
  calcLog, calcLn, calcFactorial,
  getPI, getEuler,
  fetchHistory, clearHistory, deleteHistoryEntry,
  memoryRecall, memoryAdd, memorySubtract, memoryClear,
} from './api'

const OP_MAP = { '+': 'add', '-': 'subtract', '×': 'multiply', '÷': 'divide' }
const MAX_DIGITS = 12

export default function App() {
  // ── État principal ────────────────────────────────────────────────────────
  const [display, setDisplay]               = useState('0')
  const [expression, setExpression]         = useState('')
  const [previousValue, setPreviousValue]   = useState(null)
  const [operation, setOperation]           = useState(null)
  const [waitingForNext, setWaitingForNext] = useState(false)
  const [error, setError]                   = useState(null)

  // ── Mode scientifique ─────────────────────────────────────────────────────
  const [sciMode, setSciMode]               = useState(false)

  // ── Parenthèses ───────────────────────────────────────────────────────────
  const [parenExpr, setParenExpr]           = useState('')
  const [openParens, setOpenParens]         = useState(0)

  // ── Historique ────────────────────────────────────────────────────────────
  const [showHistory, setShowHistory]       = useState(false)
  const [history, setHistory]               = useState([])

  // ── Mémoire ───────────────────────────────────────────────────────────────
  const [memValue, setMemValue]             = useState(0)
  const [memActive, setMemActive]           = useState(false) // indicateur M

  // ── Thème ─────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode]             = useState(true)

  // Appliquer le thème sur <body>
  useEffect(() => {
    document.body.dataset.theme = darkMode ? 'dark' : 'light'
  }, [darkMode])

  // Charger l'historique à l'ouverture du panneau
  useEffect(() => {
    if (showHistory) loadHistory()
  }, [showHistory])

  async function loadHistory() {
    try {
      const data = await fetchHistory()
      setHistory(data)
    } catch { /* silencieux */ }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function safeDisplay(value) {
    const str = String(value)
    const digits = str.replace(/[-+.eE]/g, '')
    if (digits.length > MAX_DIGITS) return parseFloat(value).toExponential(6)
    return str
  }

  function clearError() { setError(null) }

  // ── Saisie ────────────────────────────────────────────────────────────────
  function inputDigit(digit) {
    clearError()
    if (waitingForNext) { setDisplay(digit); setWaitingForNext(false); return }
    const currentDigits = display.replace(/[-+.]/g, '').length
    if (currentDigits >= MAX_DIGITS) return
    setDisplay(display === '0' ? digit : display + digit)
  }

  function inputDecimal() {
    clearError()
    if (waitingForNext) { setDisplay('0.'); setWaitingForNext(false); return }
    if (!display.includes('.')) setDisplay(display + '.')
  }

  function handleBackspace() {
    clearError()
    if (waitingForNext) return
    if (display.length <= 1 || (display.startsWith('-') && display.length <= 2)) {
      setDisplay('0'); return
    }
    setDisplay(display.slice(0, -1))
  }

  function clearAll() {
    setDisplay('0'); setExpression(''); setPreviousValue(null)
    setOperation(null); setWaitingForNext(false); setError(null)
    setParenExpr(''); setOpenParens(0)
  }

  // ── ± / % ─────────────────────────────────────────────────────────────────
  async function handleToggleSign() {
    clearError()
    try {
      const result = await toggleSign(parseFloat(display))
      setDisplay(safeDisplay(result))
    } catch (err) { setError(err.message) }
  }

  async function handlePercent() {
    clearError()
    const current = parseFloat(display)
    try {
      const result = previousValue !== null && operation
        ? await calculatePercent(current, previousValue)
        : await calculatePercent(current, 1)
      setDisplay(safeDisplay(result)); setWaitingForNext(true)
    } catch (err) { setError(err.message) }
  }

  // ── Opérations binaires ───────────────────────────────────────────────────
  async function performCalculation(a, b, op, expr) {
    try { return await calculate(a, b, op, expr) }
    catch (err) { setError(err.message); return null }
  }

  async function handleOperation(nextOperation) {
    clearError()
    const inputValue = parseFloat(display)
    if (previousValue === null) {
      setPreviousValue(inputValue)
      setExpression(`${safeDisplay(inputValue)} ${nextOperation}`)
    } else if (operation && !waitingForNext) {
      const expr = `${safeDisplay(previousValue)} ${operation} ${safeDisplay(inputValue)}`
      const result = await performCalculation(previousValue, inputValue, OP_MAP[operation], expr)
      if (result === null) return
      const displayed = safeDisplay(result)
      setDisplay(displayed); setPreviousValue(result)
      setExpression(`${displayed} ${nextOperation}`)
    } else {
      setExpression(`${safeDisplay(previousValue)} ${nextOperation}`)
    }
    setWaitingForNext(true); setOperation(nextOperation)
  }

  async function handleEquals() {
    if (operation === '^^') { await handleEqualsXY(); return }
    if (operation === null || previousValue === null) return
    clearError()
    const inputValue = parseFloat(display)
    const expr = `${safeDisplay(previousValue)} ${operation} ${safeDisplay(inputValue)}`
    const result = await performCalculation(previousValue, inputValue, OP_MAP[operation], expr)
    if (result === null) return
    setExpression(`${expr} =`)
    setDisplay(safeDisplay(result))
    setPreviousValue(null); setOperation(null); setWaitingForNext(false)
    if (showHistory) loadHistory()
  }

  // ── Puissance xʸ ──────────────────────────────────────────────────────────
  function handlePow() {
    clearError()
    const inputValue = parseFloat(display)
    setPreviousValue(inputValue)
    setExpression(`${safeDisplay(inputValue)} ^`)
    setOperation('^^'); setWaitingForNext(true)
  }

  async function handleEqualsXY() {
    if (previousValue === null) return
    clearError()
    const b = parseFloat(display)
    const expr = `${safeDisplay(previousValue)} ^ ${safeDisplay(b)}`
    try {
      const result = await calculatePow(previousValue, b, expr)
      setExpression(`${expr} =`)
      setDisplay(safeDisplay(result))
      setPreviousValue(null); setOperation(null); setWaitingForNext(false)
      if (showHistory) loadHistory()
    } catch (err) { setError(err.message) }
  }

  // ── Fonctions unaires ─────────────────────────────────────────────────────
  async function applyUnary(fn, label) {
    clearError()
    const a = parseFloat(display)
    const expr = `${label}(${a})`
    try {
      const result = await fn(a, expr)
      setExpression(`${expr} =`)
      setDisplay(safeDisplay(result)); setWaitingForNext(true)
      if (showHistory) loadHistory()
    } catch (err) { setError(err.message) }
  }

  // ── Constantes ────────────────────────────────────────────────────────────
  async function handleConstant(fn, label) {
    clearError()
    try {
      const result = await fn()
      setDisplay(safeDisplay(result)); setExpression(label); setWaitingForNext(true)
    } catch (err) { setError(err.message) }
  }

  // ── Parenthèses ───────────────────────────────────────────────────────────
  function handleOpenParen() {
    clearError()
    const newExpr = parenExpr
      ? `${parenExpr} (`
      : `${display === '0' ? '' : display + ' '}(`
    setParenExpr(newExpr); setOpenParens(openParens + 1)
    setExpression(newExpr); setDisplay('0'); setWaitingForNext(false)
  }

  async function handleCloseParen() {
    if (openParens === 0) return
    clearError()
    const newExpr = `${parenExpr} ${display} )`
    const newOpen = openParens - 1
    setParenExpr(newOpen > 0 ? newExpr : ''); setOpenParens(newOpen)
    setExpression(newExpr)
    try {
      const inner = extractInnerExpr(newExpr)
      if (inner !== null) {
        const result = evaluateSimple(inner)
        setDisplay(safeDisplay(result)); setWaitingForNext(true)
      }
    } catch { /* laisse l'affichage en l'état */ }
  }

  function extractInnerExpr(expr) {
    const lastOpen = expr.lastIndexOf('(')
    const lastClose = expr.lastIndexOf(')')
    if (lastOpen === -1) return null
    return expr.substring(lastOpen + 1, lastClose).trim()
  }

  function evaluateSimple(expr) {
    const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/[^0-9+\-*/.eE()]/g, '')
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${sanitized})`)()
  }

  // ── Mémoire ───────────────────────────────────────────────────────────────
  async function handleMemoryAdd() {
    try {
      const val = await memoryAdd(parseFloat(display))
      setMemValue(val); setMemActive(val !== 0)
    } catch (err) { setError(err.message) }
  }

  async function handleMemorySubtract() {
    try {
      const val = await memorySubtract(parseFloat(display))
      setMemValue(val); setMemActive(val !== 0)
    } catch (err) { setError(err.message) }
  }

  async function handleMemoryRecall() {
    try {
      const val = await memoryRecall()
      setDisplay(safeDisplay(val)); setWaitingForNext(true)
    } catch (err) { setError(err.message) }
  }

  async function handleMemoryClear() {
    try {
      await memoryClear()
      setMemValue(0); setMemActive(false)
    } catch (err) { setError(err.message) }
  }

  // ── Historique ────────────────────────────────────────────────────────────
  async function handleClearHistory() {
    try { await clearHistory(); setHistory([]) } catch { /* silencieux */ }
  }

  async function handleDeleteEntry(id) {
    try {
      await deleteHistoryEntry(id)
      setHistory(history.filter(e => e.id !== id))
    } catch { /* silencieux */ }
  }

  function handleHistoryClick(entry) {
    setDisplay(safeDisplay(entry.result))
    setWaitingForNext(true)
    setShowHistory(false)
  }

  // ── Clavier physique ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    const { key } = e
    if (key === ' ') { e.preventDefault(); return }
    if (key >= '0' && key <= '9')      { e.preventDefault(); inputDigit(key) }
    else if (key === '.')              { e.preventDefault(); inputDecimal() }
    else if (key === '+')              { e.preventDefault(); handleOperation('+') }
    else if (key === '-')              { e.preventDefault(); handleOperation('-') }
    else if (key === '*')              { e.preventDefault(); handleOperation('×') }
    else if (key === '/')              { e.preventDefault(); handleOperation('÷') }
    else if (key === '^')              { e.preventDefault(); handlePow() }
    else if (key === 'Enter' || key === '=') { e.preventDefault(); handleEquals() }
    else if (key === 'Escape')         { e.preventDefault(); clearAll() }
    else if (key === 'Backspace')      { e.preventDefault(); handleBackspace() }
    else if (key === '%')              { e.preventDefault(); handlePercent() }
    else if (key === '(')              { e.preventDefault(); handleOpenParen() }
    else if (key === ')')              { e.preventDefault(); handleCloseParen() }
    else if (key === 's')              { e.preventDefault(); applyUnary(calcSin, 'sin') }
    else if (key === 'c')              { e.preventDefault(); applyUnary(calcCos, 'cos') }
    else if (key === 't')              { e.preventDefault(); applyUnary(calcTan, 'tan') }
    else if (key === 'r')              { e.preventDefault(); applyUnary(calcSqrt, '√') }
    else if (key === 'l')              { e.preventDefault(); applyUnary(calcLog, 'log') }
    else if (key === 'n')              { e.preventDefault(); applyUnary(calcLn, 'ln') }
    else if (key === '!')              { e.preventDefault(); applyUnary(calcFactorial, 'n!') }
    else if (key === 'h')              { e.preventDefault(); setShowHistory(v => !v) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display, previousValue, operation, waitingForNext, parenExpr, openParens, showHistory])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const isOpActive = (op) => operation === op && waitingForNext

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className={`app-wrapper${darkMode ? '' : ' app-wrapper--light'}`}>
      <div className={`calculator${sciMode ? ' calculator--sci' : ''}`}>

        {/* Barre d'outils */}
        <div className="toolbar">
          <button
            className={`toolbar-btn${showHistory ? ' toolbar-btn--active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="Historique (H)"
          >🕐</button>

          <button
            className="toolbar-btn sci-toggle"
            onClick={() => setSciMode(!sciMode)}
            title="Mode scientifique"
          >{sciMode ? 'Basique' : 'Sci'}</button>

          <button
            className="toolbar-btn theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title="Thème clair/sombre"
          >{darkMode ? '☀️' : '🌙'}</button>
        </div>

        {/* Panneau historique */}
        {showHistory && (
          <div className="history-panel">
            <div className="history-header">
              <span>Historique</span>
              <button className="history-clear-btn" onClick={handleClearHistory}>Tout effacer</button>
            </div>
            {history.length === 0
              ? <div className="history-empty">Aucun calcul enregistré</div>
              : <ul className="history-list">
                  {history.map(entry => (
                    <li key={entry.id} className="history-item">
                      <button
                        className="history-item-btn"
                        onClick={() => handleHistoryClick(entry)}
                        title="Cliquer pour réutiliser"
                      >
                        <span className="history-expr">{entry.expression}</span>
                        <span className="history-result">= {entry.result}</span>
                      </button>
                      <button
                        className="history-delete-btn"
                        onClick={() => handleDeleteEntry(entry.id)}
                        title="Supprimer"
                      >✕</button>
                    </li>
                  ))}
                </ul>
            }
          </div>
        )}

        {/* Écran */}
        <div className="screen">
          <div className="screen-top">
            {memActive && <span className="mem-indicator">M</span>}
          </div>
          <div className="expression">
            {openParens > 0 ? `${'('.repeat(openParens)} ${expression}` : expression}
          </div>
          <div className={`result${error ? ' result--error' : ''}`}>
            {error ? 'Erreur' : display}
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Touches mémoire */}
        <div className="keys keys--memory">
          <button className="key key-mem" onClick={handleMemoryClear}>MC</button>
          <button className="key key-mem" onClick={handleMemoryRecall}>MR</button>
          <button className="key key-mem" onClick={handleMemoryAdd}>M+</button>
          <button className="key key-mem" onClick={handleMemorySubtract}>M-</button>
        </div>

        {/* Panneau scientifique */}
        {sciMode && (
          <div className="keys keys--sci">
            <button className="key key-sci" onClick={() => applyUnary(calcSin, 'sin')}>sin</button>
            <button className="key key-sci" onClick={() => applyUnary(calcCos, 'cos')}>cos</button>
            <button className="key key-sci" onClick={() => applyUnary(calcTan, 'tan')}>tan</button>
            <button className="key key-sci" onClick={() => applyUnary(calcLog, 'log')}>log</button>
            <button className="key key-sci" onClick={() => applyUnary(calcLn, 'ln')}>ln</button>

            <button className="key key-sci" onClick={() => applyUnary(calcSqrt, '√')}>√</button>
            <button className="key key-sci" onClick={() => applyUnary(calcSquare, 'x²')}>x²</button>
            <button className="key key-sci" onClick={handlePow}>xʸ</button>
            <button className="key key-sci" onClick={() => applyUnary(calcInverse, '1/x')}>1/x</button>
            <button className="key key-sci" onClick={() => applyUnary(calcFactorial, 'n!')}>n!</button>

            <button className="key key-sci" onClick={handleOpenParen}>(</button>
            <button className="key key-sci" onClick={handleCloseParen}>)</button>
            <button className="key key-sci" onClick={() => handleConstant(getPI, 'π')}>π</button>
            <button className="key key-sci" onClick={() => handleConstant(getEuler, 'e')}>e</button>
            <button className="key key-sci key-sci--empty"></button>
          </div>
        )}

        {/* Touches standard */}
        <div className="keys">
          <button className="key key-function" onClick={clearAll}>AC</button>
          <button className="key key-function" onClick={handleToggleSign}>±</button>
          <button className="key key-function" onClick={handlePercent}>%</button>
          <button className={`key key-operator${isOpActive('÷') ? ' key-operator--active' : ''}`}
            onClick={() => handleOperation('÷')}>÷</button>

          <button className="key" onClick={() => inputDigit('7')}>7</button>
          <button className="key" onClick={() => inputDigit('8')}>8</button>
          <button className="key" onClick={() => inputDigit('9')}>9</button>
          <button className={`key key-operator${isOpActive('×') ? ' key-operator--active' : ''}`}
            onClick={() => handleOperation('×')}>×</button>

          <button className="key" onClick={() => inputDigit('4')}>4</button>
          <button className="key" onClick={() => inputDigit('5')}>5</button>
          <button className="key" onClick={() => inputDigit('6')}>6</button>
          <button className={`key key-operator${isOpActive('-') ? ' key-operator--active' : ''}`}
            onClick={() => handleOperation('-')}>-</button>

          <button className="key" onClick={() => inputDigit('1')}>1</button>
          <button className="key" onClick={() => inputDigit('2')}>2</button>
          <button className="key" onClick={() => inputDigit('3')}>3</button>
          <button className={`key key-operator${isOpActive('+') ? ' key-operator--active' : ''}`}
            onClick={() => handleOperation('+')}>+</button>

          <button className="key key-zero" onClick={() => inputDigit('0')}>0</button>
          <button className="key" onClick={inputDecimal}>.</button>
          <button className="key key-backspace" onClick={handleBackspace}>⌫</button>
          <button className="key key-operator key-equals" onClick={handleEquals}>=</button>
        </div>

        <div className="keyboard-hint">
          {sciMode
            ? 's c t r l n ! ^ ( )  |  H = historique'
            : 'Clavier physique supporté  |  H = historique'}
        </div>
      </div>
    </div>
  )
}
