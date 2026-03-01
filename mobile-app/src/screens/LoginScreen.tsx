import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { authService } from '../services/api';

const LoginScreen = ({ navigation }: any) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!phone) {
            Alert.alert('Erro', 'Por favor, digite seu telefone.');
            return;
        }

        setLoading(true);
        try {
            const data = await authService.login(phone);
            if (data.user) {
                navigation.replace('Chat', { user: data.user });
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Erro', error.response?.data?.error || 'Não foi possível fazer login. Verifique seu telefone.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.inner}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>S</Text>
                    </View>
                    <Text style={styles.title}>Sentinela Saúde</Text>
                    <Text style={styles.subtitle}>Telemonitoramento Inteligente</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Digite seu número de telefone</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 31988887777"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    inner: {
        padding: 24,
        flex: 1,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#00A884', // Cor WhatsApp
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        color: '#FFF',
        fontSize: 40,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#128C7E',
    },
    subtitle: {
        fontSize: 16,
        color: '#667781',
        marginTop: 4,
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: '#667781',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E9EDEF',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#F0F2F5',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#00A884',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
