import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { useAppContext } from '@/context/AppContext';
import { ClientProfile, RiskAssessment } from '@/lib/types';
import { 
  testClientProfile, 
  conservativeClientProfile, 
  moderateClientProfile, 
  aggressiveClientProfile,
  ultraAggressiveClientProfile,
  conservativeRiskAssessment,
  moderateRiskAssessment,
  aggressiveRiskAssessment,
  ultraAggressiveRiskAssessment
} from '@/lib/test-data';
import { submitProfile, getRiskAssessment } from '@/lib/api';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const createValidationSchema = (isManualMode: boolean) => z.object({
  personal: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: isManualMode 
      ? z.number().int().min(18, 'Age must be at least 18').max(100, 'Age must be at most 100').optional().or(z.literal(0))
      : z.number().int().min(18, 'Age must be at least 18').max(100, 'Age must be at most 100'),
    occupation: z.string().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    maritalStatus: z.string().optional().or(z.literal('')),
    dependents: isManualMode
      ? z.number().int().min(0, 'Dependents must be at least 0').max(10, 'Dependents must be at most 10').optional().or(z.literal(0))
      : z.number().int().min(0, 'Dependents must be at least 0').max(10, 'Dependents must be at most 10'),
  }),
  financial: z.object({
    currentInvestments: isManualMode 
      ? z.number().min(0, 'Current investments must be at least 0').optional().or(z.literal(0))
      : z.number().min(0, 'Current investments must be at least 0'),
    liabilities: isManualMode
      ? z.number().min(0, 'Liabilities must be at least 0').optional().or(z.literal(0))
      : z.number().min(0, 'Liabilities must be at least 0'),
    realEstate: isManualMode
      ? z.number().min(0, 'Real estate must be at least 0').optional().or(z.literal(0))
      : z.number().min(0, 'Real estate must be at least 0'),
    savings: isManualMode
      ? z.number().min(0, 'Savings must be at least 0').optional().or(z.literal(0))
      : z.number().min(0, 'Savings must be at least 0'),
    monthlyExpenses: isManualMode
      ? z.number().min(0, 'Monthly expenses must be at least 0').optional().or(z.literal(0))
      : z.number().min(0, 'Monthly expenses must be at least 0'),
    emergencyFund: z.string().optional().or(z.literal('')),
    existingProducts: z.array(z.string()).optional().or(z.array(z.string()).length(0)),
  }),
  investment: z.object({
    primaryGoals: z.array(z.string()).optional().or(z.array(z.string()).length(0)),
    horizon: z.string().optional().or(z.literal('')),
    style: z.string().optional().or(z.literal('')),
    initialAmount: z.number().min(10000, 'Initial amount must be at least 10,000'),
    regularContribution: isManualMode
      ? z.number().min(0, 'Regular contribution must be at least 0').optional().or(z.literal(0))
      : z.number().min(0, 'Regular contribution must be at least 0'),
  }),
  riskTolerance: z.object({
    marketDropReaction: isManualMode
      ? z.string().optional().or(z.literal(''))
      : z.string(),
    returnsVsStability: isManualMode
      ? z.string().optional().or(z.literal(''))
      : z.string(),
    preferredStyle: isManualMode
      ? z.string().optional().or(z.literal(''))
      : z.string(),
    maxAcceptableLoss: isManualMode
      ? z.number().min(0, 'Max acceptable loss must be at least 0').max(30, 'Max acceptable loss must be at most 30%').optional().or(z.literal(0))
      : z.number().min(0, 'Max acceptable loss must be at least 0').max(30, 'Max acceptable loss must be at most 30%'),
  }),
  manualRiskSelection: isManualMode
    ? z.string().min(1, 'Please select a risk profile')
    : z.string().optional().or(z.literal('')),
});

type FormData = z.infer<ReturnType<typeof createValidationSchema>>;

