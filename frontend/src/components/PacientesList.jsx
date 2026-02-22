import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../index.css';

function PacientesList() {
    const navigate = useNavigate();
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPacientes();
    }, []);

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

    const filteredPacientes = pacientes.filter(paciente =>
        paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paciente.cpf?.includes(searchTerm) ||
        paciente.telefone.includes(searchTerm)
    );

    const handleDelete = async (id, nome) => {
        if (window.confirm(`Tem certeza que deseja excluir o paciente ${nome}?`)) {
            try {
                await api.delete(`/pacientes/${id}`);
                setPacientes(pacientes.filter(p => p.id !== id));
            } catch (error) {
                console.error('Erro ao excluir paciente:', error);
                alert('Erro ao excluir paciente.');
            }
        }
    };

    return (
        <div className="container">
            <div className="header" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-icon-dark" onClick={() => navigate('/dashboard')} title="Voltar ao Dashboard" style={{ borderRadius: '50%', width: '40px', height: '40px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <h1 className="title">Gerenciar Pacientes</h1>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/pacientes/novo')} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.5rem', fontSize: '1rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                    Novo Paciente
                </button>
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar por nome, CPF ou telefone..."
                        className="form-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? <p>Carregando...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>CPF</th>
                                    <th>Telefone</th>
                                    <th>Familiar</th>
                                    <th>Tel. Familiar</th>
                                    <th>Plano</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPacientes.map(paciente => (
                                    <tr key={paciente.id}>
                                        <td>{paciente.nome}</td>
                                        <td>{paciente.cpf || '-'}</td>
                                        <td>{paciente.telefone}</td>
                                        <td>{paciente.nome_familiar || '-'}</td>
                                        <td>{paciente.telefone_familiar}</td>
                                        <td>
                                            <span className={`plan-badge badge-${paciente.plano || 'standart'}`}>
                                                {paciente.plano === 'premium' ? 'Premium' : 'Standart'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn-icon-dark"
                                                    title="Editar"
                                                    style={{ color: 'var(--primary-color)' }}
                                                    onClick={() => navigate(`/pacientes/${paciente.id}/editar`)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </button>
                                                <button
                                                    className="btn-icon-dark"
                                                    title="Excluir"
                                                    style={{ color: 'var(--danger)' }}
                                                    onClick={() => handleDelete(paciente.id, paciente.nome)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPacientes.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                            Nenhum paciente encontrado.
                                        </td>
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

export default PacientesList;
