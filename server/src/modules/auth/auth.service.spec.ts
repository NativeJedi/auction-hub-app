describe('AuthService', () => {
  describe('login', () => {
    it.todo(
      'rejects with the generic auth error when the stored user has password === null (Google-only account)',
    );
    it.todo(
      'returns tokens when stored user has a non-null password matching the input',
    );
    it.todo('rejects with the generic auth error when email is unknown');
  });
});
