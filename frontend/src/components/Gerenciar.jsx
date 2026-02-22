import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../index.css';

function Gerenciar() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('list'); // list, create, settings
    const userJSON = localStorage.getItem('user');
    let currentUser = null;
    try {
        currentUser = userJSON ? JSON.parse(userJSON) : null;
    } catch (e) {
        currentUser = null;
    }

    // Form states
    const [newUser, setNewUser] = useState({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        role: 'usuario'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async () => {
        try {
            const [usersRes, settingsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/sistema/settings')
            ]);
            setUsers(usersRes.data);
            setSettings(settingsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (currentUser.role === 'paciente') {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post('/admin/users', newUser);
            setSuccess('Usuário cadastrado com sucesso! Senha inicial: senha123');
            setNewUser({ nome: '', email: '', cpf: '', telefone: '', role: 'usuario' });
            fetchData();
            setActiveTab('list');
        } catch (error) {
            setError(error.response?.data?.error || 'Erro ao cadastrar usuário.');
        }
    };

    const handleDeleteUser = async (id, nome) => {
        if (window.confirm(`Tem certeza que deseja excluir o usuário ${nome}?`)) {
            try {
                await api.delete(`/admin/users/${id}`);
                fetchData();
            } catch (error) {
                alert('Erro ao excluir usuário.');
            }
        }
    };

    const handleResetPassword = async (id) => {
        if (window.confirm('Deseja resetar a senha deste usuário para o padrão (senha123)?')) {
            try {
                await api.post(`/admin/users/${id}/reset-password`);
                alert('Senha resetada com sucesso!');
            } catch (error) {
                alert('Erro ao resetar senha.');
            }
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        try {
            await api.put('/sistema/settings', { settings });
            alert('Configurações atualizadas!');
        } catch (error) {
            alert('Erro ao salvar alterações.');
        }
    };

    if (loading) return <div className="container"><p>Carregando...</p></div>;

    const isMaster = currentUser?.role === 'master';
    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div className="header">
                <h1 className="title">Configurações do Sistema</h1>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                <div className={`action-card ${activeTab === 'list' ? 'active-tab' : ''}`} onClick={() => setActiveTab('list')}>
                    <div className="card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <h3 className="card-title">Gerenciar Usuários</h3>
                    <p className="card-desc">Visualizar, excluir e resetar senhas.</p>
                </div>

                {(isMaster || isAdmin) && (
                    <div className={`action-card ${activeTab === 'create' ? 'active-tab' : ''}`} onClick={() => setActiveTab('create')}>
                        <div className="card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                        </div>
                        <h3 className="card-title">Cadastrar Usuário</h3>
                        <p className="card-desc">Adicionar novos operadores ao sistema.</p>
                    </div>
                )}

                {isMaster && (
                    <div className={`action-card ${activeTab === 'settings' ? 'active-tab' : ''}`} onClick={() => setActiveTab('settings')}>
                        <div className="card-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                        </div>
                        <h3 className="card-title">Gerenciar Sistema</h3>
                        <p className="card-desc">Valores dos planos e configurações.</p>
                    </div>
                )}
            </div>

            {activeTab === 'list' && (
                <div className="card">
                    <h2 className="auto-section-title">Usuários Cadastrados</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>CPF</th>
                                    <th>Função</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: '500' }}>{u.nome} {(u.id === currentUser.id) && <small>(Você)</small>}</td>
                                        <td>{u.email}</td>
                                        <td>{u.cpf}</td>
                                        <td>
                                            <span className={`plan-badge badge-${u.role === 'master' ? 'premium' : 'standart'}`}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {(u.id !== currentUser.id && u.role !== 'master') && (
                                                    <button className="btn-icon-dark" style={{ color: 'var(--danger)' }} title="Excluir" onClick={() => handleDeleteUser(u.id, u.nome)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    </button>
                                                )}
                                                {(u.role !== 'master') && (
                                                    <button className="btn-icon-dark" style={{ color: 'var(--primary-color)' }} title="Resetar Senha" onClick={() => handleResetPassword(u.id)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m8 11 3 3 5-5" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {(isMaster || isAdmin) && (
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" onClick={() => navigate('/pacientes/novo')}>Novo Paciente</button>
                            {isAdmin && <button className="btn" onClick={() => setActiveTab('create')}>Novo Operador</button>}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'create' && (
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 className="auto-section-title">Novo Usuário do Sistema</h2>
                    <form onSubmit={handleCreateUser}>
                        <div className="form-group">
                            <label className="form-label">Nome Completo</label>
                            <input type="text" className="form-input" value={newUser.nome} onChange={e => setNewUser({ ...newUser, nome: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-input" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">CPF</label>
                            <input type="text" className="form-input" value={newUser.cpf} onChange={e => setNewUser({ ...newUser, cpf: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Telefone</label>
                            <input type="text" className="form-input" value={newUser.telefone} onChange={e => setNewUser({ ...newUser, telefone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Função / Role</label>
                            <select className="form-input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} required>
                                {isMaster && <option value="admin">Administrador (Total)</option>}
                                <option value="usuario">Usuário (Operador)</option>
                                <option value="paciente">Paciente/Cliente</option>
                            </select>
                        </div>
                        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
                        {success && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{success}</p>}
                        <div className="modal-footer">
                            <button type="button" className="btn" onClick={() => setActiveTab('list')}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Cadastrar</button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'settings' && isMaster && (
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 className="auto-section-title">Valores dos Planos</h2>
                    <form onSubmit={handleUpdateSettings}>
                        {settings.map((s, idx) => (
                            <div className="form-group" key={s.id}>
                                <label className="form-label">{s.chave.replace('_', ' ').toUpperCase()}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        value={s.valor}
                                        onChange={e => {
                                            const newSettings = [...settings];
                                            newSettings[idx].valor = e.target.value;
                                            setSettings(newSettings);
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salvar Alterações</button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Gerenciar;
