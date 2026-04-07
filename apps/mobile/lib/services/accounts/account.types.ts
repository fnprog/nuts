export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'investment'
  | 'loan'
  | 'cash'
  | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  is_external: boolean;
  updated_at: string;
  meta: Record<string, any> | null;
}

export interface AccountCreate {
  name: string;
  type: AccountType;
  balance?: number;
  currency: string;
  meta?: Record<string, any> | null;
}

export interface AccountWTrend extends Account {
  trend: number;
  balance_timeseries: { date: Date; balance: number }[];
}

export interface AccountBalanceTimeline {
  month: Date;
  balance: number;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

export type Result<T, E = ServiceError> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  readonly ok = true as const;
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }
}

export class Err<T, E> {
  readonly ok = false as const;
  readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }
}

export function ok<T, E = ServiceError>(value: T): Ok<T, E> {
  return new Ok(value);
}

export function err<T, E = ServiceError>(error: E): Err<T, E> {
  return new Err(error);
}

export class ServiceErrorFactory {
  static initialization(message: string, details?: any): ServiceError {
    return {
      code: 'INITIALIZATION_ERROR',
      message,
      details,
    };
  }

  static notFound(resource: string, id: string): ServiceError {
    return {
      code: 'NOT_FOUND',
      message: `${resource} with id ${id} not found`,
    };
  }

  static database(message: string, details?: any): ServiceError {
    return {
      code: 'DATABASE_ERROR',
      message,
      details,
    };
  }

  static unavailable(feature: string): ServiceError {
    return {
      code: 'FEATURE_UNAVAILABLE',
      message: `${feature} is not available in offline mode`,
    };
  }
}
