import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PasswordInput } from '../../components/PasswordInput';

const meta: Meta = {
  title: 'Patterns/Form validation',
  parameters: {
    docs: {
      description: {
        component:
          'Two failure kinds, two treatments. **Client-side field errors**: each invalid ' +
          'field shows `error` + `errorText` (sets `aria-invalid` / `aria-describedby`) and ' +
          'focus moves to the first invalid field. **Form-level failures** (authentication, ' +
          'server): one danger Alert with `role="alert"` at the top of the form and no field ' +
          'blamed. See `docs/patterns/form-validation.md`.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj;

export const FieldErrors: Story = {
  name: 'Client-side field errors',
  parameters: {
    docs: {
      description: {
        story: 'Submit empty: both fields error and focus moves to the email field.',
      },
    },
  },
  render: function FieldErrorsStory() {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const next: typeof errors = {};
      if (!String(data.get('email')).includes('@'))
        next.email = 'Enter an email address, like name@example.com.';
      if (String(data.get('password')).length < 12)
        next.password = 'Password must be at least 12 characters.';
      setErrors(next);
      if (next.email) emailRef.current?.focus();
      else if (next.password) passwordRef.current?.focus();
    };
    return (
      <form
        noValidate
        onSubmit={onSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <Input
          ref={emailRef}
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          error={Boolean(errors.email)}
          errorText={errors.email}
        />
        <PasswordInput
          ref={passwordRef}
          name="password"
          label="New password"
          autoComplete="new-password"
          helperText="At least 12 characters."
          error={Boolean(errors.password)}
          errorText={errors.password}
        />
        <Button type="submit">Create account</Button>
      </form>
    );
  },
};

export const FormLevelError: Story = {
  name: 'Form-level (authentication) error',
  parameters: {
    docs: {
      description: {
        story:
          'Submit: after a short delay a danger Alert (`role="alert"`) announces the failure. ' +
          'Neither field is marked invalid — never reveal which credential was wrong.',
      },
    },
  },
  render: function FormLevelErrorStory() {
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(false);
    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);
      window.setTimeout(() => {
        setLoading(false);
        setError('Your email or password is incorrect. Please try again.');
      }, 600);
    };
    return (
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <Alert status="danger" title="Couldn't sign you in" role="alert">
            {error}
          </Alert>
        )}
        <Input
          type="email"
          label="Email address"
          autoComplete="email"
          defaultValue="jordan@example.com"
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          defaultValue="wrong-password"
        />
        <Button type="submit" loading={loading}>
          Log in
        </Button>
      </form>
    );
  },
};
