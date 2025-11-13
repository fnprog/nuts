import { api } from "@/lib/axios";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "@/lib/result";

export interface Tag {
  id: string;
  name: string;
  icon: string;
}

export interface CreateTagRequest {
  name: string;
  icon: string;
}

export interface UpdateTagRequest {
  name?: string;
  icon?: string;
}

const TAGS_ENDPOINT = "/tags";

const getTags = () => {
  return ResultAsync.fromPromise(
    api.get(TAGS_ENDPOINT).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const createTag = (tag: CreateTagRequest) => {
  return ResultAsync.fromPromise(
    api.post(TAGS_ENDPOINT, tag).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const updateTag = (id: string, tag: UpdateTagRequest) => {
  return ResultAsync.fromPromise(
    api.put(`${TAGS_ENDPOINT}/${id}`, tag).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const deleteTag = (id: string) => {
  return ResultAsync.fromPromise(api.delete(`${TAGS_ENDPOINT}/${id}`), ServiceError.fromAxiosError);
};

export const tagsService = {
  getTags,
  createTag,
  updateTag,
  deleteTag,
};
