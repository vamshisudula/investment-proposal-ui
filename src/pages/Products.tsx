// Fix the function call to include all required parameters
import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getProductRecommendations } from '@/lib/api';
import { ProductRecommendations } from '@/lib/types';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';

export const ProductsPage = () => {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const { clientProfile, riskAssessment, assetAllocation } = state;

  useEffect(() => {
    // Redirect if prerequisites are not met
    if (!clientProfile || !riskAssessment || !assetAllocation) {
      toast.error("Client profile, risk assessment, and asset allocation are required");
      dispatch({ type: 'SET_STEP', payload: 1 });
      return;
    }

    const loadProductRecommendations = async () => {
      setIsLoading(true);
      try {
        // Fix the call to getProductRecommendations to pass all required arguments
        const response = await getProductRecommendations(
          clientProfile, 
          riskAssessment,
          assetAllocation
        );
        dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: response.productRecommendations });
        toast.success("Product recommendations retrieved successfully");
      } catch (error) {
        console.error("Error getting product recommendations:", error);
        toast.error("Failed to retrieve product recommendations");
      } finally {
        setIsLoading(false);
      }
    };

    if (!state.productRecommendations) {
      loadProductRecommendations();
    }
  }, [clientProfile, riskAssessment, assetAllocation, dispatch, state.productRecommendations]);

  if (isLoading) {
    return <LoadingSpinner message="Fetching product recommendations..." />;
  }

  return (
    <div>
      <PageTitle
        title="Product Recommendations"
        description="Review and customize product recommendations based on client profile and risk assessment."
      />
      
      {state.productRecommendations ? (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Recommendation Summary</h2>
            <p className="text-muted-foreground">{state.productRecommendations.recommendationSummary}</p>
          </div>

          {Object.entries(state.productRecommendations.recommendations).map(([assetClass, productTypes]) => (
            <div key={assetClass} className="mb-8">
              <h3 className="text-md font-semibold mb-2">{assetClass}</h3>
              {Object.entries(productTypes).map(([productType, products]) => (
                <div key={productType} className="mb-4">
                  <h4 className="text-sm font-medium mb-1">{productType}</h4>
                  <ul>
                    {products.map((product, index) => (
                      <li key={index} className="mb-2 p-4 border rounded-md">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Expected Return:</span> {product.expectedReturn}
                          </div>
                          <div>
                            <span className="font-medium">Risk:</span> {product.risk}
                          </div>
                          <div>
                            <span className="font-medium">Lock-In Period:</span> {product.lockIn || 'None'}
                          </div>
                          <div>
                            <span className="font-medium">Min. Investment:</span> ₹{product.minInvestment.toLocaleString()}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}

          <StepNavigation
            prevStep={3}
            nextStep={5}
            buttonText="Generate Investment Proposal"
          />
        </>
      ) : (
        <div className="text-center text-muted-foreground">
          No product recommendations available. Please ensure all previous steps are completed.
        </div>
      )}
    </div>
  );
};
