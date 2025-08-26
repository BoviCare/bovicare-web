import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../../services/api';
import './login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const emailRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current && emailRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica se os campos estão preenchidos
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    try {
      await loginUser({ email, password });
      navigate('/home');
    } catch (err) {
      setError('Credenciais incorretas');
      emailRef.current && emailRef.current.focus();
    }
  };

  return (
    <div className="login-container">
      <img src="/logo.svg" alt="Logo" />
      <div className="card">
        <h2>Entre na sua conta</h2>
        <span>Preencha os campos abaixo</span>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            ref={emailRef}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Entrar</button>
        </form>
        <p>
          <a href="/esqueci-senha">Esqueceu sua senha?</a>
        </p>
        {error && <p>{error}</p>}
      </div>
    </div>
  );
}

export default Login;
