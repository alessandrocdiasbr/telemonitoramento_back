import Navbar from './Navbar';

function Layout({ children }) {
    return (
        <div className="app-container">
            <Navbar />
            <main className="main-content">
                {children}
            </main>
            <footer className="app-footer">
                <div className="footer-content">
                    <span className="footer-brand">Sentinela Saúde &copy; 2026</span>
                    <span>Sistema de Telemonitoramento de Hipertensos</span>
                    <span>Desenvolvido por <strong>Alessandro Dias</strong></span>
                </div>
            </footer>
        </div>
    );
}

export default Layout;
