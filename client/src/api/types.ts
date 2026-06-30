export type SuccessServerResponse<T> = { status: number; data: T };

export type ErrorServerResponse = { status: number; message: string; reason: string };

export type ServerResponse<T> = SuccessServerResponse<T> | ErrorServerResponse;

export type QueryParams = { [key: string]: string | number | boolean };

export const isServerErrorResponse = <T>(
  response: ServerResponse<T>
): response is ErrorServerResponse => response.status >= 400;
