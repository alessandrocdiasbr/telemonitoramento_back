import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [24, 129, 140] }, // --primary-color #18818C
            alternateRowStyles: { fillColor: [213, 242, 234] } // --accent-light #D5F2EA
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
            <div className="header" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="btn-icon-dark"
                        onClick={() => navigate('/monitoramento')}
                        title="Voltar ao Monitoramento"
                        style={{ borderRadius: '50%', width: '40px', height: '40px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <div>
                        <h1 className="title" style={{ margin: 0 }}>Histórico: {paciente?.nome}</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Visualizando {leituras.length} registros</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={generateReport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Baixar PDF
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
