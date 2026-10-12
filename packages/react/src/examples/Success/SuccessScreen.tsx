import { Alert } from '../../components/Alert';
import { ButtonLink } from '../../components/ButtonLink';
import { CenteredCardLayout } from '../../patterns';
import './SuccessScreen.css';

export interface SuccessScreenProps {
  /** Destination of the "Back to dashboard" call to action. */
  dashboardHref?: string;
}

/**
 * Success / confirmation screen — Alert and ButtonLink inside the Centered card layout
 * template. "Back to dashboard" navigates, so it's a ButtonLink (a real `<a href>`) that
 * keeps the approved primary-button design. Matches the approved Figma "04 — Success"
 * frame.
 */
export function SuccessScreen({ dashboardHref = '#dashboard' }: SuccessScreenProps) {
  return (
    <CenteredCardLayout
      width="regular"
      title="You're all set"
      description="Your workspace is ready to go. You can invite teammates and start customizing things from here."
    >
      <Alert status="success" title="Workspace created">
        You&apos;ll receive a confirmation email shortly with your account details.
      </Alert>
      <ButtonLink href={dashboardHref} variant="primary" className="ds-example-success__continue">
        Back to dashboard
      </ButtonLink>
    </CenteredCardLayout>
  );
}

SuccessScreen.displayName = 'SuccessScreen';
