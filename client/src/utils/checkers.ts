export const isObject = (obj: unknown): obj is object =>
  Boolean(obj && typeof obj === 'object' && !Array.isArray(obj));

export const isObjectWithProperty = (
  obj: unknown,
  prop: string
): obj is object & Record<string, unknown> => {
  return isObject(obj) && prop in obj;
};

export const isString = (value: unknown): value is string => typeof value === 'string';
