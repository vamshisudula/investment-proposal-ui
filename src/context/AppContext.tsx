
import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, AppAction, StepType } from '../lib/types';
import { testAppState } from '../lib/test-data';
import { toast } from 'sonner';

const initialState: AppState = {
  currentStep: 1,
  clientProfile: null,
  riskAssessment: null,
  assetAllocation: null,
  productRecommendations: null,
  investmentProposal: null
};

// Define the reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_CLIENT_PROFILE':
      return { ...state, clientProfile: action.payload };
    case 'SET_RISK_ASSESSMENT':
      return { ...state, riskAssessment: action.payload };
    case 'SET_ASSET_ALLOCATION':
      return { ...state, assetAllocation: action.payload };
    case 'SET_PRODUCT_RECOMMENDATIONS':
      return { ...state, productRecommendations: action.payload };
    case 'SET_INVESTMENT_PROPOSAL':
      return { ...state, investmentProposal: action.payload };
    case 'LOAD_TEST_DATA':
      toast.success('Test data loaded successfully');
      return { ...action.payload };
    case 'RESET_STATE':
      toast.info('Application state has been reset');
      return initialState;
    default:
      return state;
  }
};

// Create the context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadTestData: () => void;
  navigateToStep: (step: StepType) => void;
  canNavigateToStep: (step: StepType) => boolean;
}>({
  state: initialState,
  dispatch: () => null,
  loadTestData: () => {},
  navigateToStep: () => {},
  canNavigateToStep: () => false,
});

// Create a provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Removed localStorage persistence to ensure state is cleared on refresh
  // If you want to re-enable persistence, uncomment the following code:
  /*
  useEffect(() => {
    const savedState = localStorage.getItem('investWiseState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'LOAD_TEST_DATA', payload: parsedState });
        toast.success('Recovered previous session');
      } catch (error) {
        console.error('Failed to parse saved state:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('investWiseState', JSON.stringify(state));
  }, [state]);
  */

  // Helper function to load test data
  const loadTestData = () => {
    dispatch({ type: 'LOAD_TEST_DATA', payload: testAppState });
  };

  // Helper function to navigate to a specific step
  const navigateToStep = (step: StepType) => {
    if (canNavigateToStep(step)) {
      dispatch({ type: 'SET_STEP', payload: step });
    } else {
      const requiredStep = getMissingRequirementStep(step);
      toast.warning(`Please complete step ${requiredStep} first`);
    }
  };

  // Check if navigation to a step is allowed
  const canNavigateToStep = (step: StepType): boolean => {
    // Manual allocation (step 6) is always accessible
    if (step === 6) return true;
    
    // Step 1 is always accessible
    if (step === 1) return true;
    
    // For other steps, check prerequisites
    switch (step) {
      case 2:
        return state.clientProfile !== null;
      case 3:
        return state.riskAssessment !== null;
      case 4:
        return state.assetAllocation !== null;
      case 5:
        return state.productRecommendations !== null;
      default:
        return false;
    }
  };

  // Find the first missing requirement step
  const getMissingRequirementStep = (targetStep: StepType): StepType => {
    if (targetStep === 1 || targetStep === 6) return targetStep;
    
    if (targetStep >= 2 && state.clientProfile === null) return 1;
    if (targetStep >= 3 && state.riskAssessment === null) return 2;
    if (targetStep >= 4 && state.assetAllocation === null) return 3;
    if (targetStep >= 5 && state.productRecommendations === null) return 4;
    
    return 1;
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      loadTestData,
      navigateToStep,
      canNavigateToStep 
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);
