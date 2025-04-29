
import { useAppContext } from '@/context/AppContext';
import { Button } from './ui/button';
import { StepType } from '@/lib/types';

interface StepNavigationProps {
  previousStep?: StepType;
  nextStep?: StepType;
  nextDisabled?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  buttonText?: string;
}

export const StepNavigation = ({
  previousStep,
  nextStep,
  nextDisabled = false,
  onNext,
  onBack,
  buttonText = 'Continue'
}: StepNavigationProps) => {
  const { navigateToStep } = useAppContext();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (previousStep) {
      navigateToStep(previousStep);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (nextStep) {
      navigateToStep(nextStep);
    }
  };

  return (
    <div className="flex justify-between mt-8 pt-6 border-t">
      <Button 
        variant="outline" 
        onClick={handleBack}
        disabled={!previousStep && !onBack}
      >
        Back
      </Button>
      <Button 
        onClick={handleNext}
        disabled={nextDisabled || (!nextStep && !onNext)}
      >
        {buttonText}
      </Button>
    </div>
  );
};
