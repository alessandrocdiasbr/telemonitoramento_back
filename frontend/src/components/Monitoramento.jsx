import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../index.css';

function Monitoramento() {
    const navigate = useNavigate();
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
    const [selectedPaciente, setSelectedPaciente] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [horarios, setHorarios] = useState(['08:00', '14:00', '20:00']);
    const [isEditingHorarios, setIsEditingHorarios] = useState(false);
    const [newHorario, setNewHorario] = useState('12:00');

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

    const handleOpenModal = (paciente) => {
        setSelectedPaciente(paciente);
        setMessageText('');
        setIsModalOpen(true);
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        setSending(true);
        try {
            const payload = {
                message: messageText
            };

            if (selectedPaciente.telegram_chat_id) {
                payload.telegram_chat_id = selectedPaciente.telegram_chat_id;
            } else {
                payload.phone = selectedPaciente.telefone.replace(/\D/g, '');
            }

            await api.post('/send-message', payload);
            alert('Mensagem enviada com sucesso!');

            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar mensagem.');
        } finally {
            setSending(false);
        }
    };

    const handleRemoveHorario = (index) => {
        setHorarios(horarios.filter((_, i) => i !== index));
    };

    const handleAddHorario = () => {
        if (!horarios.includes(newHorario)) {
            setHorarios([...horarios, newHorario].sort());
        }
    };

    const filteredPacientes = pacientes.filter(paciente =>
        paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paciente.cpf?.includes(searchTerm)
    );

    return (
        <div className="container">
            <div className="header" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="btn-icon-dark"
                        onClick={() => navigate('/dashboard')}
                        title="Voltar ao Dashboard"
                        style={{ borderRadius: '50%', width: '40px', height: '40px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <h1 className="title">Monitorar Pacientes</h1>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/pacientes/novo')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.5rem', fontSize: '1rem' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                    Novo Paciente
                </button>
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar paciente por nome ou CPF..."
                        className="form-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? <p>Carregando pacientes...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Paciente</th>
                                    <th>Último Registro</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPacientes.map((paciente) => (
                                    <tr key={paciente.id}>
                                        <td style={{ fontWeight: '500' }}>{paciente.nome}</td>
                                        <td style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                            {paciente.ultima_leitura ? (
                                                <>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                                        {paciente.ultima_leitura.pressao} mmHg / {paciente.ultima_leitura.temperatura}°C
                                                    </div>
                                                    <div>{new Date(paciente.ultima_leitura.data_hora).toLocaleString()}</div>
                                                </>
                                            ) : 'Sem registros'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={`status-dot ${paciente.ultima_leitura?.risco || 'sem-dados'}`}></span>
                                                <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
                                                    {paciente.ultima_leitura?.risco || 'Sem dados'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn-icon-dark"
                                                    title="Ver Histórico"
                                                    style={{ color: 'var(--primary-color)' }}
                                                    onClick={() => navigate(`/pacientes/${paciente.id}/historico`)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                                                    Histórico
                                                </button>
                                                <button
                                                    className="btn-icon-dark"
                                                    title="Enviar Mensagem"
                                                    style={{ color: paciente.telegram_chat_id ? '#0088cc' : '#25D366' }}
                                                    onClick={() => handleOpenModal(paciente)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.5 8.5 0 0 1 3.4.7L22 2l-1.5 5.1z" /></svg>
                                                    {paciente.telegram_chat_id ? 'Telegram' : 'Zap'}
                                                </button>

                                                <button
                                                    className="btn-icon-dark"
                                                    title="Automações"
                                                    style={{ color: 'var(--warning)' }}
                                                    onClick={() => {
                                                        setSelectedPaciente(paciente);
                                                        setIsAutoModalOpen(true);
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 14 7-9 1 9h6l-7 9-1-9H5z" /></svg>
                                                    Automações
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPacientes.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Nenhum paciente encontrado</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Message Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Mensagem para {selectedPaciente?.nome}</h2>
                            <button className="btn-icon-dark" style={{ border: 'none', background: 'none' }} onClick={() => setIsModalOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <textarea
                            className="message-textarea"
                            placeholder="Escreva sua mensagem aqui..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            autoFocus
                        ></textarea>
                        <div className="modal-footer">
                            <button className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSendMessage}
                                disabled={sending || !messageText.trim()}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {sending ? 'Enviando...' : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polyline points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                        Enviar Mensagem
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Automations Modal */}
            {isAutoModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAutoModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Configurar Automações</h2>
                            <button className="btn-icon-dark" style={{ border: 'none', background: 'none' }} onClick={() => setIsAutoModalOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="patient-info-mini" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                            <div className="info-item">
                                <span className="info-label">Paciente</span>
                                <span className="info-value">{selectedPaciente?.nome}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Celular Paciente</span>
                                <span className="info-value">{selectedPaciente?.telefone}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Celular Contato</span>
                                {selectedPaciente?.telefone_familiar ? (
                                    <span className="info-value">{selectedPaciente.telefone_familiar}</span>
                                ) : (
                                    <button
                                        className="btn-icon-dark"
                                        style={{ fontSize: '11px', padding: '4px 8px', width: 'fit-content' }}
                                        onClick={() => navigate(`/pacientes/${selectedPaciente.id}/editar`)}
                                    >
                                        Adicionar Número
                                    </button>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Plano</span>
                                <span className={`plan-badge badge-${selectedPaciente?.plano || 'standart'}`} style={{ width: 'fit-content' }}>
                                    {selectedPaciente?.plano === 'premium' ? 'Premium' : 'Standart'}
                                </span>
                            </div>
                        </div>


                        <div className="auto-section">
                            <h3 className="auto-section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 0 6h20a3 3 0 0 0 0-6z" /><path d="M18 17V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12" /></svg>
                                Gatilhos e Disparos
                            </h3>
                            <div className="auto-grid">
                                <div className="auto-card" style={{ gridColumn: 'span 2' }}>
                                    <div className="auto-card-header">
                                        <span className="auto-card-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.5 8.5 0 0 1 3.4.7L22 2l-1.5 5.1z" /></svg>
                                            Agendamento Automático
                                        </span>
                                        <label className="toggle-switch">
                                            <input type="checkbox" defaultChecked />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Horários configurados:</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {horarios.map((hora, index) => (
                                                    <div key={index} style={{
                                                        background: 'var(--primary-color)',
                                                        color: 'white',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.85rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}>
                                                        {hora}
                                                        {isEditingHorarios && (
                                                            <button
                                                                onClick={() => handleRemoveHorario(index)}
                                                                style={{ background: 'none', border: 'none', color: 'white', padding: 0, cursor: 'pointer', display: 'flex' }}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {isEditingHorarios && (
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                        <input
                                                            type="time"
                                                            value={newHorario}
                                                            onChange={(e) => setNewHorario(e.target.value)}
                                                            className="form-input"
                                                            style={{ padding: '2px 4px', fontSize: '0.85rem', width: '80px', height: '28px' }}
                                                        />
                                                        <button
                                                            className="btn-icon-dark"
                                                            style={{ padding: '4px', background: 'var(--success)', color: 'white', border: 'none' }}
                                                            onClick={handleAddHorario}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className="btn-icon-dark"
                                            style={{ padding: '6px 12px', fontSize: '11px', alignSelf: 'flex-start' }}
                                            onClick={() => setIsEditingHorarios(!isEditingHorarios)}
                                        >
                                            {isEditingHorarios ? 'Concluir' : 'Configurar Horários'}
                                        </button>
                                    </div>
                                </div>

                                <div className="auto-card">
                                    <div className="auto-card-header">
                                        <span className="auto-card-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                            Alterações Bruscas
                                        </span>
                                        <label className="toggle-switch">
                                            <input type="checkbox" defaultChecked />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Alertar se houver mudança brusca nos dados.</p>
                                </div>
                            </div>
                        </div>

                        <div className="auto-section">
                            <h3 className="auto-section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                Destinatários
                            </h3>
                            <div className="auto-grid">
                                <div className="auto-card">
                                    <div className="auto-card-header">
                                        <span className="auto-card-title">Enviar para Contato</span>
                                        <label className="toggle-switch">
                                            <input type="checkbox" />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Enviar notificações também para o contato familiar.</p>
                                </div>

                                <div className="auto-card">
                                    <div className="auto-card-header">
                                        <span className="auto-card-title">Alertar Admins</span>
                                        <label className="toggle-switch">
                                            <input type="checkbox" defaultChecked />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Notificar equipe técnica em caso de risco crítico.</p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ marginTop: '2rem' }}>
                            <button className="btn" onClick={() => setIsAutoModalOpen(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={() => {
                                alert('Configurações de automação salvas!');
                                setIsAutoModalOpen(false);
                            }}>Salvar Automações</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Monitoramento;
