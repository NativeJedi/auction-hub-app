export class FormServerValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string
  ) {
    super(message);
    this.name = 'FormServerValidationError';
  }
}

export const isFormFieldError = (error: unknown): error is FormServerValidationError =>
  error instanceof FormServerValidationError;
