import React, { useState } from 'react';
import { validateForgotPasswordSelection } from '../../../services/validation';
import './forgot.css';

function ForgotSelect({ onSubmit }) {
  const [method, setMethod] = useState('sms');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  const handleConfirm = (e) => {
    e.preventDefault();
    const { isValid, errors: errs } = validateForgotPasswordSelection({ method, email, phone });
    if (!isValid) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSubmit && onSubmit({ method, email, phone });
  };

  return (
    <div className="login-container">
      <img src="/logo.svg" alt="Logo" />
      <div className="card forgot-card">
        <h2>Redefina sua senha</h2>
        <span>Escolha como deseja recuperar o acesso</span>

        <form onSubmit={handleConfirm}>
          <div className="radio-row">
            <label className={`radio ${method === 'email' ? 'active' : ''}`}>
              <input type="radio" name="method" checked={method === 'email'} onChange={() => setMethod('email')} />
              Receber código por e-mail
            </label>
          </div>
          <div className="radio-row">
            <label className={`radio ${method === 'sms' ? 'active' : ''}`}>
              <input type="radio" name="method" checked={method === 'sms'} onChange={() => setMethod('sms')} />
              Receber código por SMS
            </label>
          </div>

          {method === 'email' && (
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          {method === 'sms' && (
            <input
              type="tel"
              placeholder="Digite seu número de telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}

          {(errors.method || errors.email || errors.phone) && (
            <p className="error-text">{errors.method || errors.email || errors.phone}</p>
          )}

          <button type="submit">Confirmar</button>
        </form>
      </div>
    </div>
  );
}

export default ForgotSelect;


