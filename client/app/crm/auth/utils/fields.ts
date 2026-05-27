import { FormField } from '@/src/modules/forms';
import { z } from 'zod';

const validationSchema = z.object({
  email: z.string().email('Incorrect email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});

export type FormValues = {
  email: string;
  password: string;
};

const EmailField: FormField = {
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'you@example.com',
  autoComplete: 'email',
};
const PasswordField: FormField = {
  name: 'password',
  type: 'password',
  label: 'Password',
  placeholder: '••••••••',
  autoComplete: 'new-password',
};

export { EmailField, PasswordField, validationSchema };
