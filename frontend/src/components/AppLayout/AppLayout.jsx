import { Link, useNavigate, useLocation } from 'react-router-dom';
import './AppLayout.css';

const navItems = [
  { to: '/dashboard', icon: '🏋️', label: 'Exercícios' },
  { to: '/progress', icon: '📈', label: 'Meu Progresso' },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('smartfisio_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('smartfisio_token');
    localStorage.removeItem('smartfisio_user');
    navigate('/');
  };

  const isTherapist = user.role === 'FISIOTERAPEUTA';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__top">
          <Link to="/dashboard" className="sidebar__logo">
            Smart<span>Fisio</span>
          </Link>

          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {user.name ? user.name[0].toUpperCase() : '?'}
            </div>
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{user.name || 'Usuário'}</p>
              <p className="sidebar__user-role">{isTherapist ? 'Fisioterapeuta' : 'Paciente'}</p>
            </div>
          </div>

          <nav className="sidebar__nav">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar__nav-item ${location.pathname === item.to ? 'active' : ''}`}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            {isTherapist && (
              <Link
                to="/therapist"
                className={`sidebar__nav-item ${location.pathname === '/therapist' ? 'active' : ''}`}
              >
                <span className="sidebar__nav-icon">👥</span>
                Meus Pacientes
              </Link>
            )}
          </nav>
        </div>

        <button id="btn-logout" className="sidebar__logout" onClick={handleLogout}>
          <span>🚪</span> Sair
        </button>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
