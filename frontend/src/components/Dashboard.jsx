import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../index.css';

function Dashboard() {
    const navigate = useNavigate();
    const [recentLeituras, setRecentLeituras] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const [leiturasRes, statsRes] = await Promise.all([
                api.get('/leituras/recentes'),
                api.get('/financeiro/stats')
            ]);
            setRecentLeituras(leiturasRes.data);
            setStats(statsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar dados do dashboard:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const userJSON = localStorage.getItem('user');
    let user = null;
    try {
        user = userJSON ? JSON.parse(userJSON) : null;
    } catch (e) {
        user = null;
    }
    const isPaciente = user?.role === 'paciente' || !user;
    const isUsuario = user?.role === 'usuario';
    const isAdminOrMaster = user?.role === 'admin' || user?.role === 'master';

    return (
        <div className="dashboard-container">
            <div className="dashboard-grid">
                {/* Todos exceto pacientes podem gerenciar pacientes */}
                {!isPaciente && (
                    <div className="action-card" onClick={() => navigate('/pacientes')}>
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                        </div>
                        <h3 className="card-title">Gerenciar Pacientes</h3>
                        <p className="card-desc">Cadastro, edição e listagem de pacientes.</p>
                    </div>
                )}

                {/* Apenas Admin e Master monitoram */}
                {isAdminOrMaster && (
                    <div className="action-card" onClick={() => navigate('/monitoramento')}>
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8" /><path d="M8 13h6" /></svg>
                        </div>
                        <h3 className="card-title">Monitorar Pacientes</h3>
                        <p className="card-desc">Análise de histórico e alertas de risco.</p>
                    </div>
                )}

                {/* Apenas Admin e Master veem financeiro */}
                {isAdminOrMaster && (
                    <div className="action-card" onClick={() => navigate('/financeiro')}>
                        <div className="card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 className="card-title">Financeiro</h3>
                                <p className="card-desc">Receitas e boletos.</p>
                            </div>
                            {stats && (
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', color: '#16a34a' }}>
                                        R$ {stats.receitaProjetada.toFixed(0)}
                                    </span>
                                    <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Proj. Mensal</small>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isPaciente && (
                    <div className="action-card" style={{ cursor: 'default' }}>
                        <div className="card-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                        </div>
                        <h3 className="card-title">Seu Monitoramento</h3>
                        <p className="card-desc">Visualize suas métricas e histórico de saúde.</p>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="header" style={{ marginBottom: '1.5rem' }}>
                    <h2 className="title" style={{ fontSize: '1.25rem' }}>Últimos 10 Registros</h2>
                    <span className="status-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Tempo Real</span>
                </div>

                {loading ? <p>Carregando registros...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Paciente</th>
                                    <th>Data/Hora</th>
                                    <th>P. Arterial</th>
                                    <th>Temp.</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeituras.map((leitura) => (
                                    <tr key={leitura.id}>
                                        <td style={{ fontWeight: '500' }}>{leitura.paciente_nome}</td>
                                        <td style={{ color: '#64748b' }}>{leitura.data_formatada}</td>
                                        <td style={{ fontWeight: '600' }}>{leitura.pressao} <small style={{ fontWeight: '400', color: '#94a3b8' }}>mmHg</small></td>
                                        <td>{leitura.temperatura}°C</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={`status-dot ${leitura.risco}`}></span>
                                                <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{leitura.risco}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {recentLeituras.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Nenhum registro encontrado</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;

