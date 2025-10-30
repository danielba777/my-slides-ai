const OWNERSHIP_BOOLEAN_FIELDS = [
  "isOwnedByUser",
  "ownedByUser",
  "isUserOwned",
  "belongsToUser",
];

const OWNER_CANDIDATE_KEYS = [
  "ownerId",
  "ownerUserId",
  "userId",
  "createdByUserId",
  "createdById",
  "createdBy",
  "creatorId",
  "creatorUserId",
  "createdByUser",
  "authorId",
  "owner",
  "user",
  "creator",
  "author",
  "profile",
  "account",
  "team",
  "owners",
  "users",
  "members",
  "collaborators",
  "contributors",
  "participants",
];

const NESTED_OWNER_KEYS = ["id", "userId", "ownerId", "creatorId", "authorId", "createdById"];

export function normalizeOwnershipFlag(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

function matchesUserId(value: unknown, userId: string): boolean {
  if (value == null) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => matchesUserId(item, userId));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return NESTED_OWNER_KEYS.some((key) => {
      const nestedValue = record?.[key];
      if (nestedValue == null) {
        return false;
      }
      return String(nestedValue) === userId;
    });
  }

  return String(value) === userId;
}

export function isImageSetOwnedByUser(
  set: Record<string, any>,
  userId: string | null,
  forceOwned = false,
): boolean {
  if (!set || typeof set !== "object") {
    return false;
  }

  const explicitOwnership = OWNERSHIP_BOOLEAN_FIELDS.some((field) =>
    normalizeOwnershipFlag(set?.[field]),
  );

  if (explicitOwnership || forceOwned) {
    return true;
  }

  if (!userId) {
    return explicitOwnership;
  }

  return OWNER_CANDIDATE_KEYS.some((field) =>
    matchesUserId(set?.[field], userId),
  );
}

export function annotateImageSetOwnership<T extends Record<string, any>>(
  set: T,
  userId: string | null,
  forceOwned = false,
): T {
  if (!set || typeof set !== "object") {
    return set;
  }

  const isOwned = isImageSetOwnedByUser(set, userId, forceOwned);

  let normalizedChildren: Array<Record<string, any>> | undefined;
  if (Array.isArray((set as Record<string, any>).children)) {
    const children = (set as Record<string, any>).children as Array<
      Record<string, any>
    >;
    let childrenChanged = false;
    normalizedChildren = children.map((child) => {
      const normalizedChild = annotateImageSetOwnership(
        child,
        userId,
        forceOwned && isOwned,
      );
      if (normalizedChild !== child) {
        childrenChanged = true;
      }
      return normalizedChild;
    });
    if (!childrenChanged) {
      normalizedChildren = undefined;
    }
  }

  const shouldPatchFlag =
    isOwned && !normalizeOwnershipFlag((set as Record<string, any>).isOwnedByUser);

  if (!shouldPatchFlag && normalizedChildren === undefined) {
    return set;
  }

  return {
    ...set,
    ...(shouldPatchFlag ? { isOwnedByUser: true } : {}),
    ...(normalizedChildren ? { children: normalizedChildren } : {}),
  };
}

export const ownershipConstants = {
  OWNER_CANDIDATE_KEYS,
  NESTED_OWNER_KEYS,
};
