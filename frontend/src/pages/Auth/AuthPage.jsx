import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AuthPage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Login state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register state
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: 'IDOSO' });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegisterPass, setShowRegisterPass] = useState(false);

  const handleLoginChange = (e) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  const handleRegisterChange = (e) => setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = await api.auth.login(loginForm.email, loginForm.password);
      localStorage.setItem('smartfisio_token', data.access_token);
      const user = await api.auth.me();
      localStorage.setItem('smartfisio_user', JSON.stringify(user));
      navigate(user.role === 'FISIOTERAPEUTA' ? '/therapist' : '/dashboard');
    } catch (err) {
      setLoginError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    if (registerForm.password.length < 6) {
      setRegisterError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setRegisterLoading(true);
    try {
      await api.auth.register(registerForm);
      const data = await api.auth.login(registerForm.email, registerForm.password);
      localStorage.setItem('smartfisio_token', data.access_token);
      const user = await api.auth.me();
      localStorage.setItem('smartfisio_user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setRegisterError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background decorativo */}
      <div className="auth-bg">
        <div className="auth-bg__blob auth-bg__blob--1" />
        <div className="auth-bg__blob auth-bg__blob--2" />
      </div>

      <div className="auth-container">
        {/* Lado da Marca */}
        <div className="auth-brand">
          <div className="auth-logo">Smart<span>Fisio</span></div>
          <div className="auth-brand__content">
            <img
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80"
              alt="Fisioterapia para idosos"
              className="auth-brand__img"
            />
            <div className="auth-brand__quote">
              <p>"A regularidade é o segredo de uma vida física saudável e ativa na terceira idade."</p>
              <span>— SmartFisio</span>
            </div>
          </div>
        </div>

        {/* Lado do Formulário */}
        <div className="auth-form-side">
          <div className="auth-card">
            <div className="auth-card__header">
              <h1 className="auth-card__logo">Smart<span>Fisio</span></h1>
              <p className="auth-card__tagline">Fisioterapia inteligente para a terceira idade</p>
            </div>

            {/* Tabs de navegação */}
            <div className="auth-tabs">
              <button
                id="tab-login"
                className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`}
                onClick={() => { setTab('login'); setLoginError(''); setRegisterError(''); }}
              >
                Entrar
              </button>
              <button
                id="tab-register"
                className={`auth-tab ${tab === 'register' ? 'auth-tab--active' : ''}`}
                onClick={() => { setTab('register'); setLoginError(''); setRegisterError(''); }}
              >
                Cadastrar
              </button>
            </div>

            {/* Painel de Login */}
            {tab === 'login' && (
              <div className="auth-panel">
                <div className="auth-panel__header">
                  <h2>Bem-vindo de volta!</h2>
                  <p>Continue sua jornada de saúde.</p>
                </div>

                {loginError && (
                  <div className="auth-error">
                    <span>⚠️</span> {loginError}
                  </div>
                )}

                <form id="login-form" onSubmit={handleLogin} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="login-email">E-mail</label>
                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      placeholder="nome@exemplo.com"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="login-password">Senha</label>
                    <div className="input-password-wrap">
                      <input
                        id="login-password"
                        type={showLoginPass ? 'text' : 'password'}
                        name="password"
                        placeholder="Sua senha"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="input-password-toggle"
                        onClick={() => setShowLoginPass(!showLoginPass)}
                        aria-label={showLoginPass ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showLoginPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-login-submit"
                    type="submit"
                    className="btn btn-dark btn-block btn-lg"
                    disabled={loginLoading}
                  >
                    {loginLoading ? <span className="loading-spinner" /> : 'Entrar na Conta'}
                  </button>
                </form>

                <p className="auth-footer-link">
                  Não tem uma conta?{' '}
                  <button className="auth-link-btn" onClick={() => setTab('register')}>
                    Cadastre-se gratuitamente
                  </button>
                </p>
              </div>
            )}

            {/* Painel de Cadastro */}
            {tab === 'register' && (
              <div className="auth-panel">
                <div className="auth-panel__header">
                  <h2>Criar Conta Gratuita</h2>
                  <p>Comece hoje sua jornada supervisionada por IA.</p>
                </div>

                {registerError && (
                  <div className="auth-error">
                    <span>⚠️</span> {registerError}
                  </div>
                )}

                <form id="register-form" onSubmit={handleRegister} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="reg-name">Nome Completo</label>
                    <input
                      id="reg-name"
                      type="text"
                      name="name"
                      placeholder="Seu nome completo"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      required
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-email">E-mail</label>
                    <input
                      id="reg-email"
                      type="email"
                      name="email"
                      placeholder="nome@exemplo.com"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-password">Senha</label>
                    <div className="input-password-wrap">
                      <input
                        id="reg-password"
                        type={showRegisterPass ? 'text' : 'password'}
                        name="password"
                        placeholder="Mínimo 6 caracteres"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        required
                        autoComplete="new-password"
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="input-password-toggle"
                        onClick={() => setShowRegisterPass(!showRegisterPass)}
                        aria-label={showRegisterPass ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showRegisterPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-role">Tipo de Conta</label>
                    <select
                      id="reg-role"
                      name="role"
                      value={registerForm.role}
                      onChange={handleRegisterChange}
                    >
                      <option value="IDOSO">Sou Paciente / Idoso</option>
                      <option value="FISIOTERAPEUTA">Sou Fisioterapeuta</option>
                    </select>
                  </div>

                  <button
                    id="btn-register-submit"
                    type="submit"
                    className="btn btn-dark btn-block btn-lg"
                    disabled={registerLoading}
                  >
                    {registerLoading ? <span className="loading-spinner" /> : 'Criar Conta'}
                  </button>
                </form>

                <p className="auth-footer-link">
                  Já tem uma conta?{' '}
                  <button className="auth-link-btn" onClick={() => setTab('login')}>
                    Entrar agora
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
