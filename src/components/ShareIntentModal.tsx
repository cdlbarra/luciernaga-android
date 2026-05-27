import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getIngestors, ingestFile } from '../api/ingestors';
import { COLORS } from '../constants';
import { Ingestor } from '../types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface SharedFile {
  path: string;
  fileName: string;
  mimeType: string;
  size?: number;
}

interface Props {
  file: SharedFile;
  onDismiss: () => void;
}

export default function ShareIntentModal({ file, onDismiss }: Props) {
  const [ingestors, setIngestors] = useState<Ingestor[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    getIngestors()
      .then(setIngestors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleIngest = async () => {
    if (!selected) return;
    setUploading(true);
    setProgress(0);
    try {
      const res = await ingestFile(
        { uri: file.path, name: file.fileName, mimeType: file.mimeType },
        selected,
        setProgress,
      );
      if (!res.success) {
        Alert.alert('Error', res.message ?? 'No se pudo procesar el archivo.');
        setUploading(false);
        return;
      }
      Alert.alert('Listo', `${res.rowsProcessed ?? 0} filas procesadas.`, [
        { text: 'OK', onPress: onDismiss },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? e?.message ?? 'Error desconocido');
      setUploading(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Archivo compartido</Text>

          <View style={styles.fileBox}>
            <Text style={styles.fileName} numberOfLines={2}>📄  {file.fileName}</Text>
            {file.size != null && (
              <Text style={styles.fileMeta}>{formatFileSize(file.size)}  ·  {file.mimeType}</Text>
            )}
          </View>

          <Text style={styles.label}>Selecciona un ingestor</Text>

          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
          ) : ingestors.length === 0 ? (
            <Text style={styles.empty}>No hay ingestores. Crea uno primero.</Text>
          ) : (
            <FlatList
              data={ingestors}
              keyExtractor={(i) => i.id}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, selected === item.id && styles.itemSelected]}
                  onPress={() => setSelected(item.id)}
                >
                  <Text style={[styles.itemText, selected === item.id && styles.itemTextSelected]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          {uploading ? (
            <View style={styles.progressRow}>
              <ActivityIndicator color={COLORS.accent} />
              <Text style={styles.progressText}>Procesando…  {progress}%</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ingestBtn, !selected && styles.ingestBtnDisabled]}
                onPress={handleIngest}
                disabled={!selected}
              >
                <Text style={styles.ingestBtnText}>⚡  Ingestar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 16 },
  fileBox: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  fileName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  fileMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  list: { maxHeight: 200, marginBottom: 16 },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  itemSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  itemText: { color: COLORS.textPrimary, fontSize: 14 },
  itemTextSelected: { color: '#000', fontWeight: '700' },
  empty: { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  progressText: { color: COLORS.textSecondary, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  ingestBtn: {
    flex: 2,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  ingestBtnDisabled: { opacity: 0.4 },
  ingestBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
