import axios from 'axios';
import { BASE_URL } from '../constants';
import { Ingestor, TransformedDataResponse, IngestResponse } from '../types';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'x-vercel-protection-bypass': 'jkURsFWJq3k8DpKoDDOU384UbGsmopdU' },
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
  form.append('ingestor_id', ingestor_id);

  const { data } = await api.post<IngestResponse>('/api/ingest', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
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
