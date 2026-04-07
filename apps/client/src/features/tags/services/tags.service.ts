import { crdtService } from "@/core/sync/crdt";
import { CRDTTag } from "@nuts/types";
import { Tag, TagCreate } from "./tags.types";
import { Result, ok, err, ServiceError } from "@/lib/result";
import { uuidV7 } from "@nuts/utils";

export function createTagsService() {
  let isInitialized = false;

  const ensureInitialized = async (): Promise<Result<void, ServiceError>> => {
    if (!isInitialized) {
      return await initialize();
    }
    return ok(undefined);
  };

  const initialize = async (): Promise<Result<void, ServiceError>> => {
    if (isInitialized) return ok(undefined);

    const crdtResult = await crdtService.initialize();
    if (crdtResult.isErr()) return err(crdtResult.error);

    isInitialized = true;
    console.log("Tags service initialized (offline-first)");
    return ok(undefined);
  };

  const getTags = async (): Promise<Result<Tag[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const crdtTags = crdtService.getTags();

    const tags = Object.values(crdtTags).map((tag) => convertFromCRDTFormat(tag));

    return ok(tags.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const createTag = async (tagData: TagCreate): Promise<Result<Tag, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const id = uuidV7();
    const crdtTag: Omit<CRDTTag, "created_at"> = {
      id,
      name: tagData.name,
      color: tagData.color,
    };

    const createResult = await crdtService.createTag(crdtTag);
    if (createResult.isErr()) return err(createResult.error);

    console.log("Created tag:", id);
    return ok({
      id,
      name: tagData.name,
      color: tagData.color,
      icon: tagData.icon,
      created_at: new Date().toISOString(),
    });
  };

  const updateTag = async (tagId: string, tagData: Partial<TagCreate>): Promise<Result<Tag, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const existingTags = crdtService.getTags();
    const existingTag = existingTags[tagId];

    if (!existingTag) {
      return err(ServiceError.notFound("tag", tagId));
    }

    const updates: Partial<CRDTTag> = {};
    if (tagData.name !== undefined) updates.name = tagData.name;
    if (tagData.color !== undefined) updates.color = tagData.color;

    const updateResult = await crdtService.updateTag(tagId, updates);
    if (updateResult.isErr()) return err(updateResult.error);

    const tags = crdtService.getTags();
    const updatedTag = tags[tagId];

    if (!updatedTag) {
      return err(ServiceError.notFound("tag", tagId));
    }

    console.log("Updated tag:", tagId);
    return ok(convertFromCRDTFormat(updatedTag));
  };

  const deleteTag = async (id: string): Promise<Result<void, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const deleteResult = await crdtService.deleteTag(id);
    if (deleteResult.isErr()) return err(deleteResult.error);

    console.log("Deleted tag:", id);
    return ok(undefined);
  };

  const convertFromCRDTFormat = (crdtTag: CRDTTag): Tag => {
    return {
      id: crdtTag.id,
      name: crdtTag.name,
      color: crdtTag.color,
      icon: undefined,
      created_at: crdtTag.created_at,
    };
  };

  return {
    initialize,
    getTags,
    createTag,
    updateTag,
    deleteTag,
  };
}

export const tagsService = createTagsService();
