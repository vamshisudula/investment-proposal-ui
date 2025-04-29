
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getAssetAllocation } from '@/lib/api';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatIndianCurrency } from '@/lib/utils';
import { PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AllocationPage = () => {
  const { state, dispatch, navigateToStep } = useAppContext();
  const { clientProfile, riskAssessment, assetAllocation } = state;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('equity');

  useEffect(() => {
    const fetchAssetAllocation = async () => {
      // Check prerequisites
      if (!clientProfile || !riskAssessment) {
        toast.warning('Please complete previous steps first');
        navigateToStep(!clientProfile ? 1 : 2);
        return;
      }

      // Skip if we already have data
      if (assetAllocation) {
        return;
      }

      setLoading(true);
      try {
        const response = await getAssetAllocation({
          clientProfile,
          riskProfile: riskAssessment
        });
        
        if (response.success) {
          dispatch({ type: 'SET_ASSET_ALLOCATION', payload: response.assetAllocation });
          toast.success('Asset allocation completed');
        } else {
          toast.error('Failed to generate asset allocation');
        }
      } catch (error) {
        console.error('Error fetching asset allocation:', error);
        toast.error('An error occurred while generating asset allocation');
      } finally {
        setLoading(false);
      }
    };

    fetchAssetAllocation();
  }, [clientProfile, riskAssessment, assetAllocation, dispatch, navigateToStep]);

  // If prerequisites missing, this will redirect in the useEffect
  if (!clientProfile || !riskAssessment) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  if (loading) {
    return <LoadingSpinner message="Building optimal asset allocation..." />;
  }

  if (!assetAllocation) {
    return <LoadingSpinner message="Processing data..." />;
  }

  // Prepare data for pie chart
  const pieData = Object.entries(assetAllocation.assetClassAllocation).map(([name, value], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Prepare data for bar charts
  const prepareBarData = (allocationType: 'equity' | 'debt' | 'alternative') => {
    return Object.entries(assetAllocation.productTypeAllocation[allocationType]).map(([name, percentage]) => {
      // Calculate absolute value based on portfolio size and asset class percentage
      const assetClassPercentage = assetAllocation.assetClassAllocation[allocationType];
      const absoluteValue = (assetAllocation.portfolioSize * assetClassPercentage * percentage) / 10000;
      
      return {
        name,
        percentage,
        value: absoluteValue
      };
    });
  };

  const equityData = prepareBarData('equity');
  const debtData = prepareBarData('debt');
  const alternativeData = prepareBarData('alternative');

  return (
    <div>
      <PageTitle 
        title="Asset Allocation" 
        description="Recommended allocation based on risk profile and investment objectives."
        icon={<PieChartIcon className="h-6 w-6" />}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>
            Total investment amount: {formatIndianCurrency(assetAllocation.portfolioSize)}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
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
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="font-medium text-lg mb-2">Asset Class Breakdown</h3>
              <div className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Allocation</CardTitle>
          <CardDescription>
            Breakdown of specific investment types within each asset class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="equity">Equity</TabsTrigger>
              <TabsTrigger value="debt">Debt</TabsTrigger>
              <TabsTrigger value="alternative">Alternatives</TabsTrigger>
            </TabsList>
            
            <TabsContent value="equity" className="space-y-4">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={equityData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="percentage" name="Percentage (%)" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="border rounded-lg p-4 mt-4">
                <h4 className="font-medium mb-2">Equity Allocation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {equityData.map(item => (
                    <div key={item.name} className="flex justify-between p-2 border-b">
                      <span>{item.name}</span>
                      <div className="text-right">
                        <div>{item.percentage}%</div>
                        <div className="text-sm text-muted-foreground">
                          {formatIndianCurrency(item.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="debt" className="space-y-4">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={debtData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="percentage" name="Percentage (%)" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="border rounded-lg p-4 mt-4">
                <h4 className="font-medium mb-2">Debt Allocation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {debtData.map(item => (
                    <div key={item.name} className="flex justify-between p-2 border-b">
                      <span>{item.name}</span>
                      <div className="text-right">
                        <div>{item.percentage}%</div>
                        <div className="text-sm text-muted-foreground">
                          {formatIndianCurrency(item.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="alternative" className="space-y-4">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alternativeData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="percentage" name="Percentage (%)" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="border rounded-lg p-4 mt-4">
                <h4 className="font-medium mb-2">Alternative Investment Allocation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {alternativeData.map(item => (
                    <div key={item.name} className="flex justify-between p-2 border-b">
                      <span>{item.name}</span>
                      <div className="text-right">
                        <div>{item.percentage}%</div>
                        <div className="text-sm text-muted-foreground">
                          {formatIndianCurrency(item.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Allocation Rationale</h4>
            <p className="text-muted-foreground">{assetAllocation.rationale}</p>
          </div>
        </CardContent>
      </Card>

      <StepNavigation
        previousStep={2}
        nextStep={4}
      />
    </div>
  );
};
