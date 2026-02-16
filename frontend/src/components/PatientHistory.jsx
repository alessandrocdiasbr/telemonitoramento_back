import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../index.css';

function PatientHistory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [paciente, setPaciente] = useState(null);
    const [leituras, setLeituras] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [pacienteRes, leiturasRes] = await Promise.all([
                api.get(`/pacientes/${id}`),
                api.get(`/pacientes/${id}/leituras`)
            ]);
            setPaciente(pacienteRes.data);
            setLeituras(leiturasRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            setLoading(false);
        }
    };

    const generateReport = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(37, 99, 235); // Primary color
        doc.text('Relatório de Monitoramento', 14, 20);

        // Client Info
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Paciente: ${paciente.nome}`, 14, 30);
        doc.text(`Telefone: ${paciente.telefone}`, 14, 36);
        doc.text(`Data de Geração: ${new Date().toLocaleDateString()}`, 14, 42);

        // Table
        const tableColumn = ["Data/Hora", "Pressão (mmHg)", "Temp (°C)", "Risco", "Sintomas"];
        const tableRows = [];

        leituras.forEach(leitura => {
            const leituraData = [
                leitura.data_formatada,
                `${leitura.pressao_sistolica}/${leitura.pressao_diastolica}`,
                leitura.temperatura,
                leitura.classificacao_risco.toUpperCase(),
                leitura.sintomas_relatados || '-'
            ];
            tableRows.push(leituraData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            alternateRowStyles: { fillColor: [243, 244, 246] }
        });

        doc.save(`relatorio_${paciente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const getStatusText = (risco) => {
        switch (risco) {
            case 'verde': return '🟢 Normal';
            case 'amarelo': return '🟡 Atenção';
            case 'vermelho': return '🔴 Crítico';
            default: return 'Sem dados';
        }
    };

    if (loading) return <div className="container"><p>Carregando...</p></div>;

    return (
        <div className="container">
            <div className="header">
                <div>
                    <h1 className="title">Histórico: {paciente?.nome}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Visualizando {leituras.length} registros</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={() => navigate('/pacientes')}>Voltar</button>
                    <button className="btn btn-primary" onClick={generateReport}>
                        📄 Baixar Relatório PDF
                    </button>
                </div>
            </div>

            <div className="card">
                {leituras.length === 0 ? (
                    <p>Nenhuma leitura registrada para este paciente.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Pressão (PA)</th>
                                <th>Temp (°C)</th>
                                <th>Sintomas</th>
                                <th>Risco</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leituras.map(leitura => (
                                <tr key={leitura.id}>
                                    <td>{leitura.data_formatada}</td>
                                    <td style={{ fontWeight: '500' }}>
                                        {leitura.pressao_sistolica}/{leitura.pressao_diastolica}
                                    </td>
                                    <td>{leitura.temperatura}</td>
                                    <td style={{ maxWidth: '300px' }}>{leitura.sintomas_relatados || '-'}</td>
                                    <td>
                                        <span className={`status-badge status-${leitura.classificacao_risco}`}>
                                            {getStatusText(leitura.classificacao_risco)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default PatientHistory;
