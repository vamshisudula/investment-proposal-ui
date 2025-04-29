
import { useAppContext } from '@/context/AppContext';
import { StepType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronRight, CheckCircle, Settings } from 'lucide-react';
import { Button } from './ui/button';

export const SidebarNavigation = () => {
  const { state, navigateToStep, canNavigateToStep, loadTestData } = useAppContext();
  const { currentStep } = state;

  const steps = [
    { id: 1 as StepType, name: 'Client Profiling' },
    { id: 2 as StepType, name: 'Risk Assessment' },
    { id: 3 as StepType, name: 'Asset Allocation' },
    { id: 4 as StepType, name: 'Product Recommendations' },
    { id: 5 as StepType, name: 'Investment Proposal' },
  ];

  const isStepCompleted = (stepId: StepType): boolean => {
    switch (stepId) {
      case 1:
        return state.clientProfile !== null;
      case 2:
        return state.riskAssessment !== null;
      case 3:
        return state.assetAllocation !== null;
      case 4:
        return state.productRecommendations !== null;
      case 5:
        return state.investmentProposal !== null;
      default:
        return false;
    }
  };

  return (
    <div className="w-[280px] bg-sidebar border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold tracking-tight text-sidebar-foreground">
          InvestWise
        </h1>
        <p className="text-sm text-sidebar-foreground/80">Proposal Forge</p>
      </div>

      <div className="py-4 flex-grow overflow-y-auto">
        <div className="space-y-1 px-3">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => navigateToStep(step.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md flex items-center transition-colors text-sidebar-foreground",
                currentStep === step.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/50",
                !canNavigateToStep(step.id) && "opacity-50 cursor-not-allowed"
              )}
              disabled={!canNavigateToStep(step.id)}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs font-medium",
                isStepCompleted(step.id) ? "bg-green-100 text-green-800" : "bg-sidebar-accent text-sidebar-accent-foreground"
              )}>
                {isStepCompleted(step.id) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <span>{step.name}</span>
              {currentStep === step.id && <ChevronRight className="ml-auto h-4 w-4" />}
            </button>
          ))}

          <div className="px-3 pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={() => navigateToStep(6 as StepType)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md flex items-center transition-colors text-sidebar-foreground",
                currentStep === 6
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/50"
              )}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3 bg-sidebar-accent text-sidebar-accent-foreground">
                <Settings className="h-4 w-4" />
              </div>
              <span>Manual Allocation</span>
              {currentStep === 6 && <ChevronRight className="ml-auto h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={loadTestData}
        >
          Load All Test Data
        </Button>
      </div>
    </div>
  );
};
