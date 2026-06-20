import { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout/AppLayout';
import api from '../../services/api';
import './TherapistPage.css';

export default function TherapistPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.users.patients().then(data => {
      setPatients(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const mobilityLabel = {
    'BASICO': { label: 'Básico', badge: 'badge-easy' },
    'INTERMEDIARIO': { label: 'Intermediário', badge: 'badge-warning' },
    'AVANCADO': { label: 'Avançado', badge: 'badge-danger' },
  };

  return (
    <AppLayout>
      <div className="therapist-page">
        <header className="therapist-header">
          <div>
            <h1>Painel de Pacientes</h1>
            <p>Acompanhe a evolução e aderência dos seus pacientes cadastrados.</p>
          </div>
          <div className="therapist-stat-badge">
            <span className="badge badge-dark">{patients.length} pacientes</span>
          </div>
        </header>

        {/* Stats Row */}
        <div className="therapist-stats">
          <div className="therapist-stat-card">
            <h4>{patients.length}</h4>
            <p>Total de Pacientes</p>
          </div>
          <div className="therapist-stat-card">
            <h4>{patients.filter(p => p.mobility_level === 'BASICO').length}</h4>
            <p>Nível Básico</p>
          </div>
          <div className="therapist-stat-card">
            <h4>{patients.filter(p => p.mobility_level === 'INTERMEDIARIO').length}</h4>
            <p>Nível Intermediário</p>
          </div>
          <div className="therapist-stat-card">
            <h4>{patients.filter(p => p.mobility_level === 'AVANCADO').length}</h4>
            <p>Nível Avançado</p>
          </div>
        </div>

        {/* Search */}
        <div className="therapist-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="search-patients"
            type="search"
            className="search-input"
            placeholder="Buscar paciente pelo nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Patients Table */}
        <div className="patients-table-wrap">
          {loading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner-lg" />
              <p>Carregando pacientes...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p>👥 Nenhum paciente encontrado.</p>
            </div>
          ) : (
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Nível de Mobilidade</th>
                  <th>Cadastrado em</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="patients-list-tbody">
                {filtered.map(patient => {
                  const level = mobilityLabel[patient.mobility_level] || { label: 'Não definido', badge: 'badge-warning' };
                  return (
                    <tr key={patient.id} className="patient-row">
                      <td>
                        <div className="patient-identity">
                          <div className="patient-avatar-initial">
                            {patient.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <strong>{patient.name}</strong>
                            <p>{patient.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${level.badge}`}>{level.label}</span>
                      </td>
                      <td className="patient-date">
                        {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <span className="badge badge-success">Ativo</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
