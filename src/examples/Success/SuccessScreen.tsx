import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import './SuccessScreen.css';

export interface SuccessScreenProps {
  onContinue?: () => void;
}

/**
 * Success / confirmation screen — composed from Card, Alert, and Button. Matches the
 * approved Figma "04 — Success" frame.
 */
export function SuccessScreen({ onContinue }: SuccessScreenProps) {
  return (
    <div className="ds-example-success">
      <Card variant="outlined" padding="lg" className="ds-example-success__card">
        <h1 className="ds-example-success__heading">You&apos;re all set</h1>
        <p className="ds-example-success__subheading">
          Your workspace is ready to go. You can invite teammates and start customizing
          things from here.
        </p>
        <Alert status="success" title="Workspace created">
          You&apos;ll receive a confirmation email shortly with your account details.
        </Alert>
        <Button
          variant="primary"
          size="md"
          onClick={onContinue}
          className="ds-example-success__continue"
        >
          Back to dashboard
        </Button>
      </Card>
    </div>
  );
}

SuccessScreen.displayName = 'SuccessScreen';
