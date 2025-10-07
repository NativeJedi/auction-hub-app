import { AxiosResponse } from 'axios';
import { NextResponse } from 'next/server';

export const forwardSetCookieHeader = ({ headers }: AxiosResponse, nextResponse: NextResponse) => {
  const setCookie = headers['set-cookie'];

  if (!setCookie) return null;

  if (Array.isArray(setCookie)) {
    setCookie.forEach((cookie) => nextResponse.headers.append('set-cookie', cookie));
  } else {
    nextResponse.headers.set('set-cookie', setCookie);
  }
};
