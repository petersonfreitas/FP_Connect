export type InternalApiContext = {
  actorUserId: string | null;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const emptyInternalApiContext: InternalApiContext = {
  actorUserId: null
};

export function readInternalApiContext(
  headers: Record<string, string | string[] | undefined>
): InternalApiContext {
  const actorUserId = readSingleHeader(headers["x-fp-actor-user-id"]);

  if (!actorUserId || !uuidPattern.test(actorUserId)) {
    return emptyInternalApiContext;
  }

  return {
    actorUserId
  };
}

function readSingleHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
