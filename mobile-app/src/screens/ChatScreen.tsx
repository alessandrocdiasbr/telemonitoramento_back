import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Send, User } from 'lucide-react-native';
import { chatService } from '../services/api';

const ChatScreen = ({ route, navigation }: any) => {
    const { user } = route.params;
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<any>(null);

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 5000); // Poll for new messages every 5s
        return () => clearInterval(interval);
    }, []);

    const loadMessages = async () => {
        try {
            const data = await chatService.getMessages(user.id);
            setMessages(data);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const messageContent = input.trim();
        setInput('');
        setLoading(true);

        try {
            await chatService.sendMessage(user.id, messageContent);
            loadMessages();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isUser = item.direcao === 'recebida'; // Do ponto de vista do backend 'recebida' é do usuário
        return (
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                <Text style={styles.messageText}>{item.conteudo}</Text>
                <Text style={styles.messageTime}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Estilo WhatsApp */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <User color="#FFF" size={24} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Monitoramento Central</Text>
                    <Text style={styles.headerStatus}>Online</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Dashboard', { user })}>
                    <Text style={styles.headerLink}>Gráfico</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Mensagem"
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                        <Send color="#FFF" size={24} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5DDD5', // Fundo clássico do WhatsApp
    },
    header: {
        height: 60,
        backgroundColor: '#075E54',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#919191',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerStatus: {
        color: '#FFF',
        fontSize: 12,
        opacity: 0.8,
    },
    headerLink: {
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    messageList: {
        padding: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    userBubble: {
        backgroundColor: '#DCF8C6',
        alignSelf: 'flex-end',
        borderTopRightRadius: 0,
    },
    botBubble: {
        backgroundColor: '#FFF',
        alignSelf: 'flex-start',
        borderTopLeftRadius: 0,
    },
    messageText: {
        fontSize: 16,
        color: '#000',
    },
    messageTime: {
        fontSize: 10,
        color: '#666',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 8,
        backgroundColor: 'transparent',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#075E54',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default ChatScreen;
