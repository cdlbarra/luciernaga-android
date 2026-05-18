export interface Ingestor {
  id: string;
  name: string;
  description: string;
  source_type: string;
  status: 'active' | 'inactive' | 'processing' | 'error';
  created_at: string;
  updated_at: string;
}

export interface TransformedDataRow {
  [key: string]: string | number | boolean | null;
}

export interface TransformedDataResponse {
  data: TransformedDataRow[];
  total: number;
  page: number;
  pageSize: number;
  columns: string[];
  summary: {
    totalRows: number;
    totalColumns: number;
    columnTypes: Record<string, string>;
  };
}

export interface IngestResponse {
  success: boolean;
  message: string;
  rowsProcessed?: number;
  errors?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  content: string;
  show_ingestors_list: boolean;
}

export type RootStackParamList = {
  Main: undefined;
  IngestorDetail: { ingestor: Ingestor };
};

export type BottomTabParamList = {
  Ingestors: undefined;
  Chat: undefined;
};
