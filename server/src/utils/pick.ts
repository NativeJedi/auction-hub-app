export function pickFields<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) {
        acc[key] = obj[key];
      }
      return acc;
    },
    {} as Pick<T, K>,
  );
}

export function pickArrayFields<T extends object, K extends keyof T>(
  arr: T[],
  keys: K[],
): Pick<T, K>[] {
  return arr.map((item) => pickFields(item, keys));
}
