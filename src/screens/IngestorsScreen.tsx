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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { createIngestor, deleteIngestor, getIngestors } from '../api/ingestors';
import ErrorBanner from '../components/ErrorBanner';
import IngestorCard from '../components/IngestorCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS } from '../constants';
import { Ingestor, RootStackParamList } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

const SOURCE_TYPES = ['csv', 'json', 'excel', 'api', 'database'];

export default function IngestorsScreen() {
  const navigation = useNavigation<Nav>();
  const [ingestors, setIngestors] = useState<Ingestor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('csv');
  const [creating, setCreating] = useState(false);

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
    try {
      const created = await createIngestor({ name: name.trim(), description: description.trim(), source_type: sourceType });
      setIngestors((prev) => [created, ...prev]);
      setShowModal(false);
      setName('');
      setDescription('');
      setSourceType('csv');
    } catch {
      setError('No se pudo crear el ingestor.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ingestores</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <FlatList
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
        contentContainerStyle={ingestors.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Ingestor</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Ventas 2024"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
            />

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
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
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
          </View>
        </View>
      </Modal>

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
  addBtn: {
    backgroundColor: COLORS.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#000', fontSize: 24, fontWeight: '700', lineHeight: 28 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  emptyHint: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
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
    paddingBottom: 40,
  },
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
});
