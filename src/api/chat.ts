import axios from 'axios';
import { BASE_URL } from '../constants';
import { ChatResponse } from '../types';

const api = axios.create({ baseURL: BASE_URL });

export async function sendChatMessage(
  message: string,
  ingestor_id?: string
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/api/chat', {
    message,
    ...(ingestor_id ? { ingestor_id } : {}),
  });
  return data;
}
