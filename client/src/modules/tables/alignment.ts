export type Alignment = 'left' | 'center' | 'right';

const ALIGNMENT_CLASSES_MAP: Record<Alignment, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
  return ALIGNMENT_CLASSES_MAP[align || 'left'];
};
