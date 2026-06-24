// Socket.IO namespace — must match the server RoomGateway @WebSocketGateway({ namespace }).
// It's an application contract (identical in every environment), so it lives in code, not env.
const ROOM_WS_NAMESPACE = '/ws/room';

// The WS origin (scheme + host + port) is env-driven:
//   dev  -> ${APP_DOMAIN}:${API_PORT}  (API exposed directly)
//   prod -> ${APP_DOMAIN}              (same origin; nginx proxies /socket.io/ on 443)
export const getRoomSocketUrl = () => {
  const origin = process.env.NEXT_PUBLIC_WS_ORIGIN;
  return origin ? `${origin}${ROOM_WS_NAMESPACE}` : '';
};
