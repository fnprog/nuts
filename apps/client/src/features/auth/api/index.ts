import { api } from "@/lib/ky";
import { ResultAsync, ServiceError } from "@/lib/result";
import { InitMFASchema, LoginFormValues, LoginResponse, RefreshAuthRes, SessionSchema, SignupFormValues } from "../services/auth.types";

const BASEURI = "/auth";

const signup = (credentials: SignupFormValues) => {
  return ResultAsync.fromPromise(
    api.post(`${BASEURI}/signup`, { json: credentials }).json<unknown>(),
    ServiceError.fromKyError
  );
};

const login = (credentials: LoginFormValues): ResultAsync<LoginResponse, ServiceError> => {
  return ResultAsync.fromPromise(
    api.post(`${BASEURI}/login`, { json: credentials }).json<LoginResponse>(),
    ServiceError.fromKyError
  );
};

const logout = () => {
  return ResultAsync.fromPromise(
    api.post(`${BASEURI}/logout`).then(() => {}),
    ServiceError.fromKyError
  );
};

const refresh = () => {
  return ResultAsync.fromPromise(
    api.post(`${BASEURI}/refresh`).json<RefreshAuthRes>(),
    ServiceError.fromKyError
  );
};

const initiateMfaSetup = () => {
  return ResultAsync.fromPromise(
    api.post(`${BASEURI}/mfa/generate`).json<InitMFASchema>(),
    ServiceError.fromKyError
  );
};

const verifyMfaSetup = (code: string) => {
  return ResultAsync.fromPromise(
    api.post(`${BASEURI}/mfa/enable`, { json: { otp: code } }).then(() => {}),
    ServiceError.fromKyError
  );
};

const disableMfa = () => {
  return ResultAsync.fromPromise(
    api.delete(`${BASEURI}/mfa/disable`).then(() => {}),
    ServiceError.fromKyError
  );
};

const getSessions = () => {
  return ResultAsync.fromPromise(
    api.get(`${BASEURI}/sessions`).json<SessionSchema[]>(),
    ServiceError.fromKyError
  );
};

const revokeSession = (sessionId: string) => {
  return ResultAsync.fromPromise(
    api.delete(`${BASEURI}/sessions/${sessionId}/logout`).then(() => {}),
    ServiceError.fromKyError
  );
};

const unlinkSocialAccount = (provider: "google" | "apple") => {
  return ResultAsync.fromPromise(
    api.delete(`${BASEURI}/oauth/${provider}/unlink`).then(() => {}),
    ServiceError.fromKyError
  );
};

const revokeAllOtherSessions = () => {
  return ResultAsync.fromPromise(
    api.delete(`${BASEURI}/sessions`).then(() => {}),
    ServiceError.fromKyError
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
