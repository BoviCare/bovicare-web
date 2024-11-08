import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../../services/api';
import './login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Referências para os campos de email e senha
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const navigate = useNavigate();

  console.log("Login component renderizado");

  // Focar no campo de email quando o componente for montado
  useEffect(() => {
    emailRef.current && emailRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser({ email, password });
      navigate('/home');
    } catch (err) {
      setError('Credenciais incorretas');
      // Focar no campo de email após erro (exemplo de uso de ref)
      emailRef.current && emailRef.current.focus();
    }
  };

  return (
    <div className="login-container">
        <img src="/logo.svg" alt="Logo"/>
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
            ref={emailRef} // Atribuindo a referência ao campo de email
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            ref={passwordRef} // Atribuindo a referência ao campo de senha
          />
          <button type="submit">Entrar</button>
        </form>
        {error && <p>{error}</p>}
        <p>Não tem um cadastro? <a href="/registro">Cadastre-se agora</a></p>
      </div>
    </div>
  );
}

export default Login;
