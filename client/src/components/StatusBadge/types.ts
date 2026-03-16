type Variant = 'draft' | 'error' | 'info' | 'success' | 'default';

export type StatusMap<T extends string> = Record<T, Variant>;
