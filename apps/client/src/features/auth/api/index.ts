import { api as axios } from "@/lib/axios";
import { ResultAsync, ServiceError } from "@/lib/result";
import { InitMFASchema, LoginFormValues, LoginResponse, RefreshAuthRes, SessionSchema, SignupFormValues } from "../services/auth.types";
import { AxiosResponse } from "axios";

const BASEURI = "/auth";

const signup = (credentials: SignupFormValues) => {
  return ResultAsync.fromPromise(
    axios.post<unknown>(`${BASEURI}/signup`, credentials).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const login = (credentials: LoginFormValues): ResultAsync<AxiosResponse<LoginResponse>, ServiceError> => {
  return ResultAsync.fromPromise(axios.post<LoginResponse>(`${BASEURI}/login`, credentials), ServiceError.fromAxiosError);
};

const logout = () => {
  return ResultAsync.fromPromise(
    axios.post(`${BASEURI}/logout`).then(() => {}),
    ServiceError.fromAxiosError
  );
};

const refresh = () => {
  return ResultAsync.fromPromise(
    axios.post<RefreshAuthRes>(`${BASEURI}/refresh`).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const initiateMfaSetup = () => {
  return ResultAsync.fromPromise(
    axios.post<InitMFASchema>(`${BASEURI}/mfa/generate`).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const verifyMfaSetup = (code: string) => {
  return ResultAsync.fromPromise(
    axios.post(`${BASEURI}/mfa/enable`, { otp: code }).then(() => {}),
    ServiceError.fromAxiosError
  );
};

const disableMfa = () => {
  return ResultAsync.fromPromise(
    axios.delete(`${BASEURI}/mfa/disable`).then(() => {}),
    ServiceError.fromAxiosError
  );
};

const getSessions = () => {
  return ResultAsync.fromPromise(
    axios.get<SessionSchema[]>(`${BASEURI}/sessions`).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const revokeSession = (sessionId: string) => {
  return ResultAsync.fromPromise(
    axios.delete(`${BASEURI}/sessions/${sessionId}/logout`).then(() => {}),
    ServiceError.fromAxiosError
  );
};

const unlinkSocialAccount = (provider: "google" | "apple") => {
  return ResultAsync.fromPromise(
    axios.delete(`${BASEURI}/oauth/${provider}/unlink`).then(() => {}),
    ServiceError.fromAxiosError
  );
};

const revokeAllOtherSessions = () => {
  return ResultAsync.fromPromise(
    axios.delete(`${BASEURI}/sessions`).then(() => {}),
    ServiceError.fromAxiosError
  );
};

export const authApi = {
  signup,
  logout,
  login,
  refresh,
  verifyMfaSetup,
  initiateMfaSetup,
  disableMfa,
  getSessions,
  revokeSession,
  unlinkSocialAccount,
  revokeAllOtherSessions,
} as const;
