import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { getTransformedData, ingestFile, ingestMockData, updateIngestorStatus } from '../api/ingestors';
import ErrorBanner from '../components/ErrorBanner';
import StatusBadge from '../components/StatusBadge';
import { COLORS } from '../constants';
import { RootStackParamList, TransformedDataResponse, TransformedDataRow } from '../types';

type Props = { route: RouteProp<RootStackParamList, 'IngestorDetail'> };

type SelectedFile = { uri: string; name: string; mimeType: string; size?: number };

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatCellValue(col: string, value: string): string {
  if (/fecha|date/i.test(col)) {
    const m = value.match(/^(\d{4}-\d{2}-\d{2})[T ]\d{2}:\d{2}/);
    if (m) return m[1];
  }
  return value;
}

function detectDateColumn(columns: string[]): string | null {
  return columns.find((c) => /date|fecha|time|año|year/i.test(c)) ?? null;
}

function detectCategoryColumn(columns: string[]): string | null {
  return columns.find((c) => /category|categoria|type|tipo|status|estado|region/i.test(c)) ?? null;
}

function buildLineData(rows: TransformedDataRow[], dateCol: string, valueCol: string) {
  return rows.slice(0, 20).map((row) => ({
    value: Number(row[valueCol]) || 0,
    label: String(row[dateCol] ?? '').slice(0, 5),
  }));
}

