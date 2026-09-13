import { useState } from 'react';
import type { FormEvent } from 'react';

import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import './LoginScreen.css';

export interface LoginScreenSubmitData {
  email: string;
  password: string;
  remember: boolean;
}

export interface LoginScreenProps {
  /**
   * When present, renders a danger `Alert` above the form and puts the password `Input`
   * into its `error` state with a matching `errorText` — this is the approved
   * "Login · Error state" screen, expressed as a prop rather than a separate component,
   * since a real login form is one component that can be in either state, not two.
   */
  error?: string;
  /** Forces the submit `Button` into its loading state. */
  loading?: boolean;
  onSubmit?: (data: LoginScreenSubmitData) => void;
  onForgotPassword?: () => void;
}

/**
 * Login screen — composed entirely from existing DS components (Card, Input, Checkbox,
 * Button, Alert). Matches the approved Figma "01 — Login" / "01b — Login · Error state"
 * frames. Not exported from `src/index.ts` — an example composition, not a reusable DS
 * component.
 */
export function LoginScreen({ error, loading = false, onSubmit, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.({ email, password, remember });
  };

  return (
    <div className="ds-example-login">
      <Card variant="outlined" padding="lg" className="ds-example-login__card">
        <h1 className="ds-example-login__heading">Welcome back</h1>
        <p className="ds-example-login__subheading">Log in to your account to continue.</p>

        {error && (
          // Alert has no default ARIA live-region role by design (see Alert.tsx) —
          // it's the consumer's job to opt in when dynamically injecting one, which is
          // exactly this case (appears after a failed submit, not on initial paint).
          <Alert status="danger" title="Couldn't sign you in" role="alert">
            {error}
          </Alert>
        )}

        <form className="ds-example-login__form" onSubmit={handleSubmit}>
          <Input
            type="email"
            label="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            error={Boolean(error)}
            errorText={error ? 'Incorrect password. Please try again.' : undefined}
          />
          <div className="ds-example-login__row">
            <Checkbox
              label="Remember me"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <button type="button" className="ds-example-login__link" onClick={onForgotPassword}>
              Forgot password?
            </button>
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
      </Card>
    </div>
  );
}

LoginScreen.displayName = 'LoginScreen';
