
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Sliders, FileText, Download, FileType } from 'lucide-react';
import { downloadJsonProposal, downloadProposalPdf } from '@/lib/api';
import { ClientProfile, RiskAssessment, AssetAllocation } from '@/lib/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const validationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  age: z.number().optional(),
  occupation: z.string().optional(),
  equity: z.number().min(0, 'Equity must be at least 0').max(100, 'Equity must be at most 100'),
  debt: z.number().min(0, 'Debt must be at least 0').max(100, 'Debt must be at most 100'),
  alternative: z.number().min(0, 'Alternative must be at least 0').max(100, 'Alternative must be at most 100'),
  initialAmount: z.number().min(10000, 'Initial amount must be at least 10,000'),
  regularContribution: z.number().min(0, 'Regular contribution must be at least 0').default(0),
  investmentHorizon: z.enum(['short', 'medium', 'long']).default('medium'),
}).refine(data => {
  const total = data.equity + data.debt + data.alternative;
  return Math.abs(total - 100) < 0.001; // Allow for floating point imprecision
}, {
  message: 'Allocations must sum to 100%',
  path: ['equity'], // Show error on equity field
});

type FormData = z.infer<typeof validationSchema>;

export const ManualAllocationPage = () => {
  const { dispatch } = useAppContext();
  const [generatedData, setGeneratedData] = useState<{
    clientProfile: ClientProfile;
    riskAssessment: RiskAssessment;
    assetAllocation: AssetAllocation;
  } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: '',
      age: 30,
      occupation: '',
      equity: 60,
      debt: 30,
      alternative: 10,
      initialAmount: 100000,
      regularContribution: 0,
      investmentHorizon: 'medium',
    },
  });

  const onValueChange = (field: keyof FormData, value: number) => {
    // Calculate the total of all fields except the one being changed
    const currentValues = form.getValues();
    const currentField = currentValues[field];
    
    // Don't update if the value is invalid
    if (value < 0 || value > 100) return;
    
    const otherFieldsTotal = 100 - value;
    
    // If changed to 100%, set others to 0
    if (value === 100) {
      const otherFields = ['equity', 'debt', 'alternative'].filter(f => f !== field) as Array<'equity' | 'debt' | 'alternative'>;
      otherFields.forEach(f => form.setValue(f, 0));
      form.setValue(field, value);
      return;
    }
    
    // If illegal, don't update
    if (otherFieldsTotal < 0) return;
    
    form.setValue(field, value);
    
    // Adjust other values proportionally
    const otherFields = ['equity', 'debt', 'alternative'].filter(f => f !== field) as Array<'equity' | 'debt' | 'alternative'>;
    const otherFieldsCurrentTotal = otherFields.reduce((sum, f) => sum + currentValues[f], 0);
    
    if (otherFieldsCurrentTotal === 0) {
      // If other fields are 0, distribute evenly
      const perField = otherFieldsTotal / otherFields.length;
      otherFields.forEach(f => form.setValue(f, perField));
    } else {
      // Distribute proportionally
      otherFields.forEach(f => {
        const proportion = currentValues[f] / otherFieldsCurrentTotal;
        form.setValue(f, Math.round(otherFieldsTotal * proportion * 100) / 100);
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    // Create a simplified client profile
    const clientProfile: ClientProfile = {
      personal: {
        name: data.name,
        age: data.age || 40, // Default value if not provided
        occupation: data.occupation || '',
        email: '',
        phone: '',
        maritalStatus: 'not specified',
        dependents: 0,
      },
      financial: {
        currentInvestments: 0,
        liabilities: 0,
        realEstate: 0,
        savings: data.initialAmount,
        monthlyExpenses: 0,
        emergencyFund: 'not specified',
        existingProducts: [],
      },
      investment: {
        primaryGoals: ['Manual Allocation'],
        horizon: data.investmentHorizon,
        style: 'balanced',
        initialAmount: data.initialAmount,
        regularContribution: data.regularContribution,
      },
      riskTolerance: {
        marketDropReaction: 'hold',
        returnsVsStability: 'balanced',
        preferredStyle: 'moderate',
        maxAcceptableLoss: 15, // Default value
      },
    };

    // Create a simplified risk assessment based on allocation
    // More equity = higher risk
    const equityWeight = 0.7;
    const debtWeight = 0.2;
    const alternativeWeight = 0.1;
    const riskScore = Math.round(
      data.equity * equityWeight + 
      data.debt * debtWeight + 
      data.alternative * alternativeWeight
    );

    let riskCategory;
    if (riskScore < 30) riskCategory = "Conservative";
    else if (riskScore < 50) riskCategory = "Moderately Conservative";
    else if (riskScore < 70) riskCategory = "Moderate";
    else if (riskScore < 90) riskCategory = "Moderately Aggressive";
    else riskCategory = "Aggressive";

    const riskAssessment: RiskAssessment = {
      riskScore,
      riskCategory,
      details: {
        ageImpact: 15,
        horizonImpact: 15,
        styleImpact: 15,
        toleranceImpact: 15,
        explanation: `This is a manually created risk profile based on your selected allocation of ${data.equity}% equity, ${data.debt}% debt, and ${data.alternative}% alternatives.`,
      },
    };

    // Create asset allocation from user input
    const assetAllocation: AssetAllocation = {
      portfolioSize: data.initialAmount,
      assetClassAllocation: {
        equity: data.equity,
        debt: data.debt,
        alternative: data.alternative,
      },
      productTypeAllocation: {
        equity: {
          "Large Cap": data.equity >= 30 ? 25 : data.equity,
          "Mid Cap": data.equity >= 50 ? 15 : 0,
          "Small Cap": data.equity >= 70 ? 10 : 0,
          "International": data.equity >= 80 ? 10 : 0,
        },
        debt: {
          "Government Bonds": Math.min(10, data.debt),
          "Corporate Bonds": data.debt > 10 ? Math.min(15, data.debt - 10) : 0,
          "Fixed Deposits": data.debt > 25 ? Math.min(5, data.debt - 25) : 0,
        },
        alternative: {
          "Gold": Math.min(5, data.alternative),
          "REITs": data.alternative > 5 ? Math.min(5, data.alternative - 5) : 0,
        },
      },
      rationale: `This is a manually created allocation with ${data.equity}% equity, ${data.debt}% debt, and ${data.alternative}% alternatives.`,
    };

    // Save the generated data
    setGeneratedData({
      clientProfile,
      riskAssessment,
      assetAllocation,
    });

    // Update app state
    dispatch({ type: 'SET_CLIENT_PROFILE', payload: clientProfile });
    dispatch({ type: 'SET_RISK_ASSESSMENT', payload: riskAssessment });
    dispatch({ type: 'SET_ASSET_ALLOCATION', payload: assetAllocation });

    toast.success('Manual allocation generated successfully');
  };

  const handleDownloadJson = () => {
    if (!generatedData) {
      toast.error('Please generate an allocation first');
      return;
    }

    // Create a simple investment proposal
    const proposal = createProposal(generatedData);

    downloadJsonProposal(proposal)
      .then(() => {
        toast.success('Proposal downloaded as JSON');
      })
      .catch((error) => {
        console.error('Error downloading proposal:', error);
        toast.error('Failed to download proposal');
      });
  };

  const handleDownloadPdf = async () => {
    if (!generatedData) {
      toast.error('Please generate an allocation first');
      return;
    }

    setPdfLoading(true);
    try {
      // Create a simple investment proposal
      const proposal = createProposal(generatedData);
      
      // Download the PDF
      await downloadProposalPdf(proposal);
      toast.success('Proposal downloaded as PDF');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // Helper function to create a proposal from generated data
  const createProposal = (data: {
    clientProfile: ClientProfile;
    riskAssessment: RiskAssessment;
    assetAllocation: AssetAllocation;
  }) => {
    return {
      title: "Manual Allocation Investment Proposal",
      date: new Date().toLocaleDateString(),
      clientName: data.clientProfile.personal.name,
      advisorName: "Manual Allocation Tool",
      companyIntro: "This proposal was generated using the Manual Allocation tool.",
      marketOutlook: "This is a simplified proposal based on your manually specified asset allocation.",
      clientProfile: data.clientProfile,
      riskAssessment: data.riskAssessment,
      assetAllocation: data.assetAllocation,
      productRecommendations: {
        recommendationSummary: "These are generic recommendations based on your manual allocation.",
        recommendations: {
          equity: {
            "Large Cap": [
              {
                name: "Index Fund",
                description: "Tracks a major market index",
                expectedReturn: "10-12% p.a.",
                risk: "Moderate",
                lockIn: "None",
                minInvestment: 5000
              }
            ],
            "Mid Cap": [],
            "Small Cap": [],
            "International": []
          },
          debt: {
            "Government Bonds": [
              {
                name: "Treasury Bond Fund",
                description: "Invests in government securities",
                expectedReturn: "6-7% p.a.",
                risk: "Low",
                lockIn: "None",
                minInvestment: 5000
              }
            ],
            "Corporate Bonds": [],
            "Fixed Deposits": []
          },
          alternative: {
            "Gold": [
              {
                name: "Gold ETF",
                description: "Tracks gold prices",
                expectedReturn: "8-10% p.a.",
                risk: "Moderate",
                lockIn: "None",
                minInvestment: 1000
              }
            ],
            "REITs": []
          }
        }
      },
      implementationPlan: "Implement this allocation in a single transaction or gradually based on your comfort level.",
      disclaimer: "This is a simplified investment proposal based on manual allocation. It is not financial advice. Please consult with a financial advisor before making investment decisions."
    };
  };

  // Prepare data for pie chart
  const pieData = [
    { name: 'Equity', value: form.watch('equity') },
    { name: 'Debt', value: form.watch('debt') },
    { name: 'Alternative', value: form.watch('alternative') },
  ];

  // Total of allocations
  const total = pieData.reduce((sum, item) => sum + item.value, 0);
  const isValidTotal = Math.abs(total - 100) < 0.001;

  return (
    <div>
      <PageTitle 
        title="Manual Asset Allocation" 
        description="Create a custom asset allocation by adjusting the percentages directly."
        icon={<Sliders className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Manual Allocation</CardTitle>
            <CardDescription>
              Adjust the sliders to set your preferred asset allocation. The total must equal 100%.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initialAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Investment Amount (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Initial amount" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-6 pt-4">
                  <h3 className="text-lg font-medium">Asset Allocation</h3>
                  
                  <FormField
                    control={form.control}
                    name="equity"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Equity</FormLabel>
                          <span className="text-sm font-medium">{field.value}%</span>
                        </div>
                        <FormControl>
                          <Input 
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                            {...field}
                            onChange={(e) => {
                              onValueChange('equity', parseInt(e.target.value, 10));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="debt"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Debt</FormLabel>
                          <span className="text-sm font-medium">{field.value}%</span>
                        </div>
                        <FormControl>
                          <Input 
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                            {...field}
                            onChange={(e) => {
                              onValueChange('debt', parseInt(e.target.value, 10));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="alternative"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Alternative</FormLabel>
                          <span className="text-sm font-medium">{field.value}%</span>
                        </div>
                        <FormControl>
                          <Input 
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                            {...field}
                            onChange={(e) => {
                              onValueChange('alternative', parseInt(e.target.value, 10));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className={`flex items-center justify-between p-2 rounded-md ${isValidTotal ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <span>Total:</span>
                  <span className="font-medium">{total}%</span>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button 
                    type="submit" 
                    disabled={!isValidTotal}
                  >
                    Generate Allocation
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Allocation Preview
              {generatedData && (
                <div className="flex gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={handleDownloadJson}
                    disabled={pdfLoading}
                  >
                    <FileType className="h-4 w-4" />
                    JSON
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        PDF
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Visualize your custom asset allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {!isValidTotal && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                Your allocations must sum to 100% to generate a valid portfolio.
              </div>
            )}
            
            {generatedData && (
              <div className="mt-6 space-y-3">
                <div className="p-3 bg-muted/30 rounded-md">
                  <h3 className="font-medium">Risk Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on your allocation, your risk profile is <strong>{generatedData.riskAssessment.riskCategory}</strong> with a risk score of {generatedData.riskAssessment.riskScore}.
                  </p>
                </div>
                
                <div className="p-3 bg-muted/30 rounded-md">
                  <h3 className="font-medium">Portfolio Size</h3>
                  <p className="text-sm text-muted-foreground">
                    ₹{generatedData.assetAllocation.portfolioSize.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StepNavigation />
    </div>
  );
};
