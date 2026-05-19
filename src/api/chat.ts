import axios from 'axios';
import { BASE_URL } from '../constants';
import { ChatResponse } from '../types';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'x-vercel-protection-bypass': 'jkURsFWJq3k8DpKoDDOU384UbGsmopdU' },
});

export async function sendChatMessage(
  message: string,
  ingestor_id?: string
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/api/chat', {
    messages: [{ role: 'user', content: message }],
    model: 'command-r',
    ...(ingestor_id ? { context: { ingestor_id } } : {}),
  });
  return data;
}
