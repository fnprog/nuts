import { api } from "@/lib/axios";
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
  return ResultAsync.fromPromise(
    api.get(MERCHANTS_ENDPOINT).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const createMerchant = (merchant: CreateMerchantRequest) => {
  return ResultAsync.fromPromise(
    api.post(MERCHANTS_ENDPOINT, merchant).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const updateMerchant = (id: string, merchant: UpdateMerchantRequest) => {
  return ResultAsync.fromPromise(
    api.put(`${MERCHANTS_ENDPOINT}/${id}`, merchant).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const deleteMerchant = (id: string) => {
  return ResultAsync.fromPromise(api.delete(`${MERCHANTS_ENDPOINT}/${id}`), ServiceError.fromAxiosError);
};

export const merchantsService = {
  getMerchants,
  createMerchant,
  updateMerchant,
  deleteMerchant,
};
