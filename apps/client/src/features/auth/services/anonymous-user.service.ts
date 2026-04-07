import { Result, ok, err, ServiceError } from "@/lib/result";
import { uuidV7 } from "@nuts/utils";

export interface AnonymousUser {
  id: string;
  name: string;
  avatar: string;
  isAnonymous: true;
  createdAt: string;
}

export function createAnonymousUserService() {
  const storageKey = "nuts-anonymous-user";
  let anonymousUser: AnonymousUser | null = null;

  const initialize = async (): Promise<Result<void, ServiceError>> => {
    try {
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        try {
          anonymousUser = JSON.parse(stored);
          console.log("Loaded existing anonymous user:", anonymousUser?.id);
        } catch (error) {
          console.warn("Failed to load anonymous user, creating new one:", error);
          anonymousUser = createAnonymousUser();
        }
      } else {
        anonymousUser = createAnonymousUser();
      }

      return ok(undefined);
    } catch (error) {
      return err(
        ServiceError.internal(
          "anonymous-user-init",
          error instanceof Error ? error.message : "Failed to initialize anonymous user",
          error
        )
      );
    }
  };

  const createAnonymousUser = (): AnonymousUser => {
    const user: AnonymousUser = {
      id: uuidV7(),
      name: "",
      avatar: "",
      isAnonymous: true,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(user));
    console.log("Created new anonymous user:", user.id);

    return user;
  };

  const getAnonymousUser = (): AnonymousUser | null => {
    return anonymousUser;
  };

  const getUserId = (): string => {
    if (!anonymousUser) {
      initialize();
    }
    return anonymousUser!.id;
  };

  const clearAnonymousUser = (): void => {
    localStorage.removeItem(storageKey);
    anonymousUser = null;
    console.log("Cleared anonymous user");
  };

  const updateAnonymousUser = (data: Partial<AnonymousUser>): AnonymousUser => {
    if (!anonymousUser) {
      throw Error("tried to update an anonymous user while not being one")
    }

    anonymousUser = {
      ...anonymousUser,
      ...data
    }

    return anonymousUser
  }

  return {
    initialize,
    getAnonymousUser,
    getUserId,
    clearAnonymousUser,
    updateAnonymousUser
  };
}

export const anonymousUserService = createAnonymousUserService();
