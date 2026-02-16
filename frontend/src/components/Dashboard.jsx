import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PacienteModal from './PacienteModal';
import '../index.css';

function Dashboard() {
    const navigate = useNavigate();
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPacienteId, setSelectedPacienteId] = useState(null);

    const fetchPacientes = async () => {
        try {
            const response = await api.get('/pacientes');
            setPacientes(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPacientes();
        const interval = setInterval(fetchPacientes, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusClass = (risco) => {
        switch (risco) {
            case 'verde': return 'status-badge status-verde';
            case 'amarelo': return 'status-badge status-amarelo';
            case 'vermelho': return 'status-badge status-vermelho';
            default: return 'status-badge';
        }
    };

    const getStatusText = (risco) => {
        switch (risco) {
            case 'verde': return '🟢 Normal';
            case 'amarelo': return '🟡 Atenção';
            case 'vermelho': return '🔴 Crítico';
            default: return 'Sem dados';
        }
    };

    const countStatus = (status) => {
        return pacientes.filter(p => p.ultima_leitura?.risco === status).length;
    };

    return (
        <div className="container">
            <div className="header">
                <h1 className="title">🏥 Monitoramento de Hipertensos</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={() => navigate('/pacientes')} style={{ background: 'white', border: '1px solid #d1d5db' }}>
                        Gerenciar Pacientes
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/pacientes/novo')}>
                        + Novo Paciente
                    </button>
                    <button className="btn btn-primary" onClick={() => {
                        localStorage.removeItem('token');
                        navigate('/login');
                    }}>Sair</button>
                </div>
            </div>

            <div className="card">
                <h2 className="title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>📊 Resumo Geral</h2>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>🟢 Normais: <strong>{countStatus('verde')}</strong></div>
                    <div>🟡 Atenção: <strong>{countStatus('amarelo')}</strong></div>
                    <div>🔴 Críticos: <strong>{countStatus('vermelho')}</strong></div>
                </div>
            </div>

            <div className="card">
                <h2 className="title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>👥 Pacientes Monitorados</h2>
                {loading ? <p>Carregando...</p> : (
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Última PA</th>
                                <th>Temp</th>
                                <th>Horário</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pacientes.map(paciente => (
                                <tr key={paciente.id}>
                                    <td>{paciente.nome}</td>
                                    <td>{paciente.ultima_leitura?.pressao || '-'}</td>
                                    <td>{paciente.ultima_leitura?.temperatura ? `${paciente.ultima_leitura.temperatura}°C` : '-'}</td>
                                    <td>{paciente.ultima_leitura?.data_hora ? new Date(paciente.ultima_leitura.data_hora).toLocaleString() : '-'}</td>
                                    <td>
                                        <span className={getStatusClass(paciente.ultima_leitura?.risco)}>
                                            {getStatusText(paciente.ultima_leitura?.risco)}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn"
                                            style={{ border: '1px solid #ccc', padding: '0.5rem 1rem' }}
                                            onClick={() => setSelectedPacienteId(paciente.id)}
                                        >
                                            Ver Detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedPacienteId && (
                <PacienteModal
                    pacienteId={selectedPacienteId}
                    onClose={() => setSelectedPacienteId(null)}
                />
            )}
        </div>
    );
}

export default Dashboard;
