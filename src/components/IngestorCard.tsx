import React from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants';
import { Ingestor } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
  ingestor: Ingestor;
  onPress: () => void;
  onDelete: () => void;
}

export default function IngestorCard({ ingestor, onPress, onDelete }: Props) {
  const handleDelete = () => {
    Alert.alert(
      'Eliminar ingestor',
      `¿Seguro que quieres eliminar "${ingestor.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const formatted = new Date(ingestor.created_at).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {ingestor.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {ingestor.description || 'Sin descripción'}
          </Text>
          <View style={styles.footer}>
            <StatusBadge status={ingestor.status} />
            <Text style={styles.date}>{formatted}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  info: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { color: COLORS.textSecondary, fontSize: 11, marginLeft: 8 },
  deleteBtn: { paddingLeft: 12, paddingTop: 2 },
  deleteIcon: { fontSize: 18 },
});
