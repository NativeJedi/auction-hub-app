describe('GoogleAuthService', () => {
  describe('mintNonce', () => {
    it.todo('returns a 64-char hex string');
    it.todo('stores the nonce in Redis with TTL 60s');
  });

  describe('signIn', () => {
    it.todo(
      'returning user path: findByGoogleId hit returns the existing user, no linkGoogleId, no create, tokens issued',
    );
    it.todo(
      'link path: googleId miss + email hit calls linkGoogleId exactly once and issues tokens',
    );
    it.todo(
      'create path: both lookups miss → creates user with email, googleId, password: null and issues tokens',
    );
    it.todo(
      'rejects with ApiAuthorizationError when payload.email_verified is false',
    );
    it.todo(
      'rejects with ApiAuthorizationError when the nonce key is missing in Redis (expired or never minted)',
    );
    it.todo(
      'rejects with ApiAuthorizationError when payload.nonce mismatches the request nonce',
    );
    it.todo(
      'rejects with ApiAuthorizationError when OAuth2Client.verifyIdToken throws',
    );
    it.todo('deletes the nonce key on the success path');
    it.todo('deletes the nonce key on every rejection path');
  });
});
