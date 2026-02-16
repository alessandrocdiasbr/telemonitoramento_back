import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('token', 'fake-token-123');
            navigate('/dashboard');
        } else {
            setError('Credenciais inválidas. Tente admin / admin123');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2 className="title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Acesso Restrito</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Usuário</label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Digite seu usuário"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite sua senha"
                        />
                    </div>
                    {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
