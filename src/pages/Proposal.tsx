
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { generateProposal, downloadJsonProposal, downloadProposalPdf } from '@/lib/api';
import { toast } from 'sonner';
import { FileText, Download, FileType } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const ProposalPage = () => {
  const { state, dispatch, navigateToStep } = useAppContext();
  const { clientProfile, riskAssessment, assetAllocation, productRecommendations, investmentProposal } = state;
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

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
          validProductRecommendations = {
            ...validProductRecommendations,
            recommendations: {
              equity: {
                mutualFunds: {
                  products: [
                    { name: 'Multi Cap Fund C', description: 'Diversified across market caps', expectedReturn: '12-14%', risk: 'Moderate' },
                    { name: 'Focused Equity Fund D', description: 'Concentrated portfolio of 25-30 stocks', expectedReturn: '13-15%', risk: 'Moderate-High' }
                  ],
                  allocation: 100
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
    setPdfLoading(true);
    try {
      await downloadProposalPdf(investmentProposal);
      toast.success('Proposal downloaded as PDF');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setPdfLoading(false);
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
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleDownloadJson}
            disabled={pdfLoading}
          >
            <FileType className="h-4 w-4" />
            Download JSON
          </Button>
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
              <TabsTrigger value="implementation">Implementation</TabsTrigger>
            </TabsList>
            
            {/* Company Introduction */}
            <TabsContent value="company" className="space-y-4">
              <h3 className="text-lg font-semibold">About InvestWise</h3>
              <p className="text-muted-foreground">{typeof investmentProposal.companyIntro === 'object' ? investmentProposal.companyIntro.content : investmentProposal.companyIntro}</p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Our Commitment</h4>
                <p className="text-sm text-muted-foreground">
                  At InvestWise, we're committed to helping you achieve your financial goals through personalized investment strategies that align with your risk tolerance and objectives.
                </p>
              </div>
            </TabsContent>
            
            {/* Market Outlook */}
            <TabsContent value="market" className="space-y-4">
              <h3 className="text-lg font-semibold">Current Market Outlook</h3>
              <p className="text-muted-foreground">{typeof investmentProposal.marketOutlook === 'object' ? investmentProposal.marketOutlook.content : investmentProposal.marketOutlook}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Equity Markets</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm text-muted-foreground">Positive outlook with potential for growth in select sectors.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Fixed Income</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm text-muted-foreground">Yields expected to stabilize as inflation pressures ease.</p>
                  </CardContent>
                </Card>

              </div>
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
              <h3 className="text-lg font-semibold">Recommended Products</h3>
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
              
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm">
                  Download detailed product information
                </Button>
              </div>
            </TabsContent>
            
            {/* Implementation Plan */}
            <TabsContent value="implementation" className="space-y-4">
              <h3 className="text-lg font-semibold">Implementation Plan</h3>
              <p className="text-muted-foreground">{typeof investmentProposal.implementationPlan === 'object' ? investmentProposal.implementationPlan.content : investmentProposal.implementationPlan}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Phase 1</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm">Initial investment of 60% in core holdings</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Immediate allocation to establish base positions
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Phase 2</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm">Systematic investment of remaining 40%</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Over the next 3 months to average entry prices
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Ongoing</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm">Regular monthly investments</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      As per the contribution plan discussed
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Disclaimer</h4>
                <p className="text-xs text-muted-foreground">{typeof investmentProposal.disclaimer === 'object' ? investmentProposal.disclaimer.content : investmentProposal.disclaimer}</p>
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
