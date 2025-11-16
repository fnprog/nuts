import { UserInfo } from "@/features/users/services/user.service";
import { type } from "@nuts/validation";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;

export const signupSchema = type({
  email: "string.email",
  password: "string>=8",
  "name?": "string",
}).narrow((data, ctx) => {
  if (!passwordPattern.test(data.password)) {
    return ctx.reject({
      path: ["password"],
      message: "Password must contain at least one lowercase letter, one uppercase letter, one number and one special character",
    });
  }
  return true;
});

export const loginSchema = type({
  email: "string.email",
  password: "string>=4",
  "two_fa_code?": "string",
});

export const userSchema = type({
  id: "string",
  email: "string.email",
  "name?": "string",
  created_at: "Date",
  updated_at: "Date",
});

export const userSessionSchema = type({
  id: "string",
  browser_name: "string",
  "device_name?": "string",
  "ip_address?": "string",
  last_used_at: "string",
  location: "string",
  os_name: "string",
});

export type User = typeof userSchema.infer;
export type SignupFormValues = typeof signupSchema.infer;
export type LoginFormValues = typeof loginSchema.infer;
export type SessionSchema = typeof userSessionSchema.infer;

export interface LoginResponse {
  two_fa_required?: boolean;
  access_token?: string;
  refresh_token?: string;
}

export interface ErrorResponse {
  error: string;
  success: boolean;
}

export interface InitMFASchema {
  qr_code_url: string;
  secret: string;
}

export type AuthNullable = UserInfo | null;

export interface RefreshAuthRes {
  access_token: string;
  refresh_token: string;
}