function buildBarData(rows: TransformedDataRow[], catCol: string) {
  const counts: Record<string, number> = {};
  rows.forEach((row) => {
    const key = String(row[catCol] ?? 'N/A');
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return Object.entries(counts)
    .slice(0, 8)
    .map(([label, value]) => ({ value, label, frontColor: COLORS.accent }));
}

export default function IngestorDetailScreen({ route }: Props) {
  const { ingestor } = route.params;
  const [dataRes, setDataRes] = useState<TransformedDataResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loadingData, setLoadingData] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  const loadData = useCallback(async (p: number) => {
    setLoadingData(true);
    setError(null);
    try {
      const res = await getTransformedData(ingestor.id, p);
      setDataRes(res);
    } catch {
      setError('No se pudieron cargar los datos transformados.');
    } finally {
      setLoadingData(false);
    }
  }, [ingestor.id]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleMockUpload = async () => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await ingestMockData(ingestor.id);
      if (!res.success) {
        const msg = res.message ?? 'Error al procesar datos mock.';
        Alert.alert('Error del servidor', msg);
        setError(msg);
        return;
      }
      setSuccessMsg(`✓ ${res.rowsProcessed ?? 0} filas de prueba procesadas correctamente.`);
      updateIngestorStatus(ingestor.id, 'active').catch(() => null);
      setPage(1);
      await loadData(1);
    } catch (e: any) {
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message ?? e?.response?.data?.error;
      const msg = serverMsg ?? e?.message ?? 'Error desconocido';
      Alert.alert(`Error (${status ?? 'red'})`, msg);
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'application/json',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file) {
        Alert.alert('Error', 'No se pudo obtener el archivo seleccionado.');
        return;
      }

      if (!file.uri) {
        Alert.alert('Error', 'El archivo no tiene URI válido. Intenta desde la app nativa.');
        return;
      }

      setSelectedFile({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType ?? 'application/octet-stream',
        size: file.size ?? undefined,
      });
      setError(null);
      setSuccessMsg(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo abrir el selector de archivos.');
    }
  };

  const handleIngest = async () => {
    if (!selectedFile) return;

    if (selectedFile.size != null && selectedFile.size > MAX_FILE_SIZE) {
      Alert.alert(
        'Archivo demasiado grande',
        `El archivo pesa ${formatFileSize(selectedFile.size)}. El límite es 5 MB.`
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await ingestFile(
        { uri: selectedFile.uri, name: selectedFile.name, mimeType: selectedFile.mimeType },
        ingestor.id,
        setUploadProgress
      );

      if (!res.success) {
        const msg = res.message ?? 'El servidor rechazó el archivo.';
        Alert.alert('Error del servidor', msg);
        setError(msg);
        return;
      }

      setSuccessMsg(`✓ ${res.rowsProcessed ?? 0} filas procesadas correctamente.`);
      setSelectedFile(null);
      updateIngestorStatus(ingestor.id, 'active').catch(() => null);
      setPage(1);
      await loadData(1);
    } catch (e: any) {
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message ?? e?.response?.data?.error;
      const msg = serverMsg ?? e?.message ?? 'Error desconocido';
      Alert.alert(`Error (${status ?? 'red'})`, msg);
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const columns = dataRes?.columns ?? [];
  const dateCol = detectDateColumn(columns);
  const catCol = detectCategoryColumn(columns);
  const numCols = columns.filter((c) => {
    const sample = dataRes?.data[0]?.[c];
    return sample !== undefined && !isNaN(Number(sample));
  });

  const showLineChart = !!dateCol && numCols.length > 0;
  const showBarChart = !showLineChart && !!catCol;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Info card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información</Text>
        <Text style={styles.ingestorName}>{ingestor.name}</Text>
        {ingestor.description ? (
          <Text style={styles.ingestorDesc}>{ingestor.description}</Text>
        ) : null}
        <View style={styles.row}>
          <StatusBadge status={ingestor.status} />
          <Text style={styles.metaText}>  Tipo: {ingestor.source_type}</Text>
        </View>
      </View>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {successMsg && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}

      {/* Upload card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cargar Archivo</Text>
        <Text style={styles.hint}>CSV, JSON o Excel (.xlsx). El archivo se procesará con el ingestor.</Text>

        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.accent} size="large" />
            <Text style={styles.loadingText}>Procesando archivo...</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${uploadProgress}%` as any }]} />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        ) : (
          <>
            {selectedFile && (
              <View style={styles.filePreview}>
                <Text style={styles.fileName} numberOfLines={1}>📄  {selectedFile.name}</Text>
                {selectedFile.size != null && (
                  <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFile}>
              <Text style={styles.uploadBtnText}>
                {selectedFile ? '🔄  Cambiar archivo' : '📁  Seleccionar archivo'}
              </Text>
            </TouchableOpacity>

            {selectedFile && (
              <TouchableOpacity
                style={error ? styles.retryBtn : styles.ingestBtn}
                onPress={handleIngest}
              >
                <Text style={error ? styles.retryBtnText : styles.ingestBtnText}>
                  {error ? '↺  Reintentar' : '⚡  Ingestar'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.mockBtn} onPress={handleMockUpload}>
              <Text style={styles.mockBtnText}>🧪  Cargar datos de prueba</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Data section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Datos Transformados</Text>

        {loadingData ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
        ) : dataRes ? (
          <>
            {/* Summary */}
            <View style={styles.summaryRow}>
              <SummaryChip label="Filas" value={String(dataRes.summary.totalRows)} />
              <SummaryChip label="Columnas" value={String(dataRes.summary.totalColumns)} />
              <SummaryChip label="Página" value={`${dataRes.page}`} />
            </View>

            {/* Chart */}
            {showLineChart && numCols[0] && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Tendencia — {numCols[0]}</Text>
                <LineChart
                  data={buildLineData(dataRes.data, dateCol!, numCols[0])}
                  width={300}
                  height={180}
                  color={COLORS.accent}
                  dataPointsColor={COLORS.accent}
                  xAxisColor={COLORS.border}
                  yAxisColor={COLORS.border}
                  xAxisLabelTextStyle={{ color: COLORS.textSecondary, fontSize: 9 }}
                  yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 9 }}
                  hideDataPoints={false}
                  curved
                  backgroundColor={COLORS.background}
                />
              </View>
            )}
            {showBarChart && catCol && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Distribución — {catCol}</Text>
                <BarChart
                  data={buildBarData(dataRes.data, catCol)}
                  width={300}
                  height={180}
                  barWidth={28}
                  xAxisColor={COLORS.border}
                  yAxisColor={COLORS.border}
                  xAxisLabelTextStyle={{ color: COLORS.textSecondary, fontSize: 9 }}
                  yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 9 }}
                  backgroundColor={COLORS.background}
                />
              </View>
            )}

            {/* Table */}
            <ScrollView horizontal>
              <View>
                {/* Header */}
                <View style={styles.tableRow}>
                  {columns.slice(0, 6).map((col) => (
                    <Text key={col} style={[styles.tableCell, styles.tableHeader]}>
                      {col}
                    </Text>
                  ))}
                </View>
                {/* Rows */}
                {dataRes.data.slice(0, 15).map((row, i) => (
                  <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                    {columns.slice(0, 6).map((col) => (
                      <Text key={col} style={styles.tableCell} numberOfLines={1}>
                        {formatCellValue(col, String(row[col] ?? ''))}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Pagination */}
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                onPress={() => { const p = page - 1; setPage(p); loadData(p); }}
                disabled={page <= 1}
              >
                <Text style={styles.pageBtnText}>← Anterior</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>Pág. {page}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, dataRes.data.length < (dataRes.pageSize ?? 20) && styles.pageBtnDisabled]}
                onPress={() => { const p = page + 1; setPage(p); loadData(p); }}
                disabled={dataRes.data.length < (dataRes.pageSize ?? 20)}
              >
                <Text style={styles.pageBtnText}>Siguiente →</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.noData}>Sin datos. Carga un archivo para comenzar.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryChip}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  ingestorName: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  ingestorDesc: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { color: COLORS.textSecondary, fontSize: 13 },
  hint: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 14 },
  filePreview: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  fileSize: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  uploadBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  ingestBtn: {
    marginTop: 10,
    backgroundColor: COLORS.accent + 'DD',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  ingestBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  retryBtn: {
    marginTop: 10,
    backgroundColor: '#FF6B35',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  mockBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  mockBtnText: { color: COLORS.accent, fontWeight: '700', fontSize: 15 },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: COLORS.accent },
  progressText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  successBanner: {
    backgroundColor: COLORS.success + '22',
    borderColor: COLORS.success,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  successText: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryChip: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryValue: { color: COLORS.accent, fontSize: 20, fontWeight: '800' },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  chartContainer: { marginBottom: 16 },
  chartTitle: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8, fontWeight: '600' },
  tableRow: { flexDirection: 'row' },
  tableRowAlt: { backgroundColor: COLORS.background },
  tableCell: {
    color: COLORS.textPrimary,
    fontSize: 12,
    width: 110,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  tableHeader: {
    color: COLORS.accent,
    fontWeight: '700',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  pageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  pageBtnDisabled: { borderColor: COLORS.border, opacity: 0.4 },
  pageBtnText: { color: COLORS.accent, fontWeight: '700', fontSize: 13 },
  pageInfo: { color: COLORS.textSecondary, fontSize: 13 },
  noData: { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20, fontSize: 14 },
});
