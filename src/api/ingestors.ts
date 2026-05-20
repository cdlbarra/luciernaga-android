import axios from 'axios';
import { BASE_URL } from '../constants';
import { Ingestor, TransformedDataResponse, IngestResponse } from '../types';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-vercel-protection-bypass': 'jkURsFWJq3k8DpKoDDOU384UbGsmopdU',
    'Accept': 'application/json; charset=utf-8',
  },
});

export async function getIngestors(): Promise<Ingestor[]> {
  const { data } = await api.get<Ingestor[]>('/api/ingestors');
  return data;
}

export async function createIngestor(payload: {
  name: string;
  description: string;
  source_type: string;
}): Promise<Ingestor> {
  const { data } = await api.post<Ingestor>('/api/ingestors', payload);
  return data;
}

export async function deleteIngestor(id: string): Promise<void> {
  await api.delete(`/api/ingestors/${id}`);
}

export async function deleteIngestorsBatch(ids: string[]): Promise<void> {
  await api.delete('/api/ingestors/batch', { data: { ids } });
}

export async function ingestFile(
  file: { uri: string; name: string; mimeType: string },
  ingestor_id: string,
  onProgress?: (pct: number) => void
): Promise<IngestResponse> {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);

  const { data } = await api.post<IngestResponse>(`/api/ingest?ingestor_id=${ingestor_id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
}

const MOCK_ROWS = [
  { fecha: '2024-01-05', producto: 'Laptop', categoria: 'Electronica', cantidad: 3, precio: 1200, total: 3600 },
  { fecha: '2024-01-12', producto: 'Monitor', categoria: 'Electronica', cantidad: 5, precio: 350, total: 1750 },
  { fecha: '2024-02-03', producto: 'Teclado', categoria: 'Perifericos', cantidad: 10, precio: 80, total: 800 },
  { fecha: '2024-02-18', producto: 'Mouse', categoria: 'Perifericos', cantidad: 15, precio: 40, total: 600 },
  { fecha: '2024-03-07', producto: 'Auriculares', categoria: 'Audio', cantidad: 8, precio: 150, total: 1200 },
  { fecha: '2024-03-22', producto: 'Webcam', categoria: 'Perifericos', cantidad: 6, precio: 90, total: 540 },
  { fecha: '2024-04-10', producto: 'Laptop', categoria: 'Electronica', cantidad: 2, precio: 1300, total: 2600 },
  { fecha: '2024-04-25', producto: 'Tablet', categoria: 'Electronica', cantidad: 4, precio: 450, total: 1800 },
  { fecha: '2024-05-08', producto: 'Monitor', categoria: 'Electronica', cantidad: 3, precio: 380, total: 1140 },
  { fecha: '2024-05-30', producto: 'Teclado', categoria: 'Perifericos', cantidad: 12, precio: 75, total: 900 },
];

export async function ingestMockData(ingestor_id: string): Promise<IngestResponse> {
  const { data } = await api.post<IngestResponse>('/api/ingest', {
    source: { data: MOCK_ROWS, source_type: 'csv' },
    ingestor_id,
  });
  return data;
}

export async function getTransformedData(
  ingestor_id: string,
  page = 1
): Promise<TransformedDataResponse> {
  const { data } = await api.get<any>(
    `/api/transformed-data?ingestor_id=${ingestor_id}&page=${page}`
  );
  return {
    data: data.rows ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    pageSize: 10,
    columns: data.columns ?? [],
    summary: {
      totalRows: data.total ?? 0,
      totalColumns: data.columns?.length ?? 0,
      columnTypes: data.columnTypes ?? {},
    },
  };
}
