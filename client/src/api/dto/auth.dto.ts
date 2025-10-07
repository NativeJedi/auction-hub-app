export type AuthDto = {
  email: string;
  password: string;
};

export type AuthTokensDto = {
  accessToken: string;
  refreshToken: string;
};
export type AuthResponseDto = {
  user: {
    id: string;
    email: string;
  };
} & AuthTokensDto;
