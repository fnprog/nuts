import { type } from "@nuts/validation";

export const categorySchema = type({
  id: "string",
  name: "string>=1",
  type: "'income' | 'expense'",
  "parent_id?": "string | null",
  "is_default?": "boolean | null",
  "created_at?": "string",
  updated_at: "string",
  "icon?": "string",
  "color?": "string | null",
});

export const categoryCreateSchema = type({
  name: "string>=1",
  type: "'income' | 'expense'",
  "parent_id?": "string | null",
  "is_default?": "boolean | null",
  "icon?": "string",
  "color?": "string | null",
});

export type Category = typeof categorySchema.infer;
export type CategoryCreate = typeof categoryCreateSchema.infer;
