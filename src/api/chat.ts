import axios from 'axios';
import { BASE_URL } from '../constants';
import { ChatResponse } from '../types';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'x-vercel-protection-bypass': 'jkURsFWJq3k8DpKoDDOU384UbGsmopdU' },
});

export type ChatDataContext = {
  ingestor_name: string;
  rows: Record<string, unknown>[];
  columns: string[];
  totalRows: number;
};

export async function sendChatMessage(
  message: string,
  ingestor_id?: string,
  dataCtx?: ChatDataContext
): Promise<ChatResponse> {
  let context: Record<string, unknown> | undefined;

  if (ingestor_id) {
    context = { ingestor_id };
    if (dataCtx) {
      context.ingestor_name = dataCtx.ingestor_name;
      context.total_registros = dataCtx.totalRows;
      context.data_preview =
        `Columnas: ${dataCtx.columns.join(', ')}\n` +
        `Total de filas: ${dataCtx.totalRows}\n` +
        `Primeras filas:\n${JSON.stringify(dataCtx.rows.slice(0, 20))}`;
    }
  }

  const response = await api.post<ChatResponse>('/api/chat', {
    messages: [{ role: 'user', content: message }],
    model: 'command-light',
    ...(context ? { context } : {}),
  });
  console.log('RESPUESTA BACKEND COMPLETA:', JSON.stringify(response.data));
  return response.data;
}
