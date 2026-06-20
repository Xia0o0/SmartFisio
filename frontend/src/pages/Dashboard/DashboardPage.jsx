import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout/AppLayout';
import api from '../../services/api';
import './DashboardPage.css';

const categoryImages = {
  'Mobilidade': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  'Fortalecimento': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80',
  'Equilibrio': 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80',
  'Alongamento': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
};

const levelBadge = { 'Fácil': 'badge-easy', 'Médio': 'badge-medium', 'Difícil': 'badge-hard' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('smartfisio_user') || '{}');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.exercises.list().then(data => {
      setExercises(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = exercises.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filter ? ex.category?.name === filter : true;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(exercises.map(e => e.category?.name).filter(Boolean))];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <AppLayout>
      <div className="dashboard-page">
        {/* Greeting */}
        <header className="dashboard-greeting">
          <div>
            <h1>{greeting()}, {user.name?.split(' ')[0] || 'Usuário'}! 👋</h1>
            <p>Pronto para os seus exercícios de hoje? Escolha um item abaixo para começar.</p>
          </div>
          <div className="dashboard-date">
            <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </header>

        {/* Filters */}
        <div className="dashboard-filters">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="search"
              id="search-exercises"
              placeholder="Buscar exercício..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-pills">
            <button
              className={`filter-pill ${!filter ? 'active' : ''}`}
              onClick={() => setFilter('')}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-pill ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Grid */}
        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner-lg" />
            <p>Carregando exercícios...</p>
          </div>
        ) : (
          <div className="exercise-grid">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <p>😕 Nenhum exercício encontrado.</p>
              </div>
            ) : (
              filtered.map(ex => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  image={categoryImages[ex.category?.name] || categoryImages['Mobilidade']}
                  onStart={() => navigate(`/exercise/${ex.id}`)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ExerciseCard({ exercise, image, onStart }) {
  return (
    <article className="exercise-card">
      <div className="exercise-card__img-wrap">
        <img src={image} alt={exercise.name} />
        <div className="exercise-card__img-overlay">
          <span className={`badge ${levelBadge[exercise.level] || 'badge-easy'}`}>
            {exercise.level || 'Fácil'}
          </span>
        </div>
      </div>
      <div className="exercise-card__body">
        <span className="exercise-card__category">{exercise.category?.name}</span>
        <h3 className="exercise-card__title">{exercise.name}</h3>
        <p className="exercise-card__desc">{exercise.description}</p>
        <button
          id={`btn-start-${exercise.id}`}
          className="btn btn-dark btn-block"
          onClick={onStart}
        >
          Iniciar Exercício →
        </button>
      </div>
    </article>
  );
}
