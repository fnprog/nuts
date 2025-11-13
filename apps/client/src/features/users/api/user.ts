import { api as axios } from "@/lib/axios";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "@/lib/result";

const BASEURI = "/users";

export interface UserInfo {
  id: string;
  email: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
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
  return ResultAsync.fromPromise(
    axios.get<UserInfo>(`${BASEURI}/me`).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

export const updateMe = (info: Partial<UserInfo>) => {
  return ResultAsync.fromPromise(
    axios.put<UserInfo>(`${BASEURI}/me`, info).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

export const createPassword = (password: string) => {
  return ResultAsync.fromPromise(axios.post(`${BASEURI}/me/password`, { password }), ServiceError.fromAxiosError);
};

export const updatePassword = ({ current_password, password }: { current_password: string; password: string }) => {
  return ResultAsync.fromPromise(axios.put(`${BASEURI}/me/password`, { password, current_password }), ServiceError.fromAxiosError);
};

export const updateAvatar = (formData: FormData) => {
  return ResultAsync.fromPromise(
    axios
      .put<{ avatar_url: string }>(`${BASEURI}/me/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data),
    ServiceError.fromAxiosError
  );
};
