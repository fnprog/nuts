import { type } from "@nuts/validation";

export const accountFormSchema = type({
  name: "string>=1",
  balance: "number>=0",
  currency: "string>=1",
  type: "'cash' | 'momo' | 'credit' | 'investment' | 'checking' | 'savings' | 'loan' | 'other'",
  "subtype?": "string",
});

export type AccountSchema = typeof accountFormSchema.infer;
export type AccountSubmit = (values: AccountSchema) => void;
