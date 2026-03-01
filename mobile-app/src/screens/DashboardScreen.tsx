import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { pacienteService } from '../services/api';

const DashboardScreen = ({ route, navigation }: any) => {
    const { user } = route.params;
    const [historico, setHistorico] = useState<any>(null);

    useEffect(() => {
        loadHistorico();
    }, []);

    const loadHistorico = async () => {
        try {
            const data = await pacienteService.getHistorico(user.id);
            setHistorico(data);
        } catch (error) {
            console.error('Error loading historico:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color="#075E54" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meu Histórico</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Bem-vindo, {user.nome}</Text>
                    <Text style={styles.cardSubtitle}>Aqui você pode acompanhar suas últimas medições.</Text>
                </View>

                {/* No MVP as tabelas são mais simples de implementar que gráficos sem bibliotecas pesadas */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Últimas Leituras</Text>
                    {historico?.labels?.slice(-10).reverse().map((label: string, index: number) => {
                        const idx = historico.labels.indexOf(label);
                        return (
                            <View key={index} style={styles.row}>
                                <View>
                                    <Text style={styles.rowDate}>{label}</Text>
                                    <Text style={styles.rowPressure}>
                                        PA: {historico.datasets[0].data[idx]}/{historico.datasets[1].data[idx]}
                                    </Text>
                                </View>
                                <Text style={styles.rowTemp}>{historico.datasets[2].data[idx]}°C</Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    header: {
        height: 60,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E9EDEF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#075E54',
        marginLeft: 8,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#128C7E',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#667781',
        marginTop: 4,
    },
    section: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#075E54',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    rowDate: {
        fontSize: 12,
        color: '#667781',
    },
    rowPressure: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    rowTemp: {
        fontSize: 16,
        color: '#00A884',
        fontWeight: 'bold',
    },
});

export default DashboardScreen;
