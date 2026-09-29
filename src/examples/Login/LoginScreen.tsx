import { useState } from 'react';
import type { FormEvent } from 'react';

import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { Input } from '../../components/Input';
import { Link } from '../../components/Link';
import { PasswordInput } from '../../components/PasswordInput';
import { CenteredCardLayout } from '../../patterns';
import './LoginScreen.css';

export interface LoginScreenSubmitData {
  email: string;
  password: string;
  remember: boolean;
}

export interface LoginScreenProps {
  /**
   * Authentication failure message. Renders a form-level danger `Alert` (with
   * `role="alert"`, since it appears after a submit) at the top of the form — and
   * deliberately **no** field-level error: an auth failure must not reveal or imply which
   * credential was wrong (see docs/patterns/form-validation.md). This is the approved
   * "Login · Error state" screen, expressed as a prop rather than a separate component.
   */
  error?: string;
  /** Forces the submit `Button` into its loading state. */
  loading?: boolean;
  onSubmit?: (data: LoginScreenSubmitData) => void;
  /** Destination of the "Forgot password?" link. */
  forgotPasswordHref?: string;
}

/**
 * Login screen — composed from DS components (Input, PasswordInput, Checkbox, Link,
 * Button, Alert) inside the Centered card layout template. Matches the approved Figma
 * "01 — Login" / "01b — Login · Error state" frames. Not exported from `src/index.ts`.
 */
export function LoginScreen({
  error,
  loading = false,
  onSubmit,
  forgotPasswordHref = '#forgot-password',
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.({ email, password, remember });
  };

  return (
    <CenteredCardLayout title="Welcome back" description="Log in to your account to continue.">
      <form className="ds-example-login__form" onSubmit={handleSubmit}>
        {error && (
          // Alert has no default live-region role by design — this one is injected after
          // a failed submit, so the consumer opts in with role="alert".
          <Alert status="danger" title="Couldn't sign you in" role="alert">
            {error}
          </Alert>
        )}
        <Input
          type="email"
          label="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <PasswordInput
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        <div className="ds-example-login__row">
          <Checkbox
            label="Remember me"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <Link href={forgotPasswordHref}>Forgot password?</Link>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="ds-example-login__submit"
        >
          Log in
        </Button>
      </form>

      <p className="ds-example-login__footnote">
        Don&apos;t have an account? Contact your workspace admin.
      </p>
    </CenteredCardLayout>
  );
}

LoginScreen.displayName = 'LoginScreen';
