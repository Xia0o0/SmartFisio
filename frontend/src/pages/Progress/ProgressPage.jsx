import { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import AppLayout from '../../components/AppLayout/AppLayout';
import api from '../../services/api';
import './ProgressPage.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatDuration(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}min ${sec}s` : `${sec}s`;
}

export default function ProgressPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sessions.history().then(data => {
      setHistory(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalSessions = history.length;
  const totalReps = history.reduce((acc, s) => acc + (s.repetitions || 0), 0);
  const totalTime = history.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

  // Build chart data (last 7 sessions)
  const last7 = [...history].reverse().slice(0, 7);
  const chartData = {
    labels: last7.map(s => formatDate(s.started_at)),
    datasets: [
      {
        label: 'Repetições',
        data: last7.map(s => s.repetitions || 0),
        fill: true,
        borderColor: '#4CAF82',
        backgroundColor: 'rgba(76, 175, 130, 0.12)',
        borderWidth: 4,
        pointBackgroundColor: '#4CAF82',
        pointRadius: 8,
        pointHoverRadius: 10,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1A1A1A',
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.7)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
        ticks: { color: '#9CA3AF', font: { family: 'Outfit', size: 13 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9CA3AF', font: { family: 'Outfit', size: 13 } },
      },
    },
  };

  const summaryCards = [
    { icon: '🏆', label: 'Sessões Concluídas', value: `${totalSessions}` },
    { icon: '🔄', label: 'Repetições Totais', value: `${totalReps}` },
    { icon: '⏱️', label: 'Tempo Praticado', value: formatDuration(totalTime) },
  ];

  return (
    <AppLayout>
      <div className="progress-page">
        <header className="progress-header">
          <div>
            <h1>Meu Progresso</h1>
            <p>Acompanhe sua evolução e comemore cada conquista!</p>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="summary-grid">
          {summaryCards.map((card, i) => (
            <div key={i} className="summary-card">
              <div className="summary-card__icon">{card.icon}</div>
              <div>
                <p className="summary-card__label">{card.label}</p>
                <h3 className="summary-card__value">{card.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="chart-section">
          <div className="chart-section__header">
            <h3>Evolução de Repetições</h3>
            <p>Últimas {last7.length} sessões realizadas</p>
          </div>
          <div className="chart-wrap">
            {last7.length > 0
              ? <Line data={chartData} options={chartOptions} />
              : <div className="chart-empty">Realize ao menos uma sessão para ver o gráfico 📈</div>
            }
          </div>
        </div>

        {/* Timeline */}
        <div className="history-section">
          <h3>Histórico de Sessões</h3>
          {loading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner-lg" />
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p>😊 Você ainda não realizou nenhuma sessão. Comece agora!</p>
            </div>
          ) : (
            <div className="timeline" id="timeline-list">
              {history.map((session, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-item__dot" />
                  <div className="timeline-item__content">
                    <div className="timeline-item__header">
                      <span className="badge badge-success">✓ Concluído</span>
                      <span className="timeline-date">{new Date(session.started_at).toLocaleDateString('pt-BR', {
                        weekday: 'long', day: '2-digit', month: 'long'
                      })}</span>
                    </div>
                    <h4>{session.exercise?.name || 'Exercício'}</h4>
                    <div className="timeline-item__stats">
                      <span>🔄 {session.repetitions} repetições</span>
                      <span>⏱ {formatDuration(session.duration_seconds || 0)}</span>
                      {session.average_angle && (
                        <span>📐 Ângulo médio: {Math.round(session.average_angle)}°</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
