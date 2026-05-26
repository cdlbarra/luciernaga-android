import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { createIngestor, deleteIngestor, getIngestors } from '../api/ingestors';
import ErrorBanner from '../components/ErrorBanner';
import IngestorCard from '../components/IngestorCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { Ingestor, RootStackParamList } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

const SOURCE_TYPES = ['csv', 'json', 'excel', 'api', 'database'];

export default function IngestorsScreen() {
  const { signOut } = useAuth();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [ingestors, setIngestors] = useState<Ingestor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('csv');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getIngestors();
      setIngestors(data);
    } catch {
      setError('No se pudieron cargar los ingestores. Verifica tu conexión.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteIngestor(id);
      setIngestors((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError('No se pudo eliminar el ingestor.');
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createIngestor({ name: name.trim(), description: description.trim(), source_type: sourceType });
      setIngestors((prev) => [created, ...prev]);
      setShowModal(false);
      setName('');
      setDescription('');
      setSourceType('csv');
    } catch {
      setCreateError('No se pudo crear el ingestor. Intenta nuevamente.');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCreateError(null);
  };

  const handleSuggestFromFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json', 'text/plain',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '*/*'],
        copyToCacheDirectory: false,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.name) return;
      const suggested = file.name.replace(/\.[^.]+$/, '');
      if (!name.trim()) setName(suggested);
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'json') setSourceType('json');
      else if (ext === 'xlsx') setSourceType('excel');
      else if (ext === 'csv') setSourceType('csv');
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ingestores</Text>
        <TouchableOpacity onPress={signOut} style={{ padding: 8 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' }}>Salir</Text>
        </TouchableOpacity>
      </View>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <FlatList
        style={styles.list}
        data={ingestors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <IngestorCard
            ingestor={item}
            onPress={() => navigation.navigate('IngestorDetail', { ingestor: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={COLORS.accent}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyText}>No hay ingestores aún.</Text>
              <Text style={styles.emptyHint}>Toca "+" para crear el primero.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Ingestor</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom + 16) }}
            >
              {createError && (
                <View style={styles.modalError}>
                  <Text style={styles.modalErrorText}>{createError}</Text>
                </View>
              )}

              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Ventas 2024"
                placeholderTextColor={COLORS.textSecondary}
                value={name}
                onChangeText={setName}
              />
              <TouchableOpacity
                onPress={handleSuggestFromFile}
                style={{
                  backgroundColor: '#F5C518',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 14 }}>
                  📁 Sugerir nombre desde archivo
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Descripción opcional"
                placeholderTextColor={COLORS.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Tipo de fuente</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                {SOURCE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, sourceType === type && styles.chipActive]}
                    onPress={() => setSourceType(type)}
                  >
                    <Text style={[styles.chipText, sourceType === type && styles.chipTextActive]}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createBtn, (!name.trim() || creating) && styles.createBtnDisabled]}
                  onPress={handleCreate}
                  disabled={!name.trim() || creating}
                >
                  <Text style={styles.createBtnText}>{creating ? 'Creando…' : 'Crear'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setShowModal(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {loading && <LoadingOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '800' },
  list: { flex: 1 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  emptyHint: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 999,
    zIndex: 999,
  },
  fabText: { color: '#000', fontSize: 32, fontWeight: '700', lineHeight: 38 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalError: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  modalErrorText: { color: '#fff', fontSize: 13 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 20 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  chips: { marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#000' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  createBtn: {
    flex: 2,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  suggestBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  suggestText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
});
