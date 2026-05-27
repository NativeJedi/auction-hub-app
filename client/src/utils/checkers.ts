export const isObject = (obj: unknown): obj is object =>
  Boolean(obj && typeof obj === 'object' && !Array.isArray(obj));

export const isObjectWithProperty = (
  obj: unknown,
  prop: string
): obj is object & Record<string, unknown> => {
  return isObject(obj) && prop in obj;
};

export const isObjectWithProperties = <T extends object>(
  obj: unknown,
  props: string[]
): obj is object & T => {
  return isObject(obj) && props.every((prop) => prop in obj);
};

export const isString = (value: unknown): value is string => typeof value === 'string';

/** Narrows `obj` to `Record<K, unknown>`, giving typed access to `obj[key]` without casts. */
export const hasProperty = <K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> =>
  isObject(obj) && key in obj;

/**
 * Type guard for API error objects of shape `{ data: { [key]: value } }`.
 * Eliminates all casts when checking specific server error codes.
 *
 * @example
 * hasErrorData(error, 'message', 'EMAIL_NOT_VERIFIED')
 * hasErrorData(error, 'statusCode', 429)
 */
export const hasErrorData = <K extends string, V>(
  error: unknown,
  key: K,
  value: V
): error is { data: Record<K, V> } => {
  if (!hasProperty(error, 'data')) return false;
  const { data } = error;
  if (!hasProperty(data, key)) return false;
  return data[key] === value;
};
