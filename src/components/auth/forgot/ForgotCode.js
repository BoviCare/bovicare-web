import React, { useRef, useState } from 'react';
import { isValidSixDigitCode } from '../../../services/validation';
import './forgot.css';

function ForgotCode({ onConfirm }) {
  const [values, setValues] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputsRef = useRef([]);

  const handleChange = (index, val) => {
    if (!/^\d?$/.test(val)) return;
    const updated = [...values];
    updated[index] = val;
    setValues(updated);
    if (val && index < 5) {
      const next = inputsRef.current[index + 1];
      next && next.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = values.join('');
    if (!isValidSixDigitCode(code)) {
      setError('Código deve conter 6 dígitos');
      return;
    }
    setError('');
    onConfirm && onConfirm(code);
  };

  return (
    <div className="login-container">
      <img src="/logo.svg" alt="Logo" />
      <div className="card forgot-card">
        <h2>Redefina sua senha</h2>
        <span>Insira o código que te enviamos por e-mail</span>
        <form onSubmit={handleSubmit}>
          <div className="code-row">
            {values.map((v, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                inputMode="numeric"
                maxLength={1}
                value={v}
                onChange={(e) => handleChange(i, e.target.value)}
                className="code-input"
              />
            ))}
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Confirmar código</button>
          <p className="muted">Reenviar código em 00:30</p>
        </form>
      </div>
    </div>
  );
}

export default ForgotCode;


