import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../index.css';

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', { email, senha });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.is_first_login) {
                navigate('/reset-password');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.error || 'Erro ao realizar login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2 className="title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Acesso Restrito</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Digite seu email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-input"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="Digite sua senha"
                            required
                        />
                    </div>
                    {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
