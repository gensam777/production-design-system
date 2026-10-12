import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Link } from '../../components/Link';
import { PasswordInput } from '../../components/PasswordInput';
import './MobileLoginScreen.css';

export interface MobileLoginScreenSubmitData {
  email: string;
  password: string;
}

export interface MobileLoginScreenProps {
  /** Forces the submit `Button` into its loading state. */
  loading?: boolean;
  onSubmit?: (data: MobileLoginScreenSubmitData) => void;
  /** Destination of the "Forgot password?" link. */
  forgotPasswordHref?: string;
  /** Destination of the "Create now" link. */
  createAccountHref?: string;
}

/**
 * Mobile Login — a mobile **app** screen, separate from the web `LoginScreen` (not its
 * responsive variant). DS components (Input, PasswordInput, Link, Button) on a plain
 * surface, no card. Fluid to the device viewport; 393px is the Figma reference width.
 * Matches the Figma "Login" frame (1119:740) on Examples / Playground; the device status
 * bar and home indicator in that frame are OS chrome, not part of the screen.
 * Not exported from `packages/react/src/index.ts`.
 */
export function MobileLoginScreen({
  loading = false,
  onSubmit,
  forgotPasswordHref = '#forgot-password',
  createAccountHref = '#create-account',
}: MobileLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.({ email, password });
  };

  return (
    <main className="ds-example-mobile-login">
      <div className="ds-example-mobile-login__content">
        <h1 className="ds-example-mobile-login__title">Log in</h1>

        <form className="ds-example-mobile-login__form" onSubmit={handleSubmit}>
          <div className="ds-example-mobile-login__fields">
            <div className="ds-example-mobile-login__credentials">
              <Input
                size="lg"
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
              <PasswordInput
                size="lg"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Link href={forgotPasswordHref} className="ds-example-mobile-login__forgot">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="ds-example-mobile-login__submit"
          >
            Log in
          </Button>
        </form>

        <p className="ds-example-mobile-login__prompt">
          <span>Don&apos;t have an account?</span>
          <Link href={createAccountHref}>Create now</Link>
        </p>
      </div>
    </main>
  );
}

MobileLoginScreen.displayName = 'MobileLoginScreen';
