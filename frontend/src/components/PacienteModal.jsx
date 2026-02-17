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
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Evolução Clínica (Últimas 30 leituras)',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y;
                            if (label.includes('Temperatura')) label += ' °C';
                            else label += ' mmHg';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    // Show only specific parts of the date if needed, but data prep is better.
                    // Here we rely on labels being formatted already or we can use a callback
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Pressão (mmHg)' },
                suggestedMin: 0,
                suggestedMax: 180,
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Temp (°C)' },
                suggestedMin: 34,
                suggestedMax: 40,
                grid: {
                    drawOnChartArea: false,
                },
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
                yAxisID: 'y',
                spanGaps: true
            },
            {
                label: 'Diastólica',
                data: historico.datasets[1].data,
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                yAxisID: 'y',
                spanGaps: true
            },
            {
                label: 'Temperatura',
                data: historico.datasets[2].data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                yAxisID: 'y1',
                spanGaps: true
            }
        ],
    } : null;

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
                            <Line options={options} data={{
                                ...chartData,
                                labels: historico.labels.map(label => {
                                    // Label format from backend might be full date string. 
                                    // Try to shorten it to DD/MM HH:mm
                                    try {
                                        const date = new Date(label);
                                        // If invalid date, return label as is
                                        if (isNaN(date.getTime())) return label;

                                        const day = date.getDate().toString().padStart(2, '0');
                                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                        const hour = date.getHours().toString().padStart(2, '0');
                                        const min = date.getMinutes().toString().padStart(2, '0');
                                        return `${day}/${month} ${hour}:${min}`;
                                    } catch (e) {
                                        return label;
                                    }
                                })
                            }} />
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
