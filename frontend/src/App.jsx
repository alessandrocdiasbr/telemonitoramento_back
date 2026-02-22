import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import Monitoramento from './components/Monitoramento';
import Financeiro from './components/Financeiro';
import Gerenciar from './components/Gerenciar';
import ResetPassword from './components/ResetPassword';

import RegisterPatient from './components/RegisterPatient';
import PacientesList from './components/PacientesList';
import EditPatient from './components/EditPatient';
import PatientHistory from './components/PatientHistory';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/monitoramento"
                    element={
                        <PrivateRoute>
                            <Monitoramento />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/financeiro"
                    element={
                        <PrivateRoute>
                            <Financeiro />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/gerenciar"
                    element={
                        <PrivateRoute>
                            <Gerenciar />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/pacientes"
                    element={
                        <PrivateRoute>
                            <PacientesList />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/pacientes/novo"
                    element={
                        <PrivateRoute>
                            <RegisterPatient />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/pacientes/:id/editar"
                    element={
                        <PrivateRoute>
                            <EditPatient />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/pacientes/:id/historico"
                    element={
                        <PrivateRoute>
                            <PatientHistory />
                        </PrivateRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
}

export default App;
