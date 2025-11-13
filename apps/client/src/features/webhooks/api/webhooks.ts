import { api } from "@/lib/axios";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "@/lib/result";

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
}

export interface CreateWebhookRequest {
  url: string;
  events: string[];
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: string[];
  active?: boolean;
}

const WEBHOOKS_ENDPOINT = "/webhooks";

const getWebhooks = () => {
  return ResultAsync.fromPromise(
    api.get(WEBHOOKS_ENDPOINT).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const createWebhook = (webhook: CreateWebhookRequest) => {
  return ResultAsync.fromPromise(
    api.post(WEBHOOKS_ENDPOINT, webhook).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const updateWebhook = (id: string, webhook: UpdateWebhookRequest) => {
  return ResultAsync.fromPromise(
    api.put(`${WEBHOOKS_ENDPOINT}/${id}`, webhook).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const deleteWebhook = (id: string) => {
  return ResultAsync.fromPromise(api.delete(`${WEBHOOKS_ENDPOINT}/${id}`), ServiceError.fromAxiosError);
};

export const webhooksService = {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
};
