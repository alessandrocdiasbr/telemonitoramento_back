import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import '../index.css';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

function Financeiro() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [pacientes, setPacientes] = useState([]);
    const [pagamentos, setPagamentos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false);
    const [selectedPacienteId, setSelectedPacienteId] = useState('');
    const [boletoValor, setBoletoValor] = useState('');
    const [boletoVencimento, setBoletoVencimento] = useState('');

    const fetchData = async () => {
        try {
            const [statsRes, pacientesRes, pagamentosRes] = await Promise.all([
                api.get('/financeiro/stats'),
                api.get('/pacientes'),
                api.get('/financeiro/pagamentos')
            ]);
            setStats(statsRes.data);
            setPacientes(pacientesRes.data);
            setPagamentos(pagamentosRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar dados financeiros:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenerateBoleto = async (e) => {
        e.preventDefault();
        try {
            await api.post('/financeiro/boletos', {
                paciente_id: selectedPacienteId,
                valor: boletoValor,
                data_vencimento: boletoVencimento
            });
            alert('Boleto gerado com sucesso!');
            setIsBoletoModalOpen(false);
            fetchData(); // Refresh
        } catch (error) {
            console.error(error);
            alert('Erro ao gerar boleto.');
        }
    };

    if (loading) return <div className="container"><p>Carregando dados financeiros...</p></div>;
    if (!stats) return <div className="container"><p>Erro ao carregar dados financeiros. Tente novamente mais tarde.</p></div>;

    // Chart Data: Distribution by Plan
    const planData = {
        labels: stats.planos.map(p => p.plano === 'premium' ? 'Premium' : 'Standart'),
        datasets: [{
            data: stats.planos.map(p => parseInt(p.count)),
            backgroundColor: ['#fef3c7', '#e2e8f0'],
            borderColor: ['#92400e', '#475569'],
            borderWidth: 1,
        }],
    };

    // Chart Data: Revenue Projection vs Received
    const revenueData = {
        labels: ['Receita Projetada (Mensal)', 'Valores Recebidos (Total)'],
        datasets: [{
            label: 'Valores em R$',
            data: [stats.receitaProjetada, stats.recebidos || 0],
            backgroundColor: ['#eff6ff', '#f0fdf4'],
            borderColor: ['#2563eb', '#16a34a'],
            borderWidth: 1,
        }],
    };

    return (
        <div className="container">
            <div className="header" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="btn-icon-dark"
                        onClick={() => navigate('/dashboard')}
                        title="Voltar"
                        style={{ borderRadius: '50%', width: '40px', height: '40px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <h1 className="title">Gestão Financeira</h1>
                </div>
                <button className="btn btn-primary" onClick={() => setIsBoletoModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                    Gerar Boleto
                </button>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Total de Pacientes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)' }}>{stats.totalClientes}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Receita Projetada</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '800', color: '#2563eb' }}>R$ {stats.receitaProjetada.toFixed(2)}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Total Recebido</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '800', color: '#16a34a' }}>R$ {stats.recebidos.toFixed(2)}</p>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 className="auto-section-title">Distribuição por Plano</h3>
                    <div style={{ maxHeight: '300px', display: 'flex', justifyContent: 'center' }}>
                        <Pie data={planData} />
                    </div>
                </div>
                <div className="card">
                    <h3 className="auto-section-title">Comparativo Financeiro</h3>
                    <div style={{ maxHeight: '300px' }}>
                        <Bar data={revenueData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="auto-section-title">Boletos e Cobranças Recentes</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>Vencimento</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagamentos.map(p => (
                                <tr key={p.id}>
                                    <td>{p.paciente_nome}</td>
                                    <td>{new Date(p.data_vencimento).toLocaleDateString()}</td>
                                    <td>R$ {parseFloat(p.valor).toFixed(2)}</td>
                                    <td>
                                        <span className={`status-badge ${p.status === 'pago' ? 'status-verde' : 'status-amarelo'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>
                                        <a href={p.link_boleto} target="_blank" rel="noopener noreferrer" className="btn-icon-dark" title="Ver Boleto">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {pagamentos.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum boleto gerado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Gerar Boleto */}
            {isBoletoModalOpen && (
                <div className="modal-overlay" onClick={() => setIsBoletoModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Gerar Novo Boleto</h2>
                            <button className="btn-icon-dark" style={{ border: 'none', background: 'none' }} onClick={() => setIsBoletoModalOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <form onSubmit={handleGenerateBoleto}>
                            <div className="form-group">
                                <label className="form-label">Selecionar Paciente</label>
                                <select
                                    className="form-input"
                                    value={selectedPacienteId}
                                    onChange={(e) => setSelectedPacienteId(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {pacientes.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome} ({p.plano})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Valor (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={boletoValor}
                                    onChange={(e) => setBoletoValor(e.target.value)}
                                    placeholder="Ex: 30.00"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data de Vencimento</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={boletoVencimento}
                                    onChange={(e) => setBoletoVencimento(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setIsBoletoModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Gerar e Atrelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Financeiro;
