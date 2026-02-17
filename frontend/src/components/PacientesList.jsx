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

    return (
        <div className="container">
            <div className="header">
                <h1 className="title">Gerenciar Pacientes</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={() => navigate('/dashboard')}>
                        Voltar ao Dashboard
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/pacientes/novo')}>
                        + Novo Paciente
                    </button>
                </div>
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
                                            <button
                                                className="btn"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', marginRight: '0.5rem', border: '1px solid #ccc', backgroundColor: '#25D366', color: 'white', borderColor: '#25D366' }}
                                                onClick={async () => {
                                                    const message = prompt(`Enviar mensagem para ${paciente.nome}:\n(Digite a mensagem abaixo)`);
                                                    if (message) {
                                                        try {
                                                            // Sanitize phone: remove non-digits
                                                            const cleanPhone = paciente.telefone.replace(/\D/g, '');

                                                            await api.post('/send-message', {
                                                                phone: cleanPhone,
                                                                message: message
                                                            });
                                                            alert('Mensagem enviada com sucesso!');
                                                        } catch (error) {
                                                            console.error(error);
                                                            const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Erro ao enviar mensagem.';
                                                            alert(`Erro: ${JSON.stringify(errorMessage)}`);
                                                        }
                                                    }
                                                }}
                                            >
                                                WinZap
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', marginRight: '0.5rem', border: '1px solid #ccc' }}
                                                onClick={() => navigate(`/pacientes/${paciente.id}/historico`)}
                                            >
                                                Histórico
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                                                onClick={() => navigate(`/pacientes/${paciente.id}/editar`)}
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPacientes.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
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
