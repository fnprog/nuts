export interface ValidationFieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  status: string;
  message?: string;
  error?: ValidationFieldError[];
}

export interface ApiSuccessResponse<T = unknown> {
  status: "success";
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  status: "success";
  data: T[];
  meta: PaginationMeta;
}
