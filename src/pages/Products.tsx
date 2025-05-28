import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getProductRecommendations, getStockCategories } from '@/lib/api';
import { ProductRecommendations, ProductCategory, StockCategory } from '@/lib/types';

// Extended type to include stock inclusion preferences
interface StockInclusionPreferences {
  includeListedStocks: boolean;
  includeUnlistedStocks: boolean;
}

// Extended ProductRecommendation type to include dataSource
interface ProductRecommendation {
  name: string;
  description: string;
  expectedReturn: string;
  risk: string;
  lockInPeriod?: string;
  minInvestment?: number;
  category?: string;
  dataSource?: string;
}
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Pencil, Plus, Trash2, Loader2, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import { getProductsByCategory, getProductCategories, getAssetClassForCategory } from '@/lib/productUtils';

export const ProductsPage = () => {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const { clientProfile, riskAssessment, assetAllocation } = state;
  const [stockCategories, setStockCategories] = useState<StockCategory[]>([]);
  const [stockCategoriesLoading, setStockCategoriesLoading] = useState(false);
  const [apiDataStatus, setApiDataStatus] = useState<{
    listedStocks: 'loading' | 'success' | 'error' | 'fallback';
    mutualFunds: 'loading' | 'success' | 'error' | 'fallback';
    message: string;
  }>({
    listedStocks: 'loading',
    mutualFunds: 'loading',
    message: 'Loading product recommendations...'
  });
  
  // State for editing products
  const [editingProduct, setEditingProduct] = useState<ProductRecommendation | null>(null);
  const [editingProductType, setEditingProductType] = useState<string>('');
  const [editingAssetClass, setEditingAssetClass] = useState<'equity' | 'debt' | 'goldSilver'>('equity');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditSummaryOpen, setIsEditSummaryOpen] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  
  // State for catalog popup
  const [isCatalogPopupOpen, setIsCatalogPopupOpen] = useState(false);
  const [catalogProductType, setCatalogProductType] = useState<string>('');
  const [catalogAssetClass, setCatalogAssetClass] = useState<'equity' | 'debt'>('equity');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<ProductRecommendation[]>([]);
  
  // State for create category dialog
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [selectedCategoryOption, setSelectedCategoryOption] = useState<string>('');
  
  // State for stock inclusion preferences
  const [includeListedStocks, setIncludeListedStocks] = useState<boolean>(true);
  const [includeUnlistedStocks, setIncludeUnlistedStocks] = useState<boolean>(true);
  
  // Effect to load stock inclusion preferences from state if available
  useEffect(() => {
    if (state.productRecommendations?.stockInclusionPreferences) {
      const { includeListedStocks: listed, includeUnlistedStocks: unlisted } = state.productRecommendations.stockInclusionPreferences;
      setIncludeListedStocks(listed);
      setIncludeUnlistedStocks(unlisted);
    }
  }, [state.productRecommendations]);
  
  // Combined category options with asset class info
  const categoryOptions = [
    { value: 'equity-aif', label: 'Equity AIF', assetClass: 'equity', category: 'aif' },
    { value: 'equity-pms', label: 'Equity PMS', assetClass: 'equity', category: 'pms' },
    { value: 'equity-mutualFunds', label: 'Equity Mutual Funds', assetClass: 'equity', category: 'mutualFunds' },
    { value: 'debt-mutualFunds', label: 'Debt Mutual Funds', assetClass: 'debt', category: 'mutualFunds' },
    { value: 'debt-aif', label: 'Debt AIF', assetClass: 'debt', category: 'aif' },
    { value: 'debt-direct', label: 'Direct Debt', assetClass: 'debt', category: 'direct' }
  ];

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

  const handleSaveAndContinue = () => {
    if (!state.productRecommendations) return;
    
    // Save the stock inclusion preferences
    const updatedRecommendations = { ...state.productRecommendations };
    
    // Add stock inclusion preferences to the product recommendations
    updatedRecommendations.stockInclusionPreferences = {
      includeListedStocks,
      includeUnlistedStocks
    };
    
    // Update the product recommendations
    dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: updatedRecommendations });
    
    // Navigate to the next step
    dispatch({ type: 'SET_STEP', payload: 5 });
  };

  
  // Handler for adding products from the product catalog
  const handleAddMoreProduct = (product: ProductRecommendation, category: string, assetClass: 'equity' | 'debt' | 'alternative') => {
    if (!state.productRecommendations) return;
    
    const updatedRecommendations = { ...state.productRecommendations };
    
    // Map 'alternative' to 'goldSilver' if needed for backward compatibility
    const targetAssetClass = assetClass === 'alternative' ? 
      (updatedRecommendations.recommendations.goldSilver ? 'goldSilver' : 'alternative') : 
      assetClass;
    
    // Ensure the asset class exists in recommendations
    if (!updatedRecommendations.recommendations[targetAssetClass]) {
      updatedRecommendations.recommendations[targetAssetClass] = {};
    }
    
    // Ensure the category exists in the asset class
    if (!updatedRecommendations.recommendations[targetAssetClass][category]) {
      updatedRecommendations.recommendations[targetAssetClass][category] = {
        products: [],
        allocation: 5 // Default allocation percentage
      };
    }
    
    // Check if product already exists
    const existingProductIndex = updatedRecommendations.recommendations[targetAssetClass][category].products
      .findIndex(p => p.name === product.name);
    
    if (existingProductIndex >= 0) {
      toast.error("This product is already in your recommendations");
      return;
    }
    
    // Add the product
    updatedRecommendations.recommendations[targetAssetClass][category].products.push(product);
    
    dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: updatedRecommendations });
    toast.success(`Added ${product.name} to your recommendations`);
  };

  // Handler for adding products from catalog to specific product type
  const handleAddProductFromCatalog = (productName: string, productType: string, assetClass: 'equity' | 'debt') => {
    if (!state.productRecommendations) return;
    
    // Get all available categories and find the product
    const allCategories = getProductCategories();
    let foundProduct: ProductRecommendation | null = null;
    let foundCategory = '';
    
    for (const category of allCategories) {
      const categoryProducts = getProductsByCategory(category);
      const product = categoryProducts.find(p => p.name === productName);
      if (product) {
        foundProduct = product;
        foundCategory = category;
        break;
      }
    }
    
    if (!foundProduct) {
      toast.error("Product not found in catalog");
      return;
    }
    
    const updatedRecommendations = { ...state.productRecommendations };
    
    // Ensure the product type exists
    if (!updatedRecommendations.recommendations[assetClass][productType]) {
      updatedRecommendations.recommendations[assetClass][productType] = {
        products: [],
        allocation: 50 // Default allocation percentage
      };
    }
    
    // Check if product already exists
    const existingProductIndex = updatedRecommendations.recommendations[assetClass][productType].products
      .findIndex(p => p.name === foundProduct!.name);
    
    if (existingProductIndex >= 0) {
      toast.error("This product is already in your recommendations");
      return;
    }
    
    // Add the product
    updatedRecommendations.recommendations[assetClass][productType].products.push(foundProduct);
    
    dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: updatedRecommendations });
    toast.success(`Added ${foundProduct.name} to ${productType}`);
  };

  // Get available products for a specific asset class that aren't already added to a product type
  const getAvailableProductsForType = (productType: string, assetClass: 'equity' | 'debt') => {
    const allCategories = getProductCategories();
    const availableProducts: ProductRecommendation[] = [];
    
    // Get products from categories that match the asset class
    for (const category of allCategories) {
      const categoryAssetClass = getAssetClassForCategory(category);
      if (categoryAssetClass === assetClass) {
        const categoryProducts = getProductsByCategory(category);
        availableProducts.push(...categoryProducts);
      }
    }
    
    // Filter out products that are already in this product type
    const existingProducts = state.productRecommendations?.recommendations[assetClass][productType]?.products || [];
    const existingProductNames = existingProducts.map(p => p.name);
    
    return availableProducts.filter(product => !existingProductNames.includes(product.name));
  };

  // Handler to open catalog popup
  const handleOpenCatalogPopup = (productType: string, assetClass: 'equity' | 'debt') => {
    setCatalogProductType(productType);
    setCatalogAssetClass(assetClass);
    setSearchTerm('');
    const availableProducts = getAvailableProductsForType(productType, assetClass);
    setFilteredProducts(availableProducts);
    setIsCatalogPopupOpen(true);
  };

  // Handler for search functionality
  const handleSearchProducts = (term: string) => {
    setSearchTerm(term);
    const availableProducts = getAvailableProductsForType(catalogProductType, catalogAssetClass);
    
    if (!term.trim()) {
      setFilteredProducts(availableProducts);
      return;
    }
    
    const filtered = availableProducts.filter(product => 
      product.name.toLowerCase().includes(term.toLowerCase()) ||
      product.description.toLowerCase().includes(term.toLowerCase()) ||
      product.risk.toLowerCase().includes(term.toLowerCase()) ||
      product.expectedReturn.toLowerCase().includes(term.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(term.toLowerCase()))
    );
    
    setFilteredProducts(filtered);
  };

  // Handler to create new product category
  const handleCreateCategory = () => {
    console.log('Create category clicked with option:', selectedCategoryOption);
    console.log('Current state.productRecommendations:', state.productRecommendations);
    
    if (!selectedCategoryOption) {
      toast.error("Please select a category");
      return;
    }
    
    if (!state.productRecommendations) {
      toast.error("Product recommendations not initialized");
      return;
    }
    
    // Find the selected option from categoryOptions
    const selectedOption = categoryOptions.find(option => option.value === selectedCategoryOption);
    if (!selectedOption) {
      toast.error("Please select a valid category");
      return;
    }
    
    const { assetClass, category, label } = selectedOption;
    console.log('Selected category details:', { assetClass, category, label });
    
    // Create a deep copy of the recommendations
    const updatedRecommendations = JSON.parse(JSON.stringify(state.productRecommendations));
    
    // Ensure recommendations structure exists
    if (!updatedRecommendations.recommendations) {
      console.log('Creating recommendations structure');
      updatedRecommendations.recommendations = {
        equity: {},
        debt: {}
      };
    }
    
    // Ensure the asset class exists
    if (!updatedRecommendations.recommendations[assetClass]) {
      console.log(`Creating ${assetClass} asset class`);
      updatedRecommendations.recommendations[assetClass] = {};
    }
    
    // Check if category already exists
    if (updatedRecommendations.recommendations[assetClass][category]) {
      toast.error("This category already exists");
      return;
    }
    
    // Create the new category
    console.log(`Adding new category ${category} to ${assetClass}`);
    updatedRecommendations.recommendations[assetClass][category] = {
      products: [],
      allocation: 10 // Default allocation percentage
    };
    
    console.log('Final updated recommendations:', updatedRecommendations);
    
    // Update the state
    dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: updatedRecommendations });
    
    // Close the dialog and reset the selection
    setIsCreateCategoryOpen(false);
    setSelectedCategoryOption('');
    
    // Show success message
    toast.success(`Created new category: ${label}`);
  };

  // Fetch stock categories data from API
  useEffect(() => {
    const fetchStockCategoriesData = async () => {
      try {
        setStockCategoriesLoading(true);
        const response = await getStockCategories();
        if (response.success) {
          setStockCategories(response.data);
          console.log('Stock categories data loaded:', response.data);
          console.log('Number of stock categories:', response.data.length);
        } else {
          console.error('Failed to load stock categories data');
          setApiDataStatus(prevStatus => ({
            ...prevStatus,
            listedStocks: 'error',
            message: 'Failed to load stock categories data. Using fallback data.'
          }));
        }
      } catch (error) {
        console.error('Error fetching stock categories data:', error);
        setApiDataStatus(prevStatus => ({
          ...prevStatus,
          listedStocks: 'error',
          message: 'Error fetching stock categories data. Using fallback data.'
        }));
      } finally {
        setStockCategoriesLoading(false);
      }
    };
    fetchStockCategoriesData();
  }, []);

  useEffect(() => {
    // Redirect if prerequisites are not met
    if (!clientProfile || !riskAssessment || !assetAllocation) {
      toast.error("Client profile, risk assessment, and asset allocation are required");
      dispatch({ type: 'SET_STEP', payload: 1 });
      return;
    }

    // Load product recommendations if prerequisites are met
    loadProductRecommendations();
  }, [clientProfile, riskAssessment, assetAllocation]);

  const loadProductRecommendations = async () => {
    setIsLoading(true);
    setApiDataStatus({
      listedStocks: 'loading',
      mutualFunds: 'loading',
      message: 'Fetching product recommendations from API...'
    });
    
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
      if (response.success && response.productRecommendations) {
        let validRecommendations = response.productRecommendations;
        
        // Validate and enhance the recommendations structure
        if (!validRecommendations.recommendations) {
          console.warn('Creating default recommendations structure');
          validRecommendations.recommendations = {
            equity: {},
            debt: {}
          };
        }
        
        // Check if we have equity recommendations
        if (!validRecommendations.recommendations.equity) {
          validRecommendations.recommendations.equity = {};
        }
        
        // Check if we have debt recommendations
        if (!validRecommendations.recommendations.debt) {
          validRecommendations.recommendations.debt = {};
        }
        
        // Validate listedStocks data from API
        let listedStocksStatus: 'loading' | 'success' | 'error' | 'fallback' = 'fallback';
        let mutualFundsStatus: 'loading' | 'success' | 'error' | 'fallback' = 'fallback';
        
        // First check if we have real stock data from the API
        if (validRecommendations.recommendations.equity.listedStocks && 
            validRecommendations.recommendations.equity.listedStocks.products &&
            validRecommendations.recommendations.equity.listedStocks.products.length > 0) {
          listedStocksStatus = 'success';
          console.log('✅ Listed Stocks data received from API:', validRecommendations.recommendations.equity.listedStocks.products.length, 'products');
        } else {
          // If no API data, check if we have stock categories from the stock categories API
          if (stockCategories.length > 0) {
            console.log('⚠️ No Listed Stocks data from API, using stock categories API data');
            listedStocksStatus = 'success'; // Still mark as success since we're using real API data
            
            // Create stock products based on real stock categories from API
            const stockCategoryProducts = stockCategories.length > 0 ? stockCategories.map(category => ({
              name: `${category.name} Stock`,
              description: `Listed equity in ${category.name} category`,
              expectedReturn: category.code === 'LACAP' ? '10-12%' : 
                            category.code === 'MIDCAP' ? '12-15%' : 
                            category.code === 'SMCAP' ? '15-18%' : '18-22%',
              risk: category.code === 'LACAP' ? 'Moderate' : 
                   category.code === 'MIDCAP' ? 'Moderate-High' : 
                   category.code === 'SMCAP' ? 'High' : 'Very High',
              category: category.name,
              minInvestment: 10000,
              dataSource: 'Stock Categories API'
            })) : [];
            
            validRecommendations.recommendations.equity.listedStocks = {
              products: stockCategoryProducts,
              allocation: 40
            };
          } else {
            // Last resort - use hardcoded fallback data
            console.warn('⚠️ No stock data available from any API, using fallback data');
            listedStocksStatus = 'fallback';
            
            validRecommendations.recommendations.equity.listedStocks = {
              products: [
                { name: 'Large Cap Stock', description: 'Listed equity in large cap category', expectedReturn: '10-12%', risk: 'Moderate', category: 'Large Cap', minInvestment: 10000, dataSource: 'Fallback Data' },
                { name: 'Mid Cap Stock', description: 'Listed equity in mid cap category', expectedReturn: '12-15%', risk: 'Moderate-High', category: 'Mid Cap', minInvestment: 10000, dataSource: 'Fallback Data' },
                { name: 'Small Cap Stock', description: 'Listed equity in small cap category', expectedReturn: '15-18%', risk: 'High', category: 'Small Cap', minInvestment: 10000, dataSource: 'Fallback Data' }
              ],
              allocation: 40
            };
          }
        }  
        
        // Validate mutual funds data from API
        if (validRecommendations.recommendations.equity.mutualFunds && 
            validRecommendations.recommendations.equity.mutualFunds.products &&
            validRecommendations.recommendations.equity.mutualFunds.products.length > 0) {
          mutualFundsStatus = 'success';
          console.log('✅ Mutual Funds data received from API:', validRecommendations.recommendations.equity.mutualFunds.products.length, 'products');
        } else {
          console.warn('⚠️ No Mutual Funds data from API, creating fallback data');
          validRecommendations.recommendations.equity.mutualFunds = {
            products: [
              { name: 'Multi Cap Fund C', description: 'Diversified across market caps', expectedReturn: '12-14%', risk: 'Moderate', minInvestment: 5000 },
              { name: 'Focused Equity Fund D', description: 'Concentrated portfolio of 25-30 stocks', expectedReturn: '13-15%', risk: 'Moderate-High', minInvestment: 5000 }
            ],
            allocation: 60
          };
        }
        
        // Ensure debt recommendations exist
        if (!validRecommendations.recommendations.debt.mutualFunds) {
          validRecommendations.recommendations.debt.mutualFunds = {
            products: [
              { name: 'Short Duration Fund P', description: 'Moderate risk, good returns', expectedReturn: '7-8%', risk: 'Low-Moderate', minInvestment: 5000 },
              { name: 'Corporate Bond Fund Q', description: 'Focus on high-quality corporate bonds', expectedReturn: '7.5-8.5%', risk: 'Moderate', minInvestment: 5000 }
            ],
            allocation: 100
          };
        }
        
        // Ensure recommendation summary exists
        if (!validRecommendations.recommendationSummary) {
          validRecommendations.recommendationSummary = `Based on your ${riskAssessment.riskCategory} risk profile, we have recommended a diversified portfolio of investment products.`;
        }
        
        // Update status
        setApiDataStatus({
          listedStocks: listedStocksStatus,
          mutualFunds: mutualFundsStatus,
          message: listedStocksStatus === 'success' && mutualFundsStatus === 'success' ? 
            'All product data loaded successfully from API' :
            'Product data loaded with some fallback data'
        });
        
        console.log('Final product recommendations structure:', JSON.stringify(validRecommendations, null, 2));
        
        dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: validRecommendations });
        toast.success("Product recommendations retrieved successfully");
      } else {
        console.error("Invalid product recommendations response:", response);
        setApiDataStatus({
          listedStocks: 'error' as const,
          mutualFunds: 'error' as const,
          message: 'Failed to load product recommendations from API'
        });
        toast.error("Received invalid product recommendations data");
      }
    } catch (error) {
      console.error("Error getting product recommendations:", error);
      setApiDataStatus({
        listedStocks: 'error' as const,
        mutualFunds: 'error' as const,
        message: 'Error connecting to API - using fallback data'
      });
      toast.error("Failed to retrieve product recommendations");
    } finally {
      setIsLoading(false);
    }
  };

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

  // Function to get status icon for data source
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'fallback':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
  };

  return (
    <div>
      <PageTitle
        title="Product Recommendations"
        description="Review and customize product recommendations based on client profile and risk assessment."
      />
      
      {/* API Data Status Indicator */}
      <Card className="mb-4 border-l-4 border-l-blue-500">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(apiDataStatus.listedStocks)}
              <span className="text-sm font-medium">Data Source Status:</span>
              <span className="text-sm text-muted-foreground">{apiDataStatus.message}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadProductRecommendations} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Refresh Recommendations'
              )}
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Listed Stocks: {apiDataStatus.listedStocks === 'success' ? 'API Data' : 'Fallback Data'} | 
            Mutual Funds: {apiDataStatus.mutualFunds === 'success' ? 'API Data' : 'Fallback Data'}
          </div>
        </CardContent>
      </Card>
      
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
            <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="name" className="sm:text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={editingProduct?.name || ''}
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="expectedReturn" className="sm:text-right">
                    Expected Return
                  </Label>
                  <Input
                    id="expectedReturn"
                    value={editingProduct?.expectedReturn || ''}
                    onChange={(e) => handleEditInputChange('expectedReturn', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="risk" className="sm:text-right">
                    Risk
                  </Label>
                  <Input
                    id="risk"
                    value={editingProduct?.risk || ''}
                    onChange={(e) => handleEditInputChange('risk', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="lockInPeriod" className="sm:text-right">
                    Lock-in Period
                  </Label>
                  <Input
                    id="lockInPeriod"
                    value={editingProduct?.lockInPeriod || ''}
                    onChange={(e) => handleEditInputChange('lockInPeriod', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="minInvestment" className="sm:text-right">
                    Min Investment
                  </Label>
                  <Input
                    id="minInvestment"
                    type="number"
                    value={editingProduct?.minInvestment || ''}
                    onChange={(e) => handleEditInputChange('minInvestment', parseFloat(e.target.value))}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                  <Label htmlFor="description" className="sm:text-right pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={editingProduct?.description || ''}
                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="button" onClick={handleSaveEditedProduct} className="w-full sm:w-auto">
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Add Product Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="name" className="sm:text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={editingProduct?.name || ''}
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="expectedReturn" className="sm:text-right">
                    Expected Return
                  </Label>
                  <Input
                    id="expectedReturn"
                    value={editingProduct?.expectedReturn || ''}
                    onChange={(e) => handleEditInputChange('expectedReturn', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="risk" className="sm:text-right">
                    Risk
                  </Label>
                  <Input
                    id="risk"
                    value={editingProduct?.risk || ''}
                    onChange={(e) => handleEditInputChange('risk', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="lockInPeriod" className="sm:text-right">
                    Lock-in Period
                  </Label>
                  <Input
                    id="lockInPeriod"
                    value={editingProduct?.lockInPeriod || ''}
                    onChange={(e) => handleEditInputChange('lockInPeriod', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="minInvestment" className="sm:text-right">
                    Min Investment
                  </Label>
                  <Input
                    id="minInvestment"
                    type="number"
                    value={editingProduct?.minInvestment || ''}
                    onChange={(e) => handleEditInputChange('minInvestment', parseFloat(e.target.value))}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                  <Label htmlFor="description" className="sm:text-right pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={editingProduct?.description || ''}
                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="button" onClick={handleSaveNewProduct} className="w-full sm:w-auto">
                  Add Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Catalog Popup Dialog */}
          <Dialog open={isCatalogPopupOpen} onOpenChange={setIsCatalogPopupOpen}>
            <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Products from Catalog</DialogTitle>
                <DialogDescription>
                  Select products to add to your {catalogProductType} recommendations.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="mb-4">
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="max-h-[300px] overflow-y-auto border rounded-md">
                  {filteredProducts.length > 0 ? (
                    <div className="divide-y">
                      {filteredProducts.map((product) => (
                        <div key={product.name} className="p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-muted/50">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.expectedReturn} | {product.risk}</div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddProductFromCatalog(product.name, catalogProductType, catalogAssetClass)}
                            className="w-full sm:w-auto"
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : searchTerm ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No products found matching "{searchTerm}"
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No products available to add
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Tabs defaultValue="equity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="equity">Equity</TabsTrigger>
              <TabsTrigger value="debt">Debt</TabsTrigger>
            </TabsList>
            
            {/* Equity Products */}
            <TabsContent value="equity" className="space-y-4">
              {state.productRecommendations.recommendations.equity && 
                Object.entries(state.productRecommendations.recommendations.equity)
                  .sort(([typeA], [typeB]) => {
                    // Define the order priority for different product types
                    const getOrderPriority = (type: string) => {
                      switch(type) {
                        case 'mutualFunds': return 1; // First
                        case 'listedStocks': return 2; // Second
                        case 'etf': return 3;
                        case 'pms': return 4;
                        case 'aif': return 5;
                        case 'unlistedStocks': return 6; // Last
                        default: return 10; // Any other types come after these
                      }
                    };
                    
                    return getOrderPriority(typeA) - getOrderPriority(typeB);
                  })
                  .map(([productType, data]: [string, any]) => {
                  // Debug log for each product type
                  console.log(`Rendering product type: ${productType}`, data);
                  
                  // Initialize products array if it doesn't exist
                  if (!data.products) {
                    data.products = [];
                  }
                  
                  console.log(`Rendering ${productType} with ${data.products.length} products (may be empty)`);
                  
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
                                  productType === 'listedStocks' ? 'Listed Stocks' :
                                  formatProductType(productType);
                  
                  const description = productType === 'mutualFunds' ? 
                    'Focus on creating a Mutual fund portfolio with objective of long term wealth creation. Selection of fund which are majorly equity oriented and capable of generating Alpha in comparison with the benchmark returns.' : 
                    productType === 'etf' ? 
                    'ETFs offer lower expense ratios compared to mutual funds and provide real-time trading flexibility. They provide diversified exposure to specific market segments with high liquidity.' : 
                    productType === 'pms' ? 
                    'Portfolio Management Services offer personalized investment strategies managed by professional fund managers for high net worth individuals.' :
                    productType === 'listedStocks' ? 
                    'Listed stocks provide direct ownership in publicly traded companies on stock exchanges. They offer potential for capital appreciation and dividend income with high liquidity.' :
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
                          <div className="flex items-center space-x-2">
                            {productType === 'listedStocks' && (
                              <div className="flex items-center mr-4">
                                <Checkbox 
                                  id="include-listed-stocks" 
                                  checked={includeListedStocks} 
                                  onCheckedChange={(checked) => setIncludeListedStocks(checked as boolean)}
                                  className="mr-2"
                                />
                                <Label htmlFor="include-listed-stocks" className="text-sm cursor-pointer">
                                  Include in proposal
                                </Label>
                              </div>
                            )}
                            {productType === 'unlistedStocks' && (
                              <div className="flex items-center mr-4">
                                <Checkbox 
                                  id="include-unlisted-stocks" 
                                  checked={includeUnlistedStocks} 
                                  onCheckedChange={(checked) => setIncludeUnlistedStocks(checked as boolean)}
                                  className="mr-2"
                                />
                                <Label htmlFor="include-unlisted-stocks" className="text-sm cursor-pointer">
                                  Include in proposal
                                </Label>
                              </div>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenCatalogPopup(productType, 'equity')}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add from Catalog
                            </Button>
                          </div>
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
                              </div>
                            </div>
                          ))}
                          {data.products.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <p>No products in this category.</p>
                              <div className="flex justify-center space-x-2 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenCatalogPopup(productType, 'equity')}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add from Catalog
                                </Button>
                              </div>
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
                  // Initialize products array if it doesn't exist
                  if (!data.products) {
                    data.products = [];
                  }
                  
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
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenCatalogPopup(productType, 'debt')}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add from Catalog
                            </Button>
                          </div>
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
                              </div>
                            </div>
                          ))}
                          {data.products.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <p>No products in this category.</p>
                              <div className="flex justify-center space-x-2 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenCatalogPopup(productType, 'debt')}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add from Catalog
                                </Button>
                              </div>
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

          <div className="mt-8 mb-4 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateCategoryOpen(true)}
              className="mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Category
            </Button>
          </div>
          
          <StepNavigation
            previousStep={3}
            nextStep={5}
            buttonText="Generate Investment Proposal"
            onNext={handleSaveAndContinue}
          />
          
          {/* Create Category Dialog */}
          <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
            <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Product Category</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Category</label>
                  <Select value={selectedCategoryOption} onValueChange={setSelectedCategoryOption}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a product category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="equity-aif">Equity AIF</SelectItem>
                      <SelectItem value="equity-pms">Equity PMS</SelectItem>
                      <SelectItem value="equity-mutualFunds">Equity Mutual Funds</SelectItem>
                      <SelectItem value="debt-mutualFunds">Debt Mutual Funds</SelectItem>
                      <SelectItem value="debt-aif">Debt AIF</SelectItem>
                      <SelectItem value="debt-direct">Direct Debt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <p>This will create a new product category where you can add products from the catalog.</p>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsCreateCategoryOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} disabled={!selectedCategoryOption} className="w-full sm:w-auto">
                  Create Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center text-muted-foreground">
          No product recommendations available. Please ensure all previous steps are completed.
        </div>
      )}
    </div>
  );
};
