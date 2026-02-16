import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

import RegisterPatient from './components/RegisterPatient';
import PacientesList from './components/PacientesList';
import EditPatient from './components/EditPatient';
import PatientHistory from './components/PatientHistory';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
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
