import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../index.css';

function RegisterPatient() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        data_nascimento: '',
        telefone_familiar: '',
        nome_familiar: '',
        cpf: '',
        cpf_familiar: '',
        consentimento_lgpd: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/pacientes', formData);
            alert('Paciente cadastrado com sucesso!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Erro ao cadastrar paciente:', err);
            setError(err.response?.data?.error || 'Erro ao cadastrar paciente. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h1 className="title">Novo Paciente</h1>
                <button className="btn" onClick={() => navigate('/dashboard')}>Voltar</button>
            </div>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
                    {error && <div className="status-badge status-vermelho" style={{ marginBottom: '1rem', display: 'block', textAlign: 'center' }}>{error}</div>}

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Dados do Paciente</h3>

                        <div className="form-group">
                            <label className="form-label">Nome Completo *</label>
                            <input
                                type="text"
                                name="nome"
                                className="form-input"
                                value={formData.nome}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Telefone (WhatsApp) *</label>
                            <input
                                type="tel"
                                name="telefone"
                                className="form-input"
                                placeholder="+5511999999999"
                                value={formData.telefone}
                                onChange={handleChange}
                                required
                            />
                            <small style={{ color: 'var(--text-secondary)' }}>Formato: +55DD900000000</small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">CPF</label>
                            <input
                                type="text"
                                name="cpf"
                                className="form-input"
                                placeholder="000.000.000-00"
                                value={formData.cpf}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Data de Nascimento</label>
                            <input
                                type="date"
                                name="data_nascimento"
                                className="form-input"
                                value={formData.data_nascimento}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Dados do Familiar / Responsável</h3>

                        <div className="form-group">
                            <label className="form-label">Nome do Familiar</label>
                            <input
                                type="text"
                                name="nome_familiar"
                                className="form-input"
                                value={formData.nome_familiar}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">CPF do Familiar</label>
                            <input
                                type="text"
                                name="cpf_familiar"
                                className="form-input"
                                placeholder="000.000.000-00"
                                value={formData.cpf_familiar}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Telefone Familiar *</label>
                            <input
                                type="tel"
                                name="telefone_familiar"
                                className="form-input"
                                placeholder="+5511999999999"
                                value={formData.telefone_familiar}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f9fafb', padding: '1rem', borderRadius: 'var(--border-radius)' }}>
                        <input
                            type="checkbox"
                            name="consentimento_lgpd"
                            id="consentimento_lgpd"
                            checked={formData.consentimento_lgpd}
                            onChange={handleChange}
                        />
                        <label htmlFor="consentimento_lgpd" style={{ cursor: 'pointer' }}>Termo de Consentimento LGPD assinado</label>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Cadastrar Paciente'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RegisterPatient;
