import { api } from "@/lib/ky";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "@/lib/result";

const BASEURI = "/users";

export interface UserInfo {
  id: string;
  email: string;
  avatar_url?: string;
  name?: string;
  mfa_enabled: boolean;
  createdAt: string;
  updatedAt: string;
  has_password: boolean;
  linked_accounts?: LinkedAccount[];
}

export interface LinkedAccount {
  id: string;
  provider: "apple" | "google";
  created_at: Date;
}

export const getMe = () => {
  return ResultAsync.fromPromise(api.get(`${BASEURI}/me`).json<UserInfo>(), ServiceError.fromKyError);
};

export const updateMe = (info: Partial<UserInfo>) => {
  return ResultAsync.fromPromise(api.put(`${BASEURI}/me`, { json: info }).json<UserInfo>(), ServiceError.fromKyError);
};

export const createPassword = (password: string) => {
  return ResultAsync.fromPromise(api.post(`${BASEURI}/me/password`, { json: { password } }), ServiceError.fromKyError);
};

export const updatePassword = ({ current_password, password }: { current_password: string; password: string }) => {
  return ResultAsync.fromPromise(api.put(`${BASEURI}/me/password`, { json: { password, current_password } }), ServiceError.fromKyError);
};

export const updateAvatar = (formData: FormData) => {
  return ResultAsync.fromPromise(
    api
      .put(`${BASEURI}/me/avatar`, {
        body: formData,
        headers: {}, // Content-Type set automatically for FormData in ky
      })
      .json<{ avatar_url: string }>(),
    ServiceError.fromKyError
  );
};
