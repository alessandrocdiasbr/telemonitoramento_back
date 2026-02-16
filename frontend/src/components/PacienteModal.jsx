import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import api from '../services/api';
import '../index.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function PacienteModal({ pacienteId, onClose }) {
    const [historico, setHistorico] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistorico = async () => {
            try {
                const response = await api.get(`/historico/${pacienteId}`);
                setHistorico(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Erro ao buscar histórico:', error);
                setLoading(false);
            }
        };
        fetchHistorico();
    }, [pacienteId]);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Evolução Clínica (Últimas 30 leituras)',
            },
        },
    };

    const chartData = historico ? {
        labels: historico.labels,
        datasets: [
            {
                label: 'Sistólica',
                data: historico.datasets[0].data,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Diastólica',
                data: historico.datasets[1].data,
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
                label: 'Temperatura',
                data: historico.datasets[2].data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                yAxisID: 'y1',
            }
        ],
    } : null;

    // Ajuste para escala de temperatura separada se necessário, ou mesmo gráfico
    if (options.scales && !options.scales.y1) {
        options.scales = {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false,
                },
            },
        };
    } else if (!options.scales) {
        options.scales = {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false,
                },
            },
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="header">
                    <h2 className="title">Detalhes do Paciente</h2>
                    <button className="btn" onClick={onClose}>Fechar</button>
                </div>

                {loading ? <p>Carregando dados...</p> : (
                    <div>
                        {historico && historico.labels.length > 0 ? (
                            <Line options={options} data={chartData} />
                        ) : (
                            <p>Nenhum histórico disponível para este paciente.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PacienteModal;
