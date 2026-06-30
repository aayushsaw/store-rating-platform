export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  NORMAL_USER = 'NORMAL_USER',
  STORE_OWNER = 'STORE_OWNER',
}

export const USER_ROLES = Object.values(UserRole) as UserRole[];

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export const VALIDATION = {
  name: { min: 20, max: 60 },
  address: { max: 400 },
  password: { min: 8, max: 16 },
} as const;

export type SortOrder = 'asc' | 'desc';

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}
