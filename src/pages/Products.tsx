
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getProductRecommendations } from '@/lib/api';
import { toast } from 'sonner';
import { formatIndianCurrency } from '@/lib/utils';
import { Package } from 'lucide-react';
import { 
  ProductRecommendation, 
  ProductRecommendations as ProductRecommendationsType 
} from '@/lib/types';

export const ProductsPage = () => {
  const { state, dispatch, navigateToStep } = useAppContext();
  const { clientProfile, riskAssessment, assetAllocation, productRecommendations } = state;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('equity');

  useEffect(() => {
    const fetchProductRecommendations = async () => {
      // Check prerequisites
      if (!clientProfile || !riskAssessment || !assetAllocation) {
        toast.warning('Please complete previous steps first');
        navigateToStep(!clientProfile ? 1 : !riskAssessment ? 2 : 3);
        return;
      }

      // Skip if we already have data
      if (productRecommendations) {
        return;
      }

      setLoading(true);
      try {
        const response = await getProductRecommendations({
          clientProfile,
          riskProfile: riskAssessment,
          assetAllocation
        });
        
        if (response.success) {
          dispatch({ 
            type: 'SET_PRODUCT_RECOMMENDATIONS', 
            payload: response.productRecommendations 
          });
          toast.success('Product recommendations generated');
        } else {
          toast.error('Failed to generate product recommendations');
        }
      } catch (error) {
        console.error('Error fetching product recommendations:', error);
        toast.error('An error occurred while generating recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchProductRecommendations();
  }, [clientProfile, riskAssessment, assetAllocation, productRecommendations, dispatch, navigateToStep]);

  // If prerequisites missing, this will redirect in the useEffect
  if (!clientProfile || !riskAssessment || !assetAllocation) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  if (loading) {
    return <LoadingSpinner message="Finding optimal product recommendations..." />;
  }

  if (!productRecommendations) {
    return <LoadingSpinner message="Processing data..." />;
  }

  // Helper function to render product cards
  const renderProductCards = (products: ProductRecommendation[]) => {
    return (
      <div className="space-y-4">
        {products.map((product, idx) => (
          <Card key={`${product.name}-${idx}`} className="overflow-hidden">
            <CardHeader className="bg-muted/30 py-2 px-4">
              <CardTitle className="text-base">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-3">
              <p className="text-sm text-muted-foreground">{product.description}</p>
              
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Expected Return</p>
                  <p className="font-medium">{product.expectedReturn}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk Level</p>
                  <p className="font-medium">{product.risk}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lock-in Period</p>
                  <p className="font-medium">{product.lockIn}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Min Investment</p>
                  <p className="font-medium">{formatIndianCurrency(product.minInvestment)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Function to render recommendation tabs
  const renderTabContent = (assetClass: 'equity' | 'debt' | 'alternative') => {
    const assetData = productRecommendations.recommendations[assetClass];
    
    return (
      <div className="space-y-4">
        {Object.entries(assetData).map(([productType, products]) => (
          <Accordion type="single" collapsible key={productType}>
            <AccordionItem value={productType}>
              <AccordionTrigger className="text-base">
                {productType} ({products.length})
              </AccordionTrigger>
              <AccordionContent>
                {renderProductCards(products)}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageTitle 
        title="Product Recommendations" 
        description="Suggested investment products based on your profile and allocation."
        icon={<Package className="h-6 w-6" />}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recommendation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {productRecommendations.recommendationSummary}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Products</CardTitle>
          <CardDescription>
            Explore products suitable for your investment portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="equity">Equity</TabsTrigger>
              <TabsTrigger value="debt">Debt</TabsTrigger>
              <TabsTrigger value="alternative">Alternatives</TabsTrigger>
            </TabsList>
            
            <TabsContent value="equity">
              {renderTabContent('equity')}
            </TabsContent>
            
            <TabsContent value="debt">
              {renderTabContent('debt')}
            </TabsContent>
            
            <TabsContent value="alternative">
              {renderTabContent('alternative')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <StepNavigation
        previousStep={3}
        nextStep={5}
      />
    </div>
  );
};
