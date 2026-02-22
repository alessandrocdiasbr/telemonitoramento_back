import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../index.css';

function ResetPassword() {
    const [senhaAntiga, setSenhaAntiga] = useState('');
    const [senhaNova, setSenhaNova] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const userJSON = localStorage.getItem('user');
    let user = null;
    try {
        user = userJSON ? JSON.parse(userJSON) : null;
    } catch (e) {
        user = null;
    }

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleReset = async (e) => {
        e.preventDefault();
        if (senhaNova !== confirmarSenha) {
            return setError('As senhas não coincidem.');
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', {
                userId: user.id,
                senhaAntiga,
                senhaNova
            });

            // Atualizar user no localStorage
            user.is_first_login = false;
            localStorage.setItem('user', JSON.stringify(user));

            alert('Senha atualizada com sucesso!');
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.error || 'Erro ao atualizar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box" style={{ maxWidth: '400px' }}>
                <h2 className="title" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Primeiro Acesso</h2>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Por segurança, você deve alterar sua senha inicial.
                </p>
                <form onSubmit={handleReset}>
                    <div className="form-group">
                        <label className="form-label">Senha Antiga</label>
                        <input
                            type="password"
                            className="form-input"
                            value={senhaAntiga}
                            onChange={(e) => setSenhaAntiga(e.target.value)}
                            placeholder="Digite a senha atual"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nova Senha</label>
                        <input
                            type="password"
                            className="form-input"
                            value={senhaNova}
                            onChange={(e) => setSenhaNova(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            minLength="6"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            className="form-input"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            placeholder="Repita a nova senha"
                            required
                        />
                    </div>
                    {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Atualizando...' : 'Definir Nova Senha'}
                    </button>
                    <button type="button" className="btn" style={{ width: '100%', marginTop: '0.5rem', background: 'transparent', color: '#64748b' }} onClick={() => navigate('/login')}>
                        Voltar ao Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
