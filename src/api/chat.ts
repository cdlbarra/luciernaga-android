import { apiClient as api } from '../lib/apiClient';
import { ChatResponse } from '../types';

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

  const { data } = await api.post<ChatResponse>('/api/chat', {
    messages: [{ role: 'user', content: message }],
    model: 'command-light',
    ...(context ? { context } : {}),
  });
  return data;
}
