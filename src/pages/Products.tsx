import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getProductRecommendations } from '@/lib/api';
import { ProductRecommendations, ProductRecommendation, ProductCategory } from '@/lib/types';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatIndianCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export const ProductsPage = () => {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const { clientProfile, riskAssessment, assetAllocation } = state;
  
  // State for editing products
  const [editingProduct, setEditingProduct] = useState<ProductRecommendation | null>(null);
  const [editingProductType, setEditingProductType] = useState<string>('');
  const [editingAssetClass, setEditingAssetClass] = useState<'equity' | 'debt' | 'goldSilver'>('equity');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditSummaryOpen, setIsEditSummaryOpen] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');

  // Handler functions for editing products
  const handleEditProduct = (product: ProductRecommendation, productType: string, assetClass: 'equity' | 'debt' | 'goldSilver') => {
    setEditingProduct({ ...product });
    setEditingProductType(productType);
    setEditingAssetClass(assetClass);
    setIsEditDialogOpen(true);
  };

  const handleAddProduct = (productType: string, assetClass: 'equity' | 'debt' | 'goldSilver') => {
    setEditingProduct({
      name: '',
      description: '',
      expectedReturn: '',
      risk: 'Moderate',
      lockInPeriod: 'None',
      minInvestment: 5000
    });
    setEditingProductType(productType);
    setEditingAssetClass(assetClass);
    setIsAddDialogOpen(true);
  };

  const handleDeleteProduct = (productIndex: number, productType: string, assetClass: 'equity' | 'debt' | 'goldSilver') => {
    if (!state.productRecommendations) return;
    
    const updatedRecommendations = { ...state.productRecommendations };
    const products = [...updatedRecommendations.recommendations[assetClass][productType].products];
    
    products.splice(productIndex, 1);
    
    updatedRecommendations.recommendations[assetClass][productType].products = products;
    
    dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: updatedRecommendations });
    toast.success("Product removed successfully");
  };

  const handleSaveEditedProduct = () => {
    if (!editingProduct || !state.productRecommendations) return;
    
    const updatedRecommendations = { ...state.productRecommendations };
    const products = [...updatedRecommendations.recommendations[editingAssetClass][editingProductType].products];
    
    // Find the product by name (assuming name is unique within a category)
    const productIndex = products.findIndex(p => p.name === editingProduct.name);
    
    if (productIndex >= 0) {
      // Update existing product
      products[productIndex] = editingProduct;
    } else {
      // This shouldn't happen for editing, but just in case
      products.push(editingProduct);
    }
    
    updatedRecommendations.recommendations[editingAssetClass][editingProductType].products = products;
    
    dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: updatedRecommendations });
    setIsEditDialogOpen(false);
    toast.success("Product updated successfully");
  };

  const handleSaveNewProduct = () => {
    if (!editingProduct || !state.productRecommendations) return;
    
    const updatedRecommendations = { ...state.productRecommendations };
    
    // Make sure the category exists
    if (!updatedRecommendations.recommendations[editingAssetClass][editingProductType]) {
      updatedRecommendations.recommendations[editingAssetClass][editingProductType] = {
        products: [],
        allocation: 100
      };
    }
    
    const products = [...updatedRecommendations.recommendations[editingAssetClass][editingProductType].products];
    
    // Add the new product
    products.push(editingProduct);
    
    updatedRecommendations.recommendations[editingAssetClass][editingProductType].products = products;
    
    dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: updatedRecommendations });
    setIsAddDialogOpen(false);
    toast.success("Product added successfully");
  };

  const handleEditSummary = () => {
    if (!state.productRecommendations) return;
    setEditedSummary(state.productRecommendations.recommendationSummary);
    setIsEditSummaryOpen(true);
  };

  const handleSaveSummary = () => {
    if (!state.productRecommendations) return;
    
    const updatedRecommendations = { ...state.productRecommendations };
    updatedRecommendations.recommendationSummary = editedSummary;
    
    dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: updatedRecommendations });
    setIsEditSummaryOpen(false);
    toast.success("Summary updated successfully");
  };

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
        console.log('Fetching product recommendations with:', {
          clientProfile,
          riskAssessment,
          assetAllocation
        });
        
        // Call the API to get product recommendations
        const response = await getProductRecommendations(
          clientProfile, 
          riskAssessment,
          assetAllocation
        );
        
        console.log('Product recommendations response:', response);
        
        // Handle the response data properly
        if (response.success) {
          let validRecommendations = response.productRecommendations;
          
          // If recommendations property is missing, create a default structure
          if (!validRecommendations.recommendations) {
            console.warn('Creating default recommendations structure');
            validRecommendations = {
              ...validRecommendations,
              recommendations: {
                equity: {
                  mutualFunds: {
                    products: [
                      { name: 'Multi Cap Fund C', description: 'Diversified across market caps', expectedReturn: '12-14%', risk: 'Moderate', minInvestment: 5000 },
                      { name: 'Focused Equity Fund D', description: 'Concentrated portfolio of 25-30 stocks', expectedReturn: '13-15%', risk: 'Moderate-High', minInvestment: 5000 }
                    ],
                    allocation: 100
                  }
                },
                debt: {
                  mutualFunds: {
                    products: [
                      { name: 'Short Duration Fund P', description: 'Moderate risk, good returns', expectedReturn: '7-8%', risk: 'Low-Moderate', minInvestment: 5000 },
                      { name: 'Corporate Bond Fund Q', description: 'Focus on high-quality corporate bonds', expectedReturn: '7.5-8.5%', risk: 'Moderate', minInvestment: 5000 }
                    ],
                    allocation: 100
                  }
                }
              }
            };
          }
          
          // Ensure recommendation summary exists
          if (!validRecommendations.recommendationSummary) {
            validRecommendations.recommendationSummary = `Based on your ${riskAssessment.riskCategory} risk profile, we have recommended a diversified portfolio of investment products.`;
          }
          
          // Log the structure to help debug
          console.log('Final product recommendations structure:', JSON.stringify(validRecommendations, null, 2));
          console.log('Equity recommendations:', validRecommendations.recommendations.equity);
          console.log('Debt recommendations:', validRecommendations.recommendations.debt);
          
          dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: validRecommendations });
          toast.success("Product recommendations retrieved successfully");
        } else {
          console.error("Invalid product recommendations response:", response);
          toast.error("Received invalid product recommendations data");
        }
      } catch (error) {
        console.error("Error getting product recommendations:", error);
        toast.error("Failed to retrieve product recommendations");
      } finally {
        setIsLoading(false);
      }
    };

    // Force reload product recommendations for testing
    loadProductRecommendations();
  }, [clientProfile, riskAssessment, assetAllocation, dispatch]);

  if (isLoading) {
    return <LoadingSpinner message="Fetching product recommendations..." />;
  }

  // Function to handle input changes in the edit dialogs
  const handleEditInputChange = (field: keyof ProductRecommendation, value: string | number) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      [field]: value
    });
  };

  return (
    <div>
      <PageTitle
        title="Product Recommendations"
        description="Review and customize product recommendations based on client profile and risk assessment."
      />
      
      {state.productRecommendations ? (
        <>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>Recommendation Summary</span>
                <Button variant="outline" size="sm" onClick={handleEditSummary}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{state.productRecommendations.recommendationSummary}</p>
            </CardContent>
          </Card>
          
          {/* Edit Summary Dialog */}
          <Dialog open={isEditSummaryOpen} onOpenChange={setIsEditSummaryOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Recommendation Summary</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea 
                  value={editedSummary} 
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditSummaryOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveSummary}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Product Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Name</label>
                  <Input 
                    className="col-span-3" 
                    value={editingProduct?.name || ''} 
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Description</label>
                  <Textarea 
                    className="col-span-3" 
                    value={editingProduct?.description || ''} 
                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Expected Return</label>
                  <Input 
                    className="col-span-3" 
                    value={editingProduct?.expectedReturn || ''} 
                    onChange={(e) => handleEditInputChange('expectedReturn', e.target.value)}
                    placeholder="e.g., 10-12% p.a."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Risk</label>
                  <Input 
                    className="col-span-3" 
                    value={editingProduct?.risk || ''} 
                    onChange={(e) => handleEditInputChange('risk', e.target.value)}
                    placeholder="e.g., Moderate, High, Low"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Lock-in Period</label>
                  <Input 
                    className="col-span-3" 
                    value={editingProduct?.lockInPeriod || editingProduct?.lockIn || ''} 
                    onChange={(e) => handleEditInputChange('lockInPeriod', e.target.value)}
                    placeholder="e.g., None, 1 year, 3 years"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Min Investment</label>
                  <Input 
                    className="col-span-3" 
                    type="number"
                    value={editingProduct?.minInvestment || ''} 
                    onChange={(e) => handleEditInputChange('minInvestment', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEditedProduct}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Add Product Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Name</label>
                  <Input 
                    className="col-span-3" 
                    value={editingProduct?.name || ''} 
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Description</label>
                  <Textarea 
                    className="col-span-3" 
                    value={editingProduct?.description || ''} 
                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Expected Return</label>
                  <Input 
                    className="col-span-3" 
                    value={editingProduct?.expectedReturn || ''} 
                    onChange={(e) => handleEditInputChange('expectedReturn', e.target.value)}
                    placeholder="e.g., 10-12% p.a."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Risk</label>
                  <Input 
                    className="col-span-3" 
                    value={editingProduct?.risk || ''} 
                    onChange={(e) => handleEditInputChange('risk', e.target.value)}
                    placeholder="e.g., Moderate, High, Low"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Lock-in Period</label>
                  <Input 
                    className="col-span-3" 
                    value={editingProduct?.lockInPeriod || editingProduct?.lockIn || ''} 
                    onChange={(e) => handleEditInputChange('lockInPeriod', e.target.value)}
                    placeholder="e.g., None, 1 year, 3 years"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Min Investment</label>
                  <Input 
                    className="col-span-3" 
                    type="number"
                    value={editingProduct?.minInvestment || ''} 
                    onChange={(e) => handleEditInputChange('minInvestment', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveNewProduct}>Add Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Tabs defaultValue="equity" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="equity">Equity</TabsTrigger>
              <TabsTrigger value="debt">Debt</TabsTrigger>
            </TabsList>
            
            {/* Equity Products */}
            <TabsContent value="equity" className="space-y-4">
              {state.productRecommendations.recommendations.equity && 
                Object.entries(state.productRecommendations.recommendations.equity).map(([productType, data]: [string, any]) => {
                  // Skip if no products or empty array
                  if (!data?.products || data.products.length === 0) return null;
                  
                  // Convert camelCase to Title Case for display
                  const formatProductType = (type: string) => {
                    return type
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase());
                  };
                  
                  const typeName = productType === 'mutualFunds' ? 'Mutual Funds' : 
                                  productType === 'etf' ? 'ETFs' : 
                                  productType === 'pms' ? 'Portfolio Management Services' : 
                                  productType === 'aif' ? 'AIFs' : 
                                  productType === 'unlistedStocks' ? 'Unlisted Stocks' :
                                  formatProductType(productType);
                  
                  const description = productType === 'mutualFunds' ? 
                    'Focus on creating a Mutual fund portfolio with objective of long term wealth creation. Selection of fund which are majorly equity oriented and capable of generating Alpha in comparison with the benchmark returns.' : 
                    productType === 'etf' ? 
                    'ETFs offer lower expense ratios compared to mutual funds and provide real-time trading flexibility. They provide diversified exposure to specific market segments with high liquidity.' : 
                    productType === 'pms' ? 
                    'Portfolio Management Services offer personalized investment strategies managed by professional fund managers for high net worth individuals.' :
                    productType === 'aif' ? 
                    'Alternative Investment Funds provide sophisticated investors access to specialized investment strategies with potentially higher returns.' :
                    productType === 'unlistedStocks' ? 
                    'Unlisted stocks offer early investment opportunities in promising companies before they go public.' :
                    'Investment products tailored to your risk profile and investment objectives.';
                  
                  console.log(`Rendering ${productType} with ${data.products.length} products`);
                  
                  return (
                    <Card key={productType} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center">
                          <span>{typeName}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAddProduct(productType, 'equity')}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Product
                          </Button>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {data.products.map((product: any, index: number) => (
                            <div key={index} className="p-4 bg-muted/30 rounded-lg">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium">{product.name}</h4>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{product.expectedReturn}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0" 
                                    onClick={() => handleEditProduct(product, productType, 'equity')}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-destructive" 
                                    onClick={() => handleDeleteProduct(index, productType, 'equity')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm mt-1">{product.description}</p>
                              <div className="flex flex-wrap justify-between text-xs text-muted-foreground mt-3">
                                <div className="mr-4 mb-1">
                                  <span className="font-medium">Risk:</span> {product.risk}
                                </div>
                                <div className="mr-4 mb-1">
                                  <span className="font-medium">Lock-in:</span> {product.lockInPeriod || product.lockIn || 'None'}
                                </div>
                                {(product.minimumInvestment || product.minInvestment) && (
                                  <div className="mb-1">
                                    <span className="font-medium">Min. Investment:</span> {product.minimumInvestment || formatIndianCurrency(product.minInvestment)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {data.products.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <p>No products in this category.</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2" 
                                onClick={() => handleAddProduct(productType, 'equity')}
                              >
                                <Plus className="h-4 w-4 mr-2" /> Add Product
                              </Button>
                            </div>
                          )}
                        </div>
                        {data.amount && (
                          <div className="mt-4 text-sm text-right text-muted-foreground">
                            Target Allocation: {formatIndianCurrency(data.amount)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              }
              
              {(!state.productRecommendations.recommendations.equity || 
                Object.values(state.productRecommendations.recommendations.equity).every((data: any) => !data?.products || data.products.length === 0)) && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No equity products available for your risk profile</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Debt Products */}
            <TabsContent value="debt" className="space-y-4">
              {state.productRecommendations.recommendations.debt && 
                Object.entries(state.productRecommendations.recommendations.debt).map(([productType, data]: [string, any]) => {
                  // Skip if no products or empty array
                  if (!data?.products || data.products.length === 0) return null;
                  
                  // Convert camelCase to Title Case for display
                  const formatProductType = (type: string) => {
                    return type
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase());
                  };
                  
                  const typeName = productType === 'mutualFunds' ? 'Debt Mutual Funds' : 
                                  productType === 'direct' ? 'Direct Bonds' : 
                                  productType === 'aif' ? 'Debt AIFs' : 
                                  formatProductType(productType);
                  
                  const description = productType === 'mutualFunds' ? 
                    'Debt mutual funds invest in fixed income securities like government bonds, corporate bonds, and money market instruments.' : 
                    productType === 'direct' ? 
                    'Direct bonds provide regular interest income and return of principal at maturity. They offer higher yields than traditional deposits.' : 
                    productType === 'aif' ? 
                    'Debt Alternative Investment Funds provide access to specialized debt strategies with potentially higher yields.' :
                    'Investment products tailored to provide stable income with capital preservation.';
                  
                  console.log(`Rendering debt ${productType} with ${data.products.length} products`);
                  
                  return (
                    <Card key={productType} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center">
                          <span>{typeName}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAddProduct(productType, 'debt')}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Product
                          </Button>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {data.products.map((product: any, index: number) => (
                            <div key={index} className="p-4 bg-muted/30 rounded-lg">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium">{product.name}</h4>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{product.expectedReturn}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0" 
                                    onClick={() => handleEditProduct(product, productType, 'debt')}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-destructive" 
                                    onClick={() => handleDeleteProduct(index, productType, 'debt')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm mt-1">{product.description}</p>
                              <div className="flex flex-wrap justify-between text-xs text-muted-foreground mt-3">
                                <div className="mr-4 mb-1">
                                  <span className="font-medium">Risk:</span> {product.risk}
                                </div>
                                <div className="mr-4 mb-1">
                                  <span className="font-medium">Lock-in:</span> {product.lockInPeriod || product.lockIn || 'None'}
                                </div>
                                {(product.minimumInvestment || product.minInvestment) && (
                                  <div className="mb-1">
                                    <span className="font-medium">Min. Investment:</span> {product.minimumInvestment || formatIndianCurrency(product.minInvestment)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {data.products.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <p>No products in this category.</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2" 
                                onClick={() => handleAddProduct(productType, 'debt')}
                              >
                                <Plus className="h-4 w-4 mr-2" /> Add Product
                              </Button>
                            </div>
                          )}
                        </div>
                        {data.amount && (
                          <div className="mt-4 text-sm text-right text-muted-foreground">
                            Target Allocation: {formatIndianCurrency(data.amount)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              }
              
              {(!state.productRecommendations.recommendations.debt || 
                Object.values(state.productRecommendations.recommendations.debt).every((data: any) => !data?.products || data.products.length === 0)) && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No debt products available for your risk profile</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <StepNavigation
            previousStep={3}
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
