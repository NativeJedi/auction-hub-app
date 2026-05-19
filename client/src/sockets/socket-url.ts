export const getRoomSocketUrl = () => {
  if (typeof window === 'undefined') return '';
  return `${window.location.protocol}//${window.location.hostname}:3000/ws/room`;
};
