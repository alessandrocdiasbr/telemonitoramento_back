import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import '../index.css';

function EditPatient() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        data_nascimento: '',
        telefone_familiar: '',
        nome_familiar: '',
        cpf: '',
        cpf_familiar: '',
        consentimento_lgpd: false,
        plano: 'standart'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPatient();
    }, [id]);

    const fetchPatient = async () => {
        try {
            const response = await api.get(`/pacientes/${id}`);
            const data = response.data;
            // Format date for input type="date"
            if (data.data_nascimento) {
                data.data_nascimento = data.data_nascimento.split('T')[0];
            }
            setFormData(data);
            setLoading(false);
        } catch (err) {
            console.error('Erro ao buscar paciente:', err);
            setError('Erro ao carregar dados do paciente.');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await api.put(`/pacientes/${id}`, formData);
            alert('Dados atualizados com sucesso!');
            navigate(-1);
        } catch (err) {
            console.error('Erro ao atualizar paciente:', err);
            setError(err.response?.data?.error || 'Erro ao atualizar paciente. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="container"><p>Carregando...</p></div>;

    return (
        <div className="container">
            <div className="header" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="btn-icon-dark"
                        onClick={() => navigate(-1)}
                        title="Voltar"
                        style={{ borderRadius: '50%', width: '40px', height: '40px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <h1 className="title" style={{ margin: 0 }}>Editar Paciente</h1>
                </div>
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
                        </div>

                        <div className="form-group">
                            <label className="form-label">CPF</label>
                            <input
                                type="text"
                                name="cpf"
                                className="form-input"
                                placeholder="000.000.000-00"
                                value={formData.cpf || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Data de Nascimento</label>
                            <input
                                type="date"
                                name="data_nascimento"
                                className="form-input"
                                value={formData.data_nascimento || ''}
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
                                value={formData.nome_familiar || ''}
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
                                value={formData.cpf_familiar || ''}
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

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Plano Contratado</h3>
                        <div className="plan-selector">
                            <div
                                className={`plan-card ${formData.plano === 'standart' ? 'active' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, plano: 'standart' }))}
                            >
                                <span className="plan-name">Standart</span>
                                <span className="plan-price">R$ 20</span>
                                <span className="plan-badge badge-standart">Básico</span>
                            </div>
                            <div
                                className={`plan-card ${formData.plano === 'premium' ? 'active' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, plano: 'premium' }))}
                            >
                                <span className="plan-name">Premium</span>
                                <span className="plan-price">R$ 30</span>
                                <span className="plan-badge badge-premium">Completo</span>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditPatient;
