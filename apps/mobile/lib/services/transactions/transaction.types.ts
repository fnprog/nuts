export type TransactionType = 'expense' | 'income' | 'transfer';

export interface TransactionDetails {
  payment_medium?: string;
  location?: string;
  note?: string;
  payment_status?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  account_id: string;
  category_id: string | null;
  destination_account_id: string | null;
  transaction_datetime: string;
  description: string;
  details?: TransactionDetails;
  transaction_currency: string;
  original_amount: number;
  is_external: boolean;
  updated_at: string;
}

export interface TransactionCreate {
  amount: number;
  type: TransactionType;
  account_id: string;
  category_id?: string;
  destination_account_id?: string;
  transaction_datetime: Date;
  description: string;
  details?: TransactionDetails;
  transaction_currency: string;
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

  static validation(message: string, details?: any): ServiceError {
    return {
      code: 'VALIDATION_ERROR',
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
