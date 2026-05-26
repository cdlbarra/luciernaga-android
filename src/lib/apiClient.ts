import axios from 'axios';
import { BASE_URL } from '../constants';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-vercel-protection-bypass': 'jkURsFWJq3k8DpKoDDOU384UbGsmopdU',
    'Accept': 'application/json; charset=utf-8',
  },
});

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});
