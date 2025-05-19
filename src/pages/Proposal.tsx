import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { useAppContext } from '@/context/AppContext';
import { generateProposal, downloadJsonProposal, downloadProposalPdf, getMarketOutlook, getStockCategories, getProductRecommendations } from '@/lib/api';
import { toast } from 'sonner';
import { FileText, Download, FileType, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatIndianCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { MarketOutlookData, StockCategory } from '@/lib/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const ProposalPage = () => {
  const { state, dispatch, navigateToStep } = useAppContext();
  const { clientProfile, riskAssessment, assetAllocation, productRecommendations, investmentProposal } = state;
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [marketOutlookData, setMarketOutlookData] = useState<MarketOutlookData | null>(null);
  const [marketOutlookLoading, setMarketOutlookLoading] = useState(false);
  const [stockCategories, setStockCategories] = useState<StockCategory[]>([]);
  const [stockCategoriesLoading, setStockCategoriesLoading] = useState(false);
  const [refreshingProducts, setRefreshingProducts] = useState(false);

  // Fetch market outlook data from API
  useEffect(() => {
    const fetchMarketOutlookData = async () => {
      try {
        setMarketOutlookLoading(true);
        const response = await getMarketOutlook();
        if (response.success) {
          setMarketOutlookData(response.data);
          console.log('Market outlook data loaded:', response.data);
        } else {
          console.error('Failed to load market outlook data');
        }
      } catch (error) {
        console.error('Error fetching market outlook data:', error);
      } finally {
        setMarketOutlookLoading(false);
      }
    };

    fetchMarketOutlookData();
  }, []);
  
  // Fetch stock categories data from API
  useEffect(() => {
    const fetchStockCategoriesData = async () => {
      try {
        setStockCategoriesLoading(true);
        const response = await getStockCategories();
        if (response.success) {
          setStockCategories(response.data);
          console.log('Stock categories data loaded:', response.data);
        } else {
          console.error('Failed to load stock categories data');
        }
      } catch (error) {
        console.error('Error fetching stock categories data:', error);
      } finally {
        setStockCategoriesLoading(false);
      }
    };

    fetchStockCategoriesData();
  }, []);

  useEffect(() => {
    const fetchInvestmentProposal = async () => {
      // Check prerequisites
      if (!clientProfile || !riskAssessment || !assetAllocation || !productRecommendations) {
        toast.warning('Please complete previous steps first');
        navigateToStep(!clientProfile ? 1 : !riskAssessment ? 2 : !assetAllocation ? 3 : 4);
        return;
      }

      // Debug: Log the product recommendations data
      console.log('Product Recommendations Data in Proposal:', productRecommendations);
      console.log('Product Recommendations Structure:', {
        summary: productRecommendations.recommendationSummary,
        hasRecommendations: !!productRecommendations.recommendations,
        equityProducts: productRecommendations.recommendations?.equity,
        debtProducts: productRecommendations.recommendations?.debt
      });

      // Skip if we already have data
      if (investmentProposal) {
        return;
      }

      setLoading(true);
      try {
        // Ensure product recommendations has the correct structure
        let validProductRecommendations = productRecommendations;
        
        // If recommendations property is missing, create a default structure
        if (!validProductRecommendations.recommendations) {
          console.warn('Creating default recommendations structure for proposal');
          // Create stock category products based on fetched stock categories
          const stockCategoryProducts = stockCategories.map(category => ({
            name: `${category.name} Stock`,
            description: `Listed equity in ${category.name} category`,
            expectedReturn: category.code === 'LACAP' ? '10-12%' : 
                          category.code === 'MIDCAP' ? '12-15%' : 
                          category.code === 'SMCAP' ? '15-18%' : '18-22%',
            risk: category.code === 'LACAP' ? 'Moderate' : 
                 category.code === 'MIDCAP' ? 'Moderate-High' : 
                 category.code === 'SMCAP' ? 'High' : 'Very High',
            category: category.name
          }));
          
          validProductRecommendations = {
            ...validProductRecommendations,
            recommendations: {
              equity: {
                mutualFunds: {
                  products: [
                    { name: 'Multi Cap Fund C', description: 'Diversified across market caps', expectedReturn: '12-14%', risk: 'Moderate' },
                    { name: 'Focused Equity Fund D', description: 'Concentrated portfolio of 25-30 stocks', expectedReturn: '13-15%', risk: 'Moderate-High' }
                  ],
                  allocation: 60
                },
                listedStocks: {
                  products: stockCategoryProducts.length > 0 ? stockCategoryProducts : [
                    { name: 'Large Cap Stock', description: 'Listed equity in large cap category', expectedReturn: '10-12%', risk: 'Moderate' },
                    { name: 'Mid Cap Stock', description: 'Listed equity in mid cap category', expectedReturn: '12-15%', risk: 'Moderate-High' },
                    { name: 'Small Cap Stock', description: 'Listed equity in small cap category', expectedReturn: '15-18%', risk: 'High' }
                  ],
                  allocation: 40
                }
              },
              debt: {
                mutualFunds: {
                  products: [
                    { name: 'Short Duration Fund P', description: 'Moderate risk, good returns', expectedReturn: '7-8%', risk: 'Low-Moderate' },
                    { name: 'Corporate Bond Fund Q', description: 'Focus on high-quality corporate bonds', expectedReturn: '7.5-8.5%', risk: 'Moderate' }
                  ],
                  allocation: 100
                }
              }
            }
          };
        }
        
        // Use the product recommendations data
        const response = await generateProposal({
          clientProfile,
          riskAssessment,
          assetAllocation,
          productRecommendations
        });
        
        if (response.success) {
          dispatch({ type: 'SET_INVESTMENT_PROPOSAL', payload: response.investmentProposal });
          toast.success('Investment proposal generated');
        } else {
          toast.error('Failed to generate investment proposal');
        }
      } catch (error) {
        console.error('Error generating investment proposal:', error);
        toast.error('An error occurred while generating the proposal');
      } finally {
        setLoading(false);
      }
      };

    fetchInvestmentProposal();
  }, [clientProfile, riskAssessment, assetAllocation, productRecommendations, investmentProposal, dispatch, navigateToStep]);

  // If prerequisites missing, this will redirect in the useEffect
  if (!clientProfile || !riskAssessment || !assetAllocation || !productRecommendations) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  if (loading) {
    return <LoadingSpinner message="Generating investment proposal..." />;
  }

  if (!investmentProposal) {
    return <LoadingSpinner message="Processing data..." />;
  }

  // Handler for downloading the proposal as JSON
  const handleDownloadJson = () => {
    downloadJsonProposal(investmentProposal)
      .then(() => {
        toast.success('Proposal downloaded as JSON');
      })
      .catch((error) => {
        console.error('Error downloading proposal:', error);
        toast.error('Failed to download proposal');
      });
  };

  // Handler for downloading the proposal as PDF
  const handleDownloadPdf = async () => {
    if (!investmentProposal) {
      toast.error('No investment proposal data available');
      return;
    }
    
    // Create a custom proposal object that exactly matches what's displayed on the page
    const customProposal = {
      ...investmentProposal,
      title: `Investment Proposal for ${clientProfile?.personal?.name || "Client"}`,
      clientName: clientProfile?.personal?.name || "Client",
      // Use the client profile from state which is displayed on the page
      clientProfile: clientProfile,
      // Use the asset allocation from state which is displayed on the page
      assetAllocation: assetAllocation,
      // Use the product recommendations from state which is displayed on the page
      productRecommendations: productRecommendations,
      // Make sure we have the risk assessment
      riskAssessment: riskAssessment
    };
    
    console.log('Sending custom proposal with exact data from page:', {
      clientName: customProposal.clientName,
      title: customProposal.title,
      assetAllocation: {
        portfolioSize: customProposal.assetAllocation.portfolioSize,
        assetClassAllocation: customProposal.assetAllocation.assetClassAllocation
      },
      productRecommendations: 'Using exact product recommendations from page'
    });
    
    // Log the detailed asset allocation and product recommendations
    console.log('Exact asset allocation from page:', assetAllocation);
    console.log('Exact product recommendations from page:', productRecommendations);
    
    setPdfLoading(true);
    try {
      // Send the custom proposal with exact data from the page
      await downloadProposalPdf(customProposal);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // Handle refreshing product recommendations from API
  const handleRefreshProducts = async () => {
    if (!clientProfile || !riskAssessment || !assetAllocation) {
      toast.warning('Please complete previous steps first');
      return;
    }
    
    setRefreshingProducts(true);
    try {
      const response = await getProductRecommendations(clientProfile, riskAssessment, assetAllocation);
      if (response.success) {
        dispatch({ type: 'SET_PRODUCT_RECOMMENDATIONS', payload: response.productRecommendations });
        toast.success('Product recommendations refreshed');
        console.log('Refreshed product recommendations:', response.productRecommendations);
      } else {
        toast.error('Failed to refresh product recommendations');
      }
    } catch (error) {
      console.error('Error refreshing product recommendations:', error);
      toast.error('Error refreshing product recommendations');
    } finally {
      setRefreshingProducts(false);
    }
  };

  // Prepare data for pie chart
  const pieData = Object.entries(assetAllocation.assetClassAllocation).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div>
      <PageTitle 
        title="Investment Proposal" 
        description="Review and download your personalized investment proposal."
        icon={<FileText className="h-6 w-6" />}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{investmentProposal.title}</h2>
          <p className="text-muted-foreground">Prepared on: {investmentProposal.date}</p>
        </div>
        <div className="flex space-x-2">
          
          <Button 
            className="flex items-center gap-2" 
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment Proposal for {investmentProposal.clientName}</CardTitle>
          <CardDescription>
            Prepared by {investmentProposal.advisorName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-6">
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="disclaimer">Disclaimer</TabsTrigger>
            </TabsList>
            
            {/* Company Introduction */}
            <TabsContent value="company" className="space-y-4">
              <h3 className="text-lg font-semibold">About Invest4Edu</h3>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Founded with the vision to transform intellect, experience and technology into services and products for the Financial and IT industry using the digital wave. We are the first coveted Fintech platform in India to provide solution to all your business needs that you'll ever need to transform your effort and determination into a roaring success in terms of wealth creation, client happiness and business growth. All our offerings are based on the idea of inclusivity and simplicity.
                </p>
                <p>
                  Invest Value is an Information technology outsourcing company. The business world is adapting to the fast-changing technological environment and we are committed to build and offer nextgen comprehensive portfolio to accelerate your growth and provide sustainability to navigate through a competitive business framework. Our product and service offerings are built to harness technology and analytics.
                </p>
              </div>
            </TabsContent>
            
            {/* Market Outlook */}
            <TabsContent value="market" className="space-y-4">
              <h3 className="text-lg font-semibold">Market Outlook</h3>
              
              {marketOutlookLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : marketOutlookData?.latestEntry ? (
                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="font-medium">"{marketOutlookData.latestEntry.marketOutlook}"</p>
                  </div>
                  
                  <h3 className="text-lg font-semibold mt-6">Debt Overview:</h3>
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="font-medium">"{marketOutlookData.latestEntry.description}"</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">{typeof investmentProposal.marketOutlook === 'object' ? investmentProposal.marketOutlook.content : investmentProposal.marketOutlook}</p>
              )}
            </TabsContent>
            
            {/* Client Profile */}
            <TabsContent value="profile" className="space-y-4">
              <h3 className="text-lg font-semibold">Client Profile Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Personal Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Name</span>
                      <span>{clientProfile.personal.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Age</span>
                      <span>{clientProfile.personal.age}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Occupation</span>
                      <span>{clientProfile.personal.occupation || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Marital Status</span>
                      <span>{clientProfile.personal.maritalStatus}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Dependents</span>
                      <span>{clientProfile.personal.dependents}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Financial Overview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Current Investments</span>
                      <span>{formatIndianCurrency(clientProfile.financial.currentInvestments)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Liabilities</span>
                      <span>{formatIndianCurrency(clientProfile.financial.liabilities)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Real Estate Value</span>
                      <span>{formatIndianCurrency(clientProfile.financial.realEstate)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Savings</span>
                      <span>{formatIndianCurrency(clientProfile.financial.savings)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Monthly Expenses</span>
                      <span>{formatIndianCurrency(clientProfile.financial.monthlyExpenses)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Investment Objectives</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Primary Goals</span>
                      <span>{clientProfile.investment.primaryGoals.join(', ')}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Investment Horizon</span>
                      <span>{clientProfile.investment.horizon}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Investment Style</span>
                      <span>{clientProfile.investment.style}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Initial Amount</span>
                      <span>{formatIndianCurrency(clientProfile.investment.initialAmount)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Regular Contribution</span>
                      <span>{formatIndianCurrency(clientProfile.investment.regularContribution)}/month</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Max Acceptable Loss</span>
                      <span>{clientProfile.riskTolerance.maxAcceptableLoss}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Risk Assessment */}
            <TabsContent value="risk" className="space-y-4">
              <h3 className="text-lg font-semibold">Risk Assessment</h3>
              <p className="text-muted-foreground mb-4">
                Your risk assessment score of {riskAssessment.riskScore} places you in the {riskAssessment.riskCategory} risk category.
              </p>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2 flex flex-col items-center">
                  <div className="text-center mb-2">
                    <div className="text-3xl font-bold text-primary">{riskAssessment.riskScore}</div>
                    <p className="text-lg font-medium">{riskAssessment.riskCategory} Risk Profile</p>
                  </div>
                  <div className="w-full h-8 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${riskAssessment.riskScore}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
                    <span>Conservative</span>
                    <span>Moderate</span>
                    <span>Aggressive</span>
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  {/* Explanation moved to top of section to avoid duplication */}
                  {/* Impact details removed as requested */}
                </div>
              </div>
            </TabsContent>
            
            {/* Asset Allocation */}
            <TabsContent value="allocation" className="space-y-4">
              <h3 className="text-lg font-semibold">Recommended Asset Allocation</h3>
              <p className="text-muted-foreground mb-4">
                Portfolio Size: {formatIndianCurrency(assetAllocation.portfolioSize)}
              </p>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2 h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2">
                  <div className="space-y-3">
                    {Object.entries(assetAllocation.assetClassAllocation).map(([asset, percentage], idx) => {
                      const assetName = asset.charAt(0).toUpperCase() + asset.slice(1);
                      const amount = (assetAllocation.portfolioSize * percentage) / 100;
                      
                      return (
                        <div key={asset} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium flex items-center">
                              <span 
                                className="inline-block w-3 h-3 mr-2 rounded-full" 
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                              ></span>
                              {assetName}
                            </span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatIndianCurrency(amount)}
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full" 
                              style={{ 
                                width: `${percentage}%`, 
                                backgroundColor: COLORS[idx % COLORS.length] 
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Allocation Rationale</h4>
                <p className="text-sm text-muted-foreground">{assetAllocation.rationale}</p>
              </div>
            </TabsContent>
            
            {/* Product Recommendations */}
            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recommended Products</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshProducts} 
                  disabled={refreshingProducts}
                >
                  {refreshingProducts ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    'Refresh Products'
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">{productRecommendations.recommendationSummary}</p>
              
              <div className="space-y-6">
                {/* Equity Products */}
                <div className="space-y-4">
                  <h4 className="font-medium border-b pb-1">Equity ({assetAllocation.assetClassAllocation.equity}%)</h4>
                  
                  {productRecommendations.recommendations.equity && Object.entries(productRecommendations.recommendations.equity).map(([type, data]: [string, any]) => {
                    // Skip if no products or empty array
                    if (!data?.products || data.products.length === 0) return null;
                    
                    const typeName = type === 'mutualFunds' ? 'Mutual Funds' : 
                                    type === 'etf' ? 'ETFs' : 
                                    type === 'pms' ? 'Portfolio Management Services' : 
                                    type === 'aif' ? 'AIFs' : 
                                    type.charAt(0).toUpperCase() + type.slice(1);
                    
                    const description = type === 'mutualFunds' ? 
                      'Focus on creating a Mutual fund portfolio with objective of long term wealth creation. Selection of fund which are majorly equity oriented and capable of generating Alpha in comparison with the benchmark returns.' : 
                      type === 'etf' ? 
                      'ETFs offer lower expense ratios compared to mutual funds and provide real-time trading flexibility. They provide diversified exposure to specific market segments with high liquidity.' : 
                      'Investment products tailored to your risk profile and investment objectives.';
                    
                    return (
                      <div key={type} className="bg-card rounded-lg border p-4">
                        <h5 className="font-medium text-base mb-3">{typeName}</h5>
                        <p className="text-sm text-muted-foreground mb-3">{description}</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-2 font-medium">Name</th>
                                <th className="text-left p-2 font-medium">Description</th>
                                <th className="text-left p-2 font-medium">Expected Return</th>
                                <th className="text-left p-2 font-medium">Risk Level</th>
                                {type === 'pms' || type === 'aif' ? (
                                  <th className="text-left p-2 font-medium">Min. Investment</th>
                                ) : null}
                              </tr>
                            </thead>
                            <tbody>
                              {data.products.map((product: any, idx: number) => (
                                <tr key={idx} className={idx < data.products.length - 1 ? "border-b" : ""}>
                                  <td className="p-2">{product.name}</td>
                                  <td className="p-2">{product.description}</td>
                                  <td className="p-2">{product.expectedReturn}</td>
                                  <td className="p-2">{product.risk}</td>
                                  {type === 'pms' || type === 'aif' ? (
                                    <td className="p-2">{product.minimumInvestment}</td>
                                  ) : null}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {data.amount && (
                          <div className="mt-3 text-sm text-right text-muted-foreground">
                            Target Allocation: {formatIndianCurrency(data.amount)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* If no equity products are found */}
                  {(!productRecommendations.recommendations.equity || 
                    Object.values(productRecommendations.recommendations.equity).every((data: any) => !data?.products || data.products.length === 0)) && (
                    <div className="bg-card rounded-lg border p-4 text-center py-8">
                      <p className="text-muted-foreground">No equity products available for your risk profile</p>
                    </div>
                  )}
                </div>
                
                {/* Debt Products */}
                <div className="space-y-4">
                  <h4 className="font-medium border-b pb-1">Debt ({assetAllocation.assetClassAllocation.debt}%)</h4>
                  
                  {productRecommendations.recommendations.debt && Object.entries(productRecommendations.recommendations.debt).map(([type, data]: [string, any]) => {
                    // Skip if no products or empty array
                    if (!data?.products || data.products.length === 0) return null;
                    
                    const typeName = type === 'mutualFunds' ? 'Debt Mutual Funds' : 
                                    type === 'direct' ? 'Direct Bonds' : 
                                    type === 'aif' ? 'Debt AIFs' : 
                                    type.charAt(0).toUpperCase() + type.slice(1);
                    
                    const description = type === 'mutualFunds' ? 
                      'Debt mutual funds invest in fixed income securities like government bonds, corporate bonds, and money market instruments.' : 
                      type === 'direct' ? 
                      'Direct bonds provide regular interest income and return of principal at maturity. They offer higher yields than traditional deposits.' : 
                      'Investment products tailored to provide stable income with capital preservation.';
                    
                    return (
                      <div key={type} className="bg-card rounded-lg border p-4">
                        <h5 className="font-medium text-base mb-3">{typeName}</h5>
                        <p className="text-sm text-muted-foreground mb-3">{description}</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-2 font-medium">Name</th>
                                <th className="text-left p-2 font-medium">Description</th>
                                <th className="text-left p-2 font-medium">Expected Return</th>
                                <th className="text-left p-2 font-medium">Risk Level</th>
                                {type === 'aif' ? (
                                  <th className="text-left p-2 font-medium">Min. Investment</th>
                                ) : null}
                              </tr>
                            </thead>
                            <tbody>
                              {data.products.map((product: any, idx: number) => (
                                <tr key={idx} className={idx < data.products.length - 1 ? "border-b" : ""}>
                                  <td className="p-2">{product.name}</td>
                                  <td className="p-2">{product.description}</td>
                                  <td className="p-2">{product.expectedReturn}</td>
                                  <td className="p-2">{product.risk}</td>
                                  {type === 'aif' ? (
                                    <td className="p-2">{product.minimumInvestment}</td>
                                  ) : null}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {data.amount && (
                          <div className="mt-3 text-sm text-right text-muted-foreground">
                            Target Allocation: {formatIndianCurrency(data.amount)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* If no debt products are found */}
                  {(!productRecommendations.recommendations.debt || 
                    Object.values(productRecommendations.recommendations.debt).every((data: any) => !data?.products || data.products.length === 0)) && (
                    <div className="bg-card rounded-lg border p-4 text-center py-8">
                      <p className="text-muted-foreground">No debt products available for your risk profile</p>
                    </div>
                  )}
                </div>
              </div>
              
              
            </TabsContent>
            
            {/* Disclaimer */}
            <TabsContent value="disclaimer" className="space-y-4">
              <h3 className="text-lg font-semibold">Disclaimer</h3>
              <div className="text-xs text-muted-foreground space-y-4">
                <p>
                  Investments in securities market are subject to market risks, read all the related documents carefully before investing.
                </p>
                <p>
                  The information and opinions in this report have been prepared by invest4Edu (i4E) Private limited and are subject to change without any notice. The report and information contained herein are strictly confidential and meant solely for the intended recipient and may not be altered in any way, transmitted to, copied or redistributed, in part or in whole, to any other person or to the media or reproduced in any form, without prior written consent of i4E.
                </p>
                <p>
                  The information and opinions contained in the research report have been compiled or arrived at from sources believed to be reliable and have not been independently verified and no guarantee, representation of warranty, express or implied, is made as to their accuracy, completeness, authenticity or validity. No information or opinions expressed constitute an offer, or an invitation to make an offer, to buy or sell any securities or any derivative instruments related to such securities. Investments in securities are subject to market risk. The value and return on investment may vary because of changes in interest rates, foreign exchange rates or any other reason. Investors should note that each security's price or value may rise or fall and, accordingly, investors may even receive amounts which are less than originally invested. The investor is advised to take into consideration all risk factors including their own financial condition, suitability to risk return profile and the like, and take independent professional and/or tax advice before investing. Opinions expressed are our current opinions as of the date appearing on this report. Investor should understand that statements regarding future prospects may not materialize and are of general nature which may not be specifically suitable to any particular investor. Past performance may not necessarily be an indicator of future performance. Actual results may differ materially from those set forth in projections.
                </p>
                <p>
                  Technical Analysis reports focus on studying the price movement and trading turnover charts of securities or its derivatives, as opposed to focussing on a company's fundamentals and opinions, as such, may not match with reports published on a company's fundamentals.
                </p>
                <p>
                  i4E, its research analysts, directors, officers, employees and associates accept no liabilities for any loss or damage of any kind arising out of the use of this report. This report is not directed or intended for distribution to, or use by, any person or entity who is a citizen or resident of or located in any locality, state, country or other jurisdiction, where such distribution, publication, availability or use would be contrary to law, regulation or which would subject i4E and associates to any registration or licensing requirement within such jurisdiction. The securities described herein may or may not be eligible for sale in all jurisdictions or to certain category of investors. Persons in whose possession this document may come are required to inform themselves of and to observe such restriction.
                </p>
                <p>
                  The views and sentiments expressed in this research report and any findings thereof accurately reflect i4E's analyst truthful views about the subject securities and or issuers discussed herein. i4E is not registered as a stock broker, stock exchange or an advisory firm and/or broker‐dealer under the Securities Exchange Act of 1934, as amended (the "Exchange Act") and is not a member of the Securities Investor Protection Corporation ("SIPC").
                </p>
                <p>
                  This Research Report is the product of i4E Private Limited. i4E Private Limited is the employer of the research analyst(s) who has prepared the research report. i4E Private Limited is the employer of the i4E Private Limited representative who is responsible for the report, are responsible for the content of the i4E Private Limited Research Report; any material conflicts of interest of i4E Private Limited in relation to the issuer(s) or securities discussed in the i4E Private Limited Research Report.
                </p>
                <p className="font-medium">
                  RESEARCH ANALYST - INH000010113
                </p>
                <p>
                  | ARN - 190026 | CIN - U93000MH2021PTC366886 
                  GST No - 27AAGCI2917P1Z3 
                  invest4Edu pvt ltd is AMFI registered Mutual Fund distributor.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <StepNavigation
        previousStep={4}
      />
    </div>
  );
};
