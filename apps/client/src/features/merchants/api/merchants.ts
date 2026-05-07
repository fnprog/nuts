import { api } from "@/lib/api";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "@/lib/result";

export interface Merchant {
  id: string;
  name: string;
  website?: string;
  category?: string;
}

export interface CreateMerchantRequest {
  name: string;
  website?: string;
  category?: string;
}

export interface UpdateMerchantRequest {
  name?: string;
  website?: string;
  category?: string;
}

const MERCHANTS_ENDPOINT = "/merchants";

const getMerchants = () => {
  return ResultAsync.fromPromise(api.get(MERCHANTS_ENDPOINT).json<Merchant[]>(), ServiceError.fromKyError);
};

const createMerchant = (merchant: CreateMerchantRequest) => {
  return ResultAsync.fromPromise(api.post(MERCHANTS_ENDPOINT, { json: merchant }).json<Merchant>(), ServiceError.fromKyError);
};

const updateMerchant = (id: string, merchant: UpdateMerchantRequest) => {
  return ResultAsync.fromPromise(api.put(`${MERCHANTS_ENDPOINT}/${id}`, { json: merchant }).json<Merchant>(), ServiceError.fromKyError);
};

const deleteMerchant = (id: string) => {
  return ResultAsync.fromPromise(api.delete(`${MERCHANTS_ENDPOINT}/${id}`).json<unknown>(), ServiceError.fromKyError);
};

export const merchantsService = {
  getMerchants,
  createMerchant,
  updateMerchant,
  deleteMerchant,
};
