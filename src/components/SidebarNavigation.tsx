
import { useAppContext } from '@/context/AppContext';
import { StepType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronRight, CheckCircle, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';

interface SidebarNavigationProps {
  isMobile?: boolean;
}

export const SidebarNavigation = ({ isMobile = false }: SidebarNavigationProps) => {
  const [isOpen, setIsOpen] = useState(!isMobile);
  
  // Close sidebar when switching to mobile view
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);
  const { state, navigateToStep, canNavigateToStep, loadTestData } = useAppContext();
  const { currentStep } = state;

  const steps = [
    { id: 1 as StepType, name: 'Client Profiling', icon: '1' },
    { id: 2 as StepType, name: 'Risk Assessment', icon: '2' },
    { id: 3 as StepType, name: 'Asset Allocation', icon: '3' },
    { id: 4 as StepType, name: 'Product Recommendations', icon: '4' },
    { id: 5 as StepType, name: 'Investment Proposal', icon: '5' },
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
    <>
      {/* Mobile menu toggle button */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-md shadow-md"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}
      
      {/* Sidebar - conditionally shown based on isOpen state */}
      <div 
        className={cn(
          "bg-sidebar border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col overflow-hidden z-40 transition-all duration-300",
          isOpen ? "w-[280px]" : isMobile ? "w-0" : "w-[70px]",
          isMobile && !isOpen && "transform -translate-x-full"
        )}
      >
      <div className={cn(
          "p-6 border-b border-gray-200",
          !isOpen && !isMobile && "px-2 py-6"
        )}>
        <h1 className={cn(
          "font-semibold tracking-tight text-sidebar-foreground",
          isOpen ? "text-xl" : "text-base text-center"
        )}>
          {isOpen ? "Invest4Edu" : "I4E"}
        </h1>
        {isOpen && <p className="text-sm text-sidebar-foreground/80">Proposal Generation System</p>}
      </div>

      <div className="py-4 flex-grow overflow-y-auto">
        <div className="space-y-1 px-3">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => {
                navigateToStep(step.id);
                if (isMobile) setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md flex items-center transition-colors text-sidebar-foreground",
                currentStep === step.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/50",
                !canNavigateToStep(step.id) && "opacity-50 cursor-not-allowed",
                !isOpen && !isMobile && "justify-center px-1"
              )}
              disabled={!canNavigateToStep(step.id)}
              title={!isOpen && !isMobile ? step.name : undefined}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                isOpen && "mr-3",
                isStepCompleted(step.id) ? "bg-green-100 text-green-800" : "bg-sidebar-accent text-sidebar-accent-foreground"
              )}>
                {isStepCompleted(step.id) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              {isOpen && <span>{step.name}</span>}
              {isOpen && currentStep === step.id && <ChevronRight className="ml-auto h-4 w-4" />}
            </button>
          ))}

          
        </div>
      </div>
      
    </div>
    
    {/* Overlay for mobile */}
    {isMobile && isOpen && (
      <div 
        className="fixed inset-0 bg-black/50 z-30" 
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
    )}
    </>
  );
};
