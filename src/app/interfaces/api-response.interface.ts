export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}
