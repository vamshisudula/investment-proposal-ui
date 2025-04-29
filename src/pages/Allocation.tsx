
// Fix the function call to include all required parameters
import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getAssetAllocation } from '@/lib/api';
import { AssetAllocation } from '@/lib/types';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';

export const AllocationPage = () => {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const { clientProfile, riskAssessment } = state;

  useEffect(() => {
    // Redirect if prerequisites are not met
    if (!clientProfile || !riskAssessment) {
      toast.error("Client profile and risk assessment are required");
      dispatch({ type: 'SET_STEP', payload: 1 });
      return;
    }

    const loadAssetAllocation = async () => {
      setIsLoading(true);
      try {
        // Fix the call to getAssetAllocation to pass both required arguments
        const response = await getAssetAllocation(clientProfile, riskAssessment);
        dispatch({ type: 'SET_ASSET_ALLOCATION', payload: response.assetAllocation });
        toast.success("Asset allocation retrieved successfully");
      } catch (error) {
        console.error("Error getting asset allocation:", error);
        toast.error("Failed to retrieve asset allocation");
      } finally {
        setIsLoading(false);
      }
    };

    if (!state.assetAllocation) {
      loadAssetAllocation();
    }
  }, [clientProfile, riskAssessment, dispatch, state.assetAllocation]);

  if (isLoading) {
    return <LoadingSpinner message="Fetching asset allocation..." />;
  }

  if (!state.assetAllocation) {
    return null; // Or display a message indicating that asset allocation is being fetched
  }

  return (
    <div>
      <PageTitle
        title="Asset Allocation"
        description="Review the recommended asset allocation based on your risk profile."
      />

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Portfolio Summary</h2>
        <p>
          Based on your risk assessment and investment objectives, we recommend the
          following asset allocation:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-md shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">Asset Class Allocation</h3>
          <ul>
            {Object.entries(state.assetAllocation.assetClassAllocation).map(
              ([assetClass, percentage]) => (
                <li key={assetClass} className="flex justify-between py-1">
                  <span>{assetClass}</span>
                  <span>{percentage}%</span>
                </li>
              )
            )}
          </ul>
        </div>

        <div className="bg-white rounded-md shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">Product Type Allocation</h3>
          {Object.entries(state.assetAllocation.productTypeAllocation).map(
            ([assetClass, productTypes]) => (
              <div key={assetClass}>
                <h4 className="text-md font-semibold mt-2">{assetClass}</h4>
                <ul>
                  {Object.entries(productTypes).map(([productType, percentage]) => (
                    <li key={productType} className="flex justify-between py-1 pl-2">
                      <span>{productType}</span>
                      <span>{percentage}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Rationale</h2>
        <p>{state.assetAllocation.rationale}</p>
      </div>

      <StepNavigation nextStep={4} previousStep={2} />
    </div>
  );
};
