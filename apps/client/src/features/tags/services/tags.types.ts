import { type } from "@nuts/validation";

export const tagSchema = type({
  id: "string",
  name: "string>=1",
  color: "string",
  "icon?": "string",
  created_at: "string",
});

export const tagCreateSchema = type({
  name: "string>=1",
  color: "string",
  "icon?": "string",
});

export type Tag = typeof tagSchema.infer;
export type TagCreate = typeof tagCreateSchema.infer;
