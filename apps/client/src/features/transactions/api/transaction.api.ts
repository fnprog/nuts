import { api } from "@/lib/ky";
import { RecordCreateSchema, RecordSchema, TransactionsResponse, RecordUpdateSchema } from "../services/transaction.types";

const BASEURI = "/transactions";

function buildUrlWithParams(baseUrl: string, params: Record<string, unknown>): string {
  const url = new URL(baseUrl, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.append(key, String(value));
    }
  });

  return `${url.pathname}${url.search}`;
}

export interface GetTransactionsParams {
  page: number;
  q?: string;
  group_by?: string;
  account_id?: string;
  category_id?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  currency?: string;
  limit?: number;
}

export const getTransactions = async (params: GetTransactionsParams): Promise<TransactionsResponse> => {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

  const url = buildUrlWithParams(`${BASEURI}/`, { limit: 25, ...cleanParams });

  return await api.get(url).json<TransactionsResponse>();
};

export const deleteTransactions = async (ids: string[] | string) => {
  await api.delete(`${BASEURI}`, { json: ids });
};

export const getTransaction = async (id: string): Promise<RecordSchema> => {
  return await api.get(`${BASEURI}/${id}`).json<RecordSchema>();
};

export const updateTransaction = async (id: string, updatedTransactions: RecordUpdateSchema): Promise<RecordSchema> => {
  return await api.put(`${BASEURI}/${id}`, { json: updatedTransactions }).json<RecordSchema>();
};

export const createTransaction = async (transaction: RecordCreateSchema): Promise<RecordSchema[]> => {
  const uri = transaction.type === "transfer" ? `${BASEURI}/transfert` : `${BASEURI}/`;
  return await api.post(uri, { json: transaction }).json<RecordSchema[]>();
};

export const bulkDeleteTransactions = async (transactionIds: string[]): Promise<void> => {
  await api.delete(`${BASEURI}/`, { json: { transaction_ids: transactionIds } });
};

export const bulkUpdateCategories = async (transactionIds: string[], categoryId: string): Promise<void> => {
  await api.put(`${BASEURI}/bulk/categories`, {
    json: {
      transaction_ids: transactionIds,
      category_id: categoryId,
    },
  });
};

export const bulkUpdateManualTransactions = async (params: {
  transactionIds: string[];
  categoryId?: string;
  accountId?: string;
  transactionDatetime?: Date;
}): Promise<void> => {
  const body: Record<string, any> = {
    transaction_ids: params.transactionIds,
  };

  if (params.categoryId) body.category_id = params.categoryId;
  if (params.accountId) body.account_id = params.accountId;
  if (params.transactionDatetime) body.transaction_datetime = params.transactionDatetime.toISOString();

  await api.put(`${BASEURI}/bulk/manual`, { json: body });
};

export const bulkCreateTransactions = async (params: {
  accountId: string;
  transactions: RecordCreateSchema[];
}): Promise<{ created_count: number; error_count: number; total_requested: number; errors?: string[] }> => {
  return await api.post(`${BASEURI}/bulk`, {
    json: {
      account_id: params.accountId,
      transactions: params.transactions,
    },
  }).json<{ created_count: number; error_count: number; total_requested: number; errors?: string[] }>();
};
