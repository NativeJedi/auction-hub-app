export type CombinedKey = string | Record<string, string | number>;

export class BaseRepository {
  private readonly baseKey: string;

  constructor(baseKey: string) {
    this.baseKey = baseKey;
  }

  getFullKey(key: CombinedKey) {
    if (typeof key === 'string') {
      const parsedKey = encodeURIComponent(key);

      return `${this.baseKey}:${parsedKey}`;
    }

    const keys = Object.entries(key).map(
      ([key, value]) => `${encodeURIComponent(key)}:${value}`,
    );

    return `${this.baseKey}:${keys.join(':')}`;
  }
}