export const ProfilingPage = () => {
  const { state, dispatch } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [validationSchema, setValidationSchema] = useState(() => createValidationSchema(false));
  
  // Update validation schema when manual mode changes
  useEffect(() => {
    setValidationSchema(createValidationSchema(isManualMode));
  }, [isManualMode]);
  
  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: state.clientProfile || {
      personal: {
        name: '',
        age: 30,
        occupation: '',
        email: '',
        phone: '',
        maritalStatus: 'single',
        dependents: 0,
      },
      financial: {
        currentInvestments: 0,
        liabilities: 0,
        realEstate: 0,
        savings: 0,
        monthlyExpenses: 0,
        emergencyFund: '0-3 months',
        existingProducts: [],
      },
      investment: {
        primaryGoals: [],
        horizon: 'medium',
        style: 'balanced',
        initialAmount: 100000,
        regularContribution: 10000,
      },
      riskTolerance: {
        marketDropReaction: 'hold',
        returnsVsStability: 'balanced',
        preferredStyle: 'moderate',
        maxAcceptableLoss: 10,
      },
      manualRiskSelection: '',
    },
  });

  // Reset the form with appropriate values when validation schema changes
  useEffect(() => {
    // Keep current values but apply new validation rules
    const currentValues = form.getValues();
    form.reset(currentValues, { 
      keepValues: true,
      keepDirty: true,
    });
  }, [validationSchema, form]);

  // Pre-populate form with test data when the component mounts if clientProfile exists
  useEffect(() => {
    if (state.clientProfile) {
      Object.keys(state.clientProfile).forEach(key => {
        const sectionData = state.clientProfile[key as keyof ClientProfile];
        if (sectionData) {
          Object.keys(sectionData).forEach(field => {
            const value = sectionData[field as keyof typeof sectionData];
            form.setValue(`${key}.${field}` as any, value);
          });
        }
      });
    }
  }, [form, state.clientProfile]);

  const onSubmit = async (data: z.infer<typeof validationSchema>) => {
    setIsSubmitting(true);
    try {
      // Create a complete client profile
      const clientProfile: ClientProfile = {
        personal: {
          name: data.personal.name,
          age: data.personal.age || 30,
          occupation: data.personal.occupation || '',
          email: data.personal.email || '',
          phone: data.personal.phone || '',
          maritalStatus: data.personal.maritalStatus || 'single',
          dependents: data.personal.dependents || 0,
        },
        financial: {
          currentInvestments: data.financial.currentInvestments || 0,
          liabilities: data.financial.liabilities || 0,
          realEstate: data.financial.realEstate || 0,
          savings: data.financial.savings || 0,
          monthlyExpenses: data.financial.monthlyExpenses || 0,
          emergencyFund: data.financial.emergencyFund || '0-3 months',
          existingProducts: data.financial.existingProducts || [],
        },
        investment: {
          primaryGoals: data.investment.primaryGoals || [],
          horizon: data.investment.horizon || 'medium',
          style: data.investment.style || 'balanced',
          initialAmount: data.investment.initialAmount,
          regularContribution: data.investment.regularContribution || 0,
        },
        riskTolerance: {
          marketDropReaction: data.riskTolerance.marketDropReaction || 'hold',
          returnsVsStability: data.riskTolerance.returnsVsStability || 'balanced',
          preferredStyle: data.riskTolerance.preferredStyle || 'moderate',
          maxAcceptableLoss: data.riskTolerance.maxAcceptableLoss || 10,
          investmentKnowledge: isManualMode ? 'manual' : 'automated',
        },
      };

      let riskAssessment: RiskAssessment | null = null;
      
      if (isManualMode && data.manualRiskSelection) {
        // Use manual risk selection
        switch (data.manualRiskSelection) {
          case 'ultraAggressive':
            riskAssessment = {
              riskScore: 95,
              riskCategory: 'Ultra Aggressive',
              details: {
                ageImpact: 0,
                horizonImpact: 0,
                styleImpact: 0,
                toleranceImpact: 0,
                explanation: 'Manually selected Ultra Aggressive risk profile'
              }
            };
            break;
          case 'aggressive':
            riskAssessment = {
              riskScore: 80,
              riskCategory: 'Aggressive',
              details: {
                ageImpact: 0,
                horizonImpact: 0,
                styleImpact: 0,
                toleranceImpact: 0,
                explanation: 'Manually selected Aggressive risk profile'
              }
            };
            break;
          case 'moderate':
            riskAssessment = {
              riskScore: 60,
              riskCategory: 'Moderate',
              details: {
                ageImpact: 0,
                horizonImpact: 0,
                styleImpact: 0,
                toleranceImpact: 0,
                explanation: 'Manually selected Moderate risk profile'
              }
            };
            break;
          case 'conservative':
            riskAssessment = {
              riskScore: 35,
              riskCategory: 'Conservative',
              details: {
                ageImpact: 0,
                horizonImpact: 0,
                styleImpact: 0,
                toleranceImpact: 0,
                explanation: 'Manually selected Conservative risk profile'
              }
            };
            break;
        }
      }
      
      const response = await submitProfile(clientProfile);
      dispatch({ type: 'SET_CLIENT_PROFILE', payload: response.clientProfile });
      
      if (isManualMode && riskAssessment) {
        // Use manually selected risk assessment
        dispatch({ type: 'SET_RISK_ASSESSMENT', payload: riskAssessment });
      } else {
        // Calculate risk assessment from profile
        const riskResponse = await getRiskAssessment(clientProfile);
        if (riskResponse.success) {
          dispatch({ type: 'SET_RISK_ASSESSMENT', payload: riskResponse.riskAssessment });
        }
      }
      
      dispatch({ type: 'SET_STEP', payload: 2 });
      toast.success("Client profile saved successfully");
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast.error("Failed to save client profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadProfileData = (profile: ClientProfile) => {
    Object.keys(profile).forEach(key => {
      const sectionData = profile[key as keyof ClientProfile];
      if (sectionData) {
        Object.keys(sectionData).forEach(field => {
          const value = sectionData[field as keyof typeof sectionData];
          form.setValue(`${key}.${field}` as any, value);
        });
      }
    });
  };

  const handleLoadTestData = () => {
    setIsDialogOpen(true);
  };

  const handleLoadProfile = async (profile: ClientProfile, profileType: string) => {
    loadProfileData(profile);
    setIsDialogOpen(false);
    
    // Use the API call to calculate risk assessment based on the profile
    try {
      const response = await getRiskAssessment(profile);
      if (response.success) {
        dispatch({ type: 'SET_RISK_ASSESSMENT', payload: response.riskAssessment });
        toast.success(`${profileType} risk profile test data loaded with calculated risk assessment`);
      } else {
        toast.error('Failed to calculate risk assessment');
      }
    } catch (error) {
      console.error('Error calculating risk assessment:', error);
      toast.error('Error calculating risk assessment');
    }
  };

  const handleLoadAndContinue = async () => {
    // Default to moderate profile for Load & Continue
    loadProfileData(moderateClientProfile);
    
    // If in manual mode, set the manual risk profile
    if (isManualMode) {
      form.setValue('manualRiskSelection', 'moderate');
      
      // Add manual mode flag to the risk tolerance section
      const updatedProfile = {
        ...moderateClientProfile,
        riskTolerance: {
          ...moderateClientProfile.riskTolerance,
          investmentKnowledge: 'manual'
        }
      };
      
      // Load the updated profile
      loadProfileData(updatedProfile);
    }
    
    // Calculate risk assessment using the API call
    try {
      const response = await getRiskAssessment(moderateClientProfile);
      if (response.success) {
        dispatch({ type: 'SET_RISK_ASSESSMENT', payload: response.riskAssessment });
      }
    } catch (error) {
      console.error('Error calculating risk assessment:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure form values are set
    form.handleSubmit(onSubmit)();
  };

  return (
    <div>
      <PageTitle 
        title="Client Profiling" 
        description="Enter client details to create a personalized investment proposal."
        icon={<User className="h-6 w-6" />}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Automated</span>
          <Switch
            checked={isManualMode}
            onCheckedChange={setIsManualMode}
          />
          <span className="text-sm font-medium">Manual</span>
        </div>
        
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={handleLoadTestData}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Load Test Data
          </button>
          <button 
            type="button" 
            onClick={handleLoadAndContinue}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Load & Continue
          </button>
        </div>

        {/* Risk Profile Selection Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Risk Profile</DialogTitle>
              <DialogDescription>
                Choose a risk profile to load test data for:
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal"
                onClick={() => handleLoadProfile(conservativeClientProfile, "Conservative")}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Conservative</span>
                  <span className="text-xs text-muted-foreground">Lower risk, capital preservation focused</span>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal"
                onClick={() => handleLoadProfile(moderateClientProfile, "Moderate")}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Moderate</span>
                  <span className="text-xs text-muted-foreground">Balanced approach, growth with stability</span>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal"
                onClick={() => handleLoadProfile(aggressiveClientProfile, "Aggressive")}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Aggressive</span>
                  <span className="text-xs text-muted-foreground">Higher risk, growth-oriented strategy</span>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal"
                onClick={() => handleLoadProfile(ultraAggressiveClientProfile, "Ultra-Aggressive")}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Ultra-Aggressive</span>
                  <span className="text-xs text-muted-foreground">Very high risk, maximum growth potential</span>
                </div>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details about the client</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="personal.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex">
                      Full Name <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personal.age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={!isManualMode ? "flex" : ""}>
                      Age {!isManualMode && <span className="text-red-500 ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Age" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personal.occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="Occupation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personal.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personal.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personal.maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personal.dependents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Dependents</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Dependents" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Financial Situation Section */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Situation</CardTitle>
              <CardDescription>Current financial status and holdings</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="financial.currentInvestments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Investments (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Current Investments" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="financial.liabilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liabilities (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Liabilities" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="financial.realEstate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Real Estate Value (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Real Estate Value" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="financial.savings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Savings (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Savings" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="financial.monthlyExpenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Expenses (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Monthly Expenses" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="financial.emergencyFund"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Fund Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select emergency fund status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No emergency fund</SelectItem>
                        <SelectItem value="0-3 months">0-3 months of expenses</SelectItem>
                        <SelectItem value="3-6 months">3-6 months of expenses</SelectItem>
                        <SelectItem value="6-12 months">6-12 months of expenses</SelectItem>
                        <SelectItem value=">12 months">More than 12 months of expenses</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="financial.existingProducts"
                render={() => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <div className="mb-4">
                      <FormLabel>Existing Investment Products</FormLabel>
                      <FormDescription>
                        Select all products that the client currently holds.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {['Mutual Funds', 'Stocks', 'Fixed Deposits', 'Insurance', 'PPF', 'Real Estate', 'Gold', 'Bonds'].map((product) => (
                        <FormField
                          key={product}
                          control={form.control}
                          name="financial.existingProducts"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={product}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(product)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, product])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== product
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {product}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Investment Objectives Section */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Objectives</CardTitle>
              <CardDescription>Goals and preferences for investment</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="investment.primaryGoals"
                render={() => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <div className="mb-4">
                      <FormLabel className={!isManualMode ? "flex" : ""}>
                        Primary Investment Goals {!isManualMode && <span className="text-red-500 ml-1">*</span>}
                      </FormLabel>
                      <FormDescription>
                        Select the main objectives for this investment.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {['Retirement', 'Child Education', 'Home Purchase', 'Wealth Creation', 'Tax Saving', 'Regular Income'].map((goal) => (
                        <FormField
                          key={goal}
                          control={form.control}
                          name="investment.primaryGoals"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={goal}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(goal)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, goal])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== goal
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {goal}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="investment.horizon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={!isManualMode ? "flex" : ""}>
                      Investment Horizon {!isManualMode && <span className="text-red-500 ml-1">*</span>}
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select investment horizon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="short">Short Term (0-3 years)</SelectItem>
                        <SelectItem value="medium">Medium Term (3-7 years)</SelectItem>
                        <SelectItem value="long">Long Term (7+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="investment.style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={!isManualMode ? "flex" : ""}>
                      Investment Style {!isManualMode && <span className="text-red-500 ml-1">*</span>}
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select investment style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="growth">Growth-oriented</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="capital protection">Capital protection</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="investment.initialAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex">
                      Initial Investment Amount (₹) <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Initial Amount" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormDescription>Minimum ₹10,000 required</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="investment.regularContribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={!isManualMode ? "flex" : ""}>
                      Regular Monthly Contribution (₹) {!isManualMode && <span className="text-red-500 ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Monthly Contribution" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Manual Risk Selection (only shown in manual mode) */}
          {isManualMode && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Profile Selection</CardTitle>
                <CardDescription>Select your preferred risk profile</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="manualRiskSelection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex">
                        Risk Profile <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ultraAggressive">Ultra Aggressive (Highest risk, highest potential return)</SelectItem>
                          <SelectItem value="aggressive">Aggressive (High risk, high potential return)</SelectItem>
                          <SelectItem value="moderate">Moderate (Medium risk, medium potential return)</SelectItem>
                          <SelectItem value="conservative">Conservative (Low risk, low potential return)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This will determine your asset allocation and product recommendations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Risk Tolerance Section - Only show in automated mode */}
          {!isManualMode && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Tolerance</CardTitle>
                <CardDescription>Understanding your comfort with investment risk</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="riskTolerance.marketDropReaction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex">
                        If the market drops 15%, you would: <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your likely reaction" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sell">Sell to prevent further losses</SelectItem>
                          <SelectItem value="hold">Hold and wait for recovery</SelectItem>
                          <SelectItem value="buy more">Buy more at lower prices</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="riskTolerance.returnsVsStability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex">
                        Higher returns vs. stability: <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="returns">Prioritize higher returns despite volatility</SelectItem>
                          <SelectItem value="balanced">Balance between returns and stability</SelectItem>
                          <SelectItem value="stability">Prioritize stability over high returns</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="riskTolerance.preferredStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex">
                        Investment Style Preference: <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your preferred style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aggressive">Aggressive growth</SelectItem>
                          <SelectItem value="moderate">Moderate growth</SelectItem>
                          <SelectItem value="conservative">Conservative/Income</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="riskTolerance.maxAcceptableLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex">
                        Maximum Acceptable Loss (%): {field.value}% <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={30}
                          step={1}
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormDescription>
                        The maximum percentage drop in portfolio value you can tolerate.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <StepNavigation
            nextStep={2}
            buttonText="Submit & Continue"
            nextDisabled={isSubmitting}
          />
        </form>
      </Form>
    </div>
  );
};
