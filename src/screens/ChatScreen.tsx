import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { sendChatMessage, ChatDataContext } from '../api/chat';
import { getIngestors, getTransformedData } from '../api/ingestors';
import ErrorBanner from '../components/ErrorBanner';
import { COLORS } from '../constants';
import { ChatMessage, Ingestor } from '../types';

let msgCounter = 0;
const uid = () => String(++msgCounter);

const hasTable = (text: string) =>
  text.includes('|---|') || text.includes('| --- |') || text.includes('| --');

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingestors, setIngestors] = useState<Ingestor[]>([]);
  const [selectedIngestor, setSelectedIngestor] = useState<string | undefined>(undefined);
  const [ingestorData, setIngestorData] = useState<ChatDataContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getIngestors()
      .then(setIngestors)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedIngestor) {
      setIngestorData(null);
      return;
    }
    const ing = ingestors.find((i) => i.id === selectedIngestor);
    setLoadingContext(true);
    getTransformedData(selectedIngestor)
      .then((res) => {
        setIngestorData({
          ingestor_name: ing?.name ?? selectedIngestor,
          rows: res.data,
          columns: res.columns,
          totalRows: res.total,
        });
      })
      .catch(() => setIngestorData(null))
      .finally(() => setLoadingContext(false));
  }, [selectedIngestor, ingestors]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const res = await sendChatMessage(text, selectedIngestor, ingestorData ?? undefined);
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: res.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setError('No se pudo obtener respuesta. Intenta nuevamente.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    if (!isUser) {
      console.log('TEXTO A RENDERIZAR:', item.content.length, '|', item.content);
    }
    return (
      <View style={{
        flexDirection: 'row',
        marginVertical: 4,
        paddingHorizontal: 8,
        justifyContent: isUser ? 'flex-end' : 'flex-start'
      }}>
        {!isUser && (
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#2a2a2a',
            justifyContent: 'center', alignItems: 'center', marginRight: 6, marginTop: 4 }}>
            <Text>✨</Text>
          </View>
        )}
        <View style={{
          maxWidth: '80%',
          backgroundColor: isUser ? '#F5C518' : '#2a2a2a',
          borderRadius: 16,
          padding: 12,
        }}>
          {!isUser && hasTable(item.content) ? (
            <ScrollView horizontal>
              <Markdown style={markdownStyles}>{item.content}</Markdown>
            </ScrollView>
          ) : (
            <Text style={{
              color: isUser ? '#000000' : '#FFFFFF',
              fontSize: 15,
            }}>
              {item.content}
            </Text>
          )}
          <Text style={{ fontSize: 10, color: isUser ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
            marginTop: 4, textAlign: 'right' }}>
            {item.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const activeIngestor = ingestors.find((i) => i.id === selectedIngestor);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chat IA</Text>
        <Text style={styles.subtitle}>Luciérnaga · Cohere AI</Text>
      </View>

      {/* Ingestor selector */}
      {ingestors.length > 0 && (
        <View style={styles.selectorRow}>
          <Text style={styles.selectorLabel}>Contexto:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorScrollContent}
          >
            <TouchableOpacity
              style={[styles.selectorChip, !selectedIngestor && styles.selectorChipActive]}
              onPress={() => setSelectedIngestor(undefined)}
            >
              <Text style={[styles.selectorChipText, !selectedIngestor && styles.selectorChipTextActive]}>
                General
              </Text>
            </TouchableOpacity>
            {ingestors.map((ing) => (
              <TouchableOpacity
                key={ing.id}
                style={[styles.selectorChip, selectedIngestor === ing.id && styles.selectorChipActive]}
                onPress={() => setSelectedIngestor(selectedIngestor === ing.id ? undefined : ing.id)}
              >
                <Text
                  style={[styles.selectorChipText, selectedIngestor === ing.id && styles.selectorChipTextActive]}
                  numberOfLines={1}
                >
                  {ing.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {activeIngestor && (
        <View style={styles.contextBanner}>
          <Text style={styles.contextText}>
            📊  Contexto activo: <Text style={{ color: COLORS.accent }}>{activeIngestor.name}</Text>
            {loadingContext
              ? '  cargando datos…'
              : ingestorData
                ? `  · ${ingestorData.totalRows} filas`
                : ''}
          </Text>
        </View>
      )}

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>✨</Text>
            <Text style={styles.emptyChatTitle}>Hola, soy Luciérnaga</Text>
            <Text style={styles.emptyChatHint}>
              Pregúntame sobre tus datos o cualquier análisis que necesites.
            </Text>
          </View>
        }
      />

      {/* Typing indicator */}
      {sending && (
        <View style={styles.typingRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>✨</Text>
          </View>
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={styles.typingText}>  escribiendo…</Text>
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          placeholder="Escribe un mensaje…"
          placeholderTextColor={COLORS.textSecondary}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const markdownStyles = {
  body: { color: '#FFFFFF', fontSize: 15, lineHeight: 22, minWidth: 500 },
  table: { borderWidth: 1, borderColor: '#444' },
  th: { backgroundColor: '#333', color: '#F5C518', padding: 8, fontSize: 13 },
  td: { color: '#FFFFFF', padding: 8, borderColor: '#444', fontSize: 13 },
  tr: { borderBottomWidth: 1, borderColor: '#444' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingVertical: 8,
    maxHeight: 80,
  },
  selectorScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  selectorLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginRight: 8 },
  selectorChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 140,
  },
  selectorChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  selectorChipText: { color: COLORS.textSecondary, fontSize: 12 },
  selectorChipTextActive: { color: '#000', fontWeight: '700' },
  contextBanner: {
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: COLORS.accent + '15',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.accent + '44',
  },
  contextText: { color: COLORS.textSecondary, fontSize: 12 },
  listContent: { paddingHorizontal: 12, paddingVertical: 8, flexGrow: 1 },
  msgRow: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start', alignItems: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: { fontSize: 14 },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    maxWidth: '75%',
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    flexShrink: 1,
    maxWidth: '90%',
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#000', fontWeight: '500' },
  bubbleTextBot: { color: COLORS.textPrimary },
  timestamp: { fontSize: 10, color: 'rgba(0,0,0,0.4)', marginTop: 4, alignSelf: 'flex-end' },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 4 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: { color: COLORS.textSecondary, fontSize: 13 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyChatIcon: { fontSize: 56, marginBottom: 16 },
  emptyChatTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptyChatHint: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    backgroundColor: COLORS.accent,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendIcon: { color: '#000', fontSize: 18, fontWeight: '800' },
});
