
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
import { ClientProfile } from '@/lib/types';
import { testClientProfile } from '@/lib/test-data';
import { submitProfile } from '@/lib/api';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { User } from 'lucide-react';

const validationSchema = z.object({
  personal: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().int().min(18, 'Age must be at least 18').max(100, 'Age must be at most 100'),
    occupation: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    maritalStatus: z.string().optional(),
    dependents: z.number().int().min(0, 'Dependents must be at least 0').max(10, 'Dependents must be at most 10'),
  }),
  financial: z.object({
    currentInvestments: z.number().min(0, 'Current investments must be at least 0'),
    liabilities: z.number().min(0, 'Liabilities must be at least 0'),
    realEstate: z.number().min(0, 'Real estate must be at least 0'),
    savings: z.number().min(0, 'Savings must be at least 0'),
    monthlyExpenses: z.number().min(0, 'Monthly expenses must be at least 0'),
    emergencyFund: z.string(),
    existingProducts: z.array(z.string()),
  }),
  investment: z.object({
    primaryGoals: z.array(z.string()),
    horizon: z.string(),
    style: z.string(),
    initialAmount: z.number().min(10000, 'Initial amount must be at least 10,000'),
    regularContribution: z.number().min(0, 'Regular contribution must be at least 0'),
  }),
  riskTolerance: z.object({
    marketDropReaction: z.string(),
    returnsVsStability: z.string(),
    preferredStyle: z.string(),
    maxAcceptableLoss: z.number().min(0, 'Max acceptable loss must be at least 0').max(30, 'Max acceptable loss must be at most 30%'),
  }),
});

type FormData = z.infer<typeof validationSchema>;

export const ProfilingPage = () => {
  const { state, dispatch } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
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
    },
  });

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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await submitProfile(data);
      dispatch({ type: 'SET_CLIENT_PROFILE', payload: response.clientProfile });
      dispatch({ type: 'SET_STEP', payload: 2 });
      toast.success("Client profile saved successfully");
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast.error("Failed to save client profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadTestData = () => {
    Object.keys(testClientProfile).forEach(key => {
      const sectionData = testClientProfile[key as keyof ClientProfile];
      if (sectionData) {
        Object.keys(sectionData).forEach(field => {
          const value = sectionData[field as keyof typeof sectionData];
          form.setValue(`${key}.${field}` as any, value);
        });
      }
    });
    toast.success("Test data loaded");
  };

  const handleLoadAndContinue = async () => {
    handleLoadTestData();
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
      
      <div className="flex justify-end gap-4 mb-6">
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
                    <FormLabel>Full Name *</FormLabel>
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
                    <FormLabel>Age *</FormLabel>
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
                      defaultValue={field.value}
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
                      defaultValue={field.value}
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
                      <FormLabel>Primary Investment Goals</FormLabel>
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
                    <FormLabel>Investment Horizon</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
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
                    <FormLabel>Investment Style</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
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
                    <FormLabel>Initial Investment Amount (₹) *</FormLabel>
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
                    <FormLabel>Regular Monthly Contribution (₹)</FormLabel>
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

          {/* Risk Tolerance Section */}
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
                    <FormLabel>If the market drops 15%, you would:</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
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
                    <FormLabel>Higher returns vs. stability:</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
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
                    <FormLabel>Investment Style Preference:</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
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
                    <FormLabel>Maximum Acceptable Loss (%): {field.value}%</FormLabel>
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
