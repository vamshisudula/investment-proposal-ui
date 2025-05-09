import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getAssetAllocation } from '@/lib/api';
import { AssetAllocation } from '@/lib/types';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatIndianCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export const AllocationPage = () => {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const { clientProfile, riskAssessment } = state;
  
  // State for editing asset allocation
  const [isEditingAssetClass, setIsEditingAssetClass] = useState(false);
  const [isEditingProductType, setIsEditingProductType] = useState(false);
  const [isEditingRationale, setIsEditingRationale] = useState(false);
  const [currentAssetClass, setCurrentAssetClass] = useState<string>('');
  const [currentProductType, setCurrentProductType] = useState<string>('');
  
  // State for edited values
  const [editedAssetAllocation, setEditedAssetAllocation] = useState<AssetAllocation | null>(null);
  const [editedRationale, setEditedRationale] = useState('');

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
    } else {
      // Initialize edited values with current values
      setEditedAssetAllocation(JSON.parse(JSON.stringify(state.assetAllocation)));
      setEditedRationale(state.assetAllocation.rationale);
    }
  }, [clientProfile, riskAssessment, dispatch, state.assetAllocation]);

  if (isLoading) {
    return <LoadingSpinner message="Fetching asset allocation..." />;
  }

  if (!state.assetAllocation) {
    return null; // Or display a message indicating that asset allocation is being fetched
  }
  
  // Handler functions for editing
  const handleEditAssetClass = () => {
    setIsEditingAssetClass(true);
  };
  
  const handleEditProductType = (assetClass: string) => {
    setCurrentAssetClass(assetClass);
    setIsEditingProductType(true);
  };
  
  const handleEditRationale = () => {
    setEditedRationale(state.assetAllocation?.rationale || '');
    setIsEditingRationale(true);
  };
  
  const handleSaveAssetClass = () => {
    if (!editedAssetAllocation) return;
    
    // Validate that percentages add up to 100%
    const total = Object.values(editedAssetAllocation.assetClassAllocation).reduce((sum, val) => sum + (val as number), 0);
    if (Math.abs(total - 100) > 0.1) {
      toast.error("Asset class allocations must add up to 100%");
      return;
    }
    
    // Create a new asset allocation object with updated values
    const updatedAssetAllocation = {
      ...state.assetAllocation,
      assetClassAllocation: editedAssetAllocation.assetClassAllocation
    };
    
    // Update the state
    dispatch({ type: 'SET_ASSET_ALLOCATION', payload: updatedAssetAllocation });
    setIsEditingAssetClass(false);
    toast.success("Asset class allocation updated");
  };
  
  const handleSaveProductType = () => {
    if (!editedAssetAllocation || !currentAssetClass) return;
    
    // Validate that percentages add up to the asset class percentage
    const assetClassPercentage = editedAssetAllocation.assetClassAllocation[currentAssetClass] || 0;
    const productTypePercentages = Object.values(editedAssetAllocation.productTypeAllocation[currentAssetClass] || {});
    const total = productTypePercentages.reduce((sum, val) => sum + (val as number), 0);
    
    if (Math.abs(total - assetClassPercentage) > 0.1) {
      toast.error(`Product type allocations must add up to ${assetClassPercentage}%`);
      return;
    }
    
    // Create a new asset allocation object with updated values
    const updatedAssetAllocation = {
      ...state.assetAllocation,
      productTypeAllocation: {
        ...state.assetAllocation.productTypeAllocation,
        [currentAssetClass]: editedAssetAllocation.productTypeAllocation[currentAssetClass]
      }
    };
    
    // Update the state
    dispatch({ type: 'SET_ASSET_ALLOCATION', payload: updatedAssetAllocation });
    setIsEditingProductType(false);
    setCurrentAssetClass('');
    toast.success("Product type allocation updated");
  };
  
  const handleSaveRationale = () => {
    // Create a new asset allocation object with updated rationale
    const updatedAssetAllocation = {
      ...state.assetAllocation,
      rationale: editedRationale
    };
    
    // Update the state
    dispatch({ type: 'SET_ASSET_ALLOCATION', payload: updatedAssetAllocation });
    setIsEditingRationale(false);
    toast.success("Allocation rationale updated");
  };
  
  const handleAssetClassChange = (assetClass: string, value: string) => {
    if (!editedAssetAllocation) return;
    
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    
    setEditedAssetAllocation({
      ...editedAssetAllocation,
      assetClassAllocation: {
        ...editedAssetAllocation.assetClassAllocation,
        [assetClass]: numValue
      }
    });
  };
  
  const handleProductTypeChange = (productType: string, value: string) => {
    if (!editedAssetAllocation || !currentAssetClass) return;
    
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    
    setEditedAssetAllocation({
      ...editedAssetAllocation,
      productTypeAllocation: {
        ...editedAssetAllocation.productTypeAllocation,
        [currentAssetClass]: {
          ...editedAssetAllocation.productTypeAllocation[currentAssetClass],
          [productType]: numValue
        }
      }
    });
  };
  
  const handleAddProductType = () => {
    if (!editedAssetAllocation || !currentAssetClass || !currentProductType) return;
    
    // Add a new product type with 0% allocation
    setEditedAssetAllocation({
      ...editedAssetAllocation,
      productTypeAllocation: {
        ...editedAssetAllocation.productTypeAllocation,
        [currentAssetClass]: {
          ...editedAssetAllocation.productTypeAllocation[currentAssetClass],
          [currentProductType]: 0
        }
      }
    });
    
    setCurrentProductType('');
  };
  
  const handleRemoveProductType = (productType: string) => {
    if (!editedAssetAllocation || !currentAssetClass) return;
    
    // Create a copy of the current product types
    const updatedProductTypes = { ...editedAssetAllocation.productTypeAllocation[currentAssetClass] };
    
    // Remove the specified product type
    delete updatedProductTypes[productType];
    
    // Update the state
    setEditedAssetAllocation({
      ...editedAssetAllocation,
      productTypeAllocation: {
        ...editedAssetAllocation.productTypeAllocation,
        [currentAssetClass]: updatedProductTypes
      }
    });
    
    toast.success(`Removed ${productType} from ${currentAssetClass}`);
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>Asset Class Allocation</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={handleEditAssetClass}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(state.assetAllocation.assetClassAllocation)
                        .filter(([assetClass]) => assetClass === 'equity' || assetClass === 'debt')
                        .map(([name, value]) => ({
                          name: name.charAt(0).toUpperCase() + name.slice(1),
                          value
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell key="cell-0" fill="#4f46e5" />
                      <Cell key="cell-1" fill="#10b981" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2">
                <ul className="space-y-2">
                  {Object.entries(state.assetAllocation.assetClassAllocation)
                    .filter(([assetClass]) => assetClass === 'equity' || assetClass === 'debt')
                    .map(([assetClass, percentage], index) => {
                      const color = index === 0 ? '#4f46e5' : '#10b981';
                      const amount = (state.assetAllocation.portfolioSize * percentage) / 100;
                      
                      return (
                        <li key={assetClass} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium flex items-center">
                              <span 
                                className="inline-block w-3 h-3 mr-2 rounded-full" 
                                style={{ backgroundColor: color }}
                              ></span>
                              <span className="capitalize">{assetClass}</span>
                            </span>
                            <span className="font-semibold">{percentage}%</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatIndianCurrency(amount)}
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ width: `${percentage}%`, backgroundColor: color }}
                            ></div>
                          </div>
                        </li>
                      );
                    })
                  }
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Product Type Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(state.assetAllocation.productTypeAllocation).map(
                ([assetClass, productTypes], assetIndex) => {
                  const assetColor = assetIndex === 0 ? '#4f46e5' : '#10b981';
                  const assetPercentage = state.assetAllocation.assetClassAllocation[assetClass] || 0;
                  
                  return (
                    <div key={assetClass} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-semibold capitalize flex items-center">
                          <span 
                            className="inline-block w-3 h-3 mr-2 rounded-full" 
                            style={{ backgroundColor: assetColor }}
                          ></span>
                          {assetClass} <span className="ml-2 text-sm font-normal text-muted-foreground">({assetPercentage}%)</span>
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleEditProductType(assetClass)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(productTypes).map(([productType, percentage], index) => {
                          const amount = (state.assetAllocation.portfolioSize * percentage) / 100;
                          
                          return (
                            <div key={productType} className="bg-muted/30 p-3 rounded-md">
                              <div className="flex justify-between items-start">
                                <span className="font-medium">{productType}</span>
                                <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">{percentage}%</span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {formatIndianCurrency(amount)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>Allocation Rationale</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleEditRationale}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{state.assetAllocation.rationale}</p>
        </CardContent>
      </Card>

      <StepNavigation nextStep={4} />
      
      {/* Dialog for editing asset class allocation */}
      <Dialog open={isEditingAssetClass} onOpenChange={setIsEditingAssetClass}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset Class Allocation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editedAssetAllocation && Object.entries(editedAssetAllocation.assetClassAllocation).map(([assetClass, percentage]) => (
              <div key={assetClass} className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={`asset-${assetClass}`} className="capitalize">{assetClass}</Label>
                <Input
                  id={`asset-${assetClass}`}
                  type="number"
                  min="0"
                  max="100"
                  value={percentage as number}
                  onChange={(e) => handleAssetClassChange(assetClass, e.target.value)}
                  className="col-span-2"
                />
              </div>
            ))}
            <p className="text-sm text-muted-foreground">Note: Asset class allocations should add up to 100%</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingAssetClass(false)}>Cancel</Button>
            <Button onClick={handleSaveAssetClass}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing product type allocation */}
      <Dialog open={isEditingProductType} onOpenChange={setIsEditingProductType}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {currentAssetClass} Product Types</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editedAssetAllocation && currentAssetClass && Object.entries(editedAssetAllocation.productTypeAllocation[currentAssetClass] || {}).map(([productType, percentage]) => (
              <div key={productType} className="flex items-center gap-4">
                <div className="grid grid-cols-3 items-center gap-4 flex-1">
                  <Label htmlFor={`product-${productType}`}>{productType}</Label>
                  <Input
                    id={`product-${productType}`}
                    type="number"
                    min="0"
                    max="100"
                    value={percentage as number}
                    onChange={(e) => handleProductTypeChange(productType, e.target.value)}
                    className="col-span-2"
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-destructive" 
                  onClick={() => handleRemoveProductType(productType)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="new-product-type">New Product Type</Label>
              <Input
                id="new-product-type"
                value={currentProductType}
                onChange={(e) => setCurrentProductType(e.target.value)}
                placeholder="Enter product type name"
                className="col-span-2"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddProductType}
              disabled={!currentProductType}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Product Type
            </Button>
            <p className="text-sm text-muted-foreground">
              Note: Product type allocations should add up to {editedAssetAllocation && currentAssetClass ? 
                (editedAssetAllocation.assetClassAllocation[currentAssetClass] || 0) : 0}%
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingProductType(false)}>Cancel</Button>
            <Button onClick={handleSaveProductType}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing allocation rationale */}
      <Dialog open={isEditingRationale} onOpenChange={setIsEditingRationale}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Allocation Rationale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={editedRationale}
              onChange={(e) => setEditedRationale(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingRationale(false)}>Cancel</Button>
            <Button onClick={handleSaveRationale}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
