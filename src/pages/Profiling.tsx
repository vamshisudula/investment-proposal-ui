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

const createValidationSchema = () => z.object({
  personal: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    initialAmount: z.number().min(10000, 'Initial amount must be at least 10,000'),
    age: z.number().int().min(18, 'Age must be at least 18').max(100, 'Age must be at most 100').optional().or(z.literal(0)),
    occupation: z.string().optional().or(z.literal('')),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Mobile number must be at least 10 digits'),
    maritalStatus: z.string().optional().or(z.literal('')),
    dependents: z.number().int().min(0, 'Dependents must be at least 0').max(10, 'Dependents must be at most 10').optional().or(z.literal(0)),
  }),
  financial: z.object({
    currentInvestments: z.number().min(0, 'Current investments must be at least 0').optional().or(z.literal(0)),
    liabilities: z.number().min(0, 'Liabilities must be at least 0').optional().or(z.literal(0)),
    realEstate: z.number().min(0, 'Real estate must be at least 0').optional().or(z.literal(0)),
    savings: z.number().min(0, 'Savings must be at least 0').optional().or(z.literal(0)),
    monthlyExpenses: z.number().min(0, 'Monthly expenses must be at least 0').optional().or(z.literal(0)),
    emergencyFund: z.string().optional().or(z.literal('')),
    existingProducts: z.array(z.string()).optional().or(z.array(z.string()).length(0)),
  }),
  investment: z.object({
    primaryGoals: z.array(z.string()).optional().or(z.array(z.string()).length(0)),
    horizon: z.string().optional().or(z.literal('')),
    style: z.string().optional().or(z.literal('')),
    regularContribution: z.number().min(0, 'Regular contribution must be at least 0').optional().or(z.literal(0)),
  }),
  riskTolerance: z.object({
    marketDropReaction: z.string().optional().or(z.literal('')),
    returnsVsStability: z.string().optional().or(z.literal('')),
    preferredStyle: z.string().optional().or(z.literal('')),
    maxAcceptableLoss: z.number().min(0, 'Max acceptable loss must be at least 0').max(30, 'Max acceptable loss must be at most 30%').optional().or(z.literal(0)),
  }),
  manualRiskSelection: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<ReturnType<typeof createValidationSchema>>;

// Helper function to check if all profile fields are filled
const isProfileComplete = (data: any): boolean => {
  // Check personal section
  if (!data.personal.age || 
      !data.personal.dependents) {
    return false;
  }
  
  // Check financial section
  if (!data.financial.currentInvestments || 
      !data.financial.liabilities || 
      !data.financial.realEstate || 
      !data.financial.savings || 
      !data.financial.monthlyExpenses) {
    return false;
  }
  
  // Check investment section
  if (!data.investment.regularContribution) {
    return false;
  }
  
  // If all required fields are filled, it's complete
  return true;
};

export const ProfilingPage = () => {
  const { state, dispatch, navigateToStep } = useAppContext();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSkippedSections, setHasSkippedSections] = useState(false);
  const [skippedSections, setSkippedSections] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadProfileDialogOpen, setIsLoadProfileDialogOpen] = useState(false);
  
  // Define existing product options
  const existingProductOptions = [
    { id: 'mutualFunds', label: 'Mutual Funds' },
    { id: 'stocks', label: 'Stocks' },
    { id: 'fixedDeposits', label: 'Fixed Deposits' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'ppf', label: 'PPF' },
    { id: 'realEstate', label: 'Real Estate' },
    { id: 'gold', label: 'Gold' },
    { id: 'bonds', label: 'Bonds' }
  ];
  
  // Define primary goal options
  const primaryGoalOptions = [
    { id: 'retirement', label: 'Retirement' },
    { id: 'childEducation', label: 'Child Education' },
    { id: 'homePurchase', label: 'Home Purchase' },
    { id: 'wealthCreation', label: 'Wealth Creation' },
    { id: 'taxSaving', label: 'Tax Saving' },
    { id: 'regularIncome', label: 'Regular Income' }
  ];
  
  // Define the steps for the profiling process - dynamic based on whether sections were skipped
  const getSteps = () => {
    const baseSteps = [
      { id: 'personal', title: 'Personal Information' },
      { id: 'financial', title: 'Financial Situation' },
      { id: 'investment', title: 'Investment Objectives' },
      { id: 'riskTolerance', title: 'Risk Tolerance' },
    ];
    
    // Add Risk Profile Selection step only if sections were skipped
    if (hasSkippedSections) {
      // Insert before the last step
      return [
        ...baseSteps.slice(0, 3),
        { id: 'riskProfile', title: 'Risk Profile Selection' },
        baseSteps[3]
      ];
    }
    
    return baseSteps;
  };
  
  const steps = getSteps();
  
  // Function to handle moving to the next step
  const handleNextStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent form submission if event is provided
    if (e) {
      e.preventDefault();
    }
    
    // If we're on the Personal Information step (step 0), validate mandatory fields
    if (activeStep === 0) {
      // Get current values
      const name = form.getValues('personal.name');
      const initialAmount = form.getValues('personal.initialAmount');
      const email = form.getValues('personal.email');
      const phone = form.getValues('personal.phone');
      
      // Validate mandatory fields
      let hasErrors = false;
      
      if (!name || name.length < 2) {
        form.setError('personal.name', { 
          type: 'manual', 
          message: 'Full Name is required (at least 2 characters)' 
        });
        hasErrors = true;
      }
      
      if (!initialAmount || initialAmount < 10000) {
        form.setError('personal.initialAmount', { 
          type: 'manual', 
          message: 'Investment Amount is required (minimum ₹10,000)' 
        });
        hasErrors = true;
      }
      
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        form.setError('personal.email', { 
          type: 'manual', 
          message: 'A valid Email is required' 
        });
        hasErrors = true;
      }
      
      if (!phone || phone.length < 10) {
        form.setError('personal.phone', { 
          type: 'manual', 
          message: 'Mobile Number is required (at least 10 digits)' 
        });
        hasErrors = true;
      }
      
      // If there are errors, don't proceed and show toast message
      if (hasErrors) {
        toast.error('Please fill in all required fields marked with *');
        return;
      }
    }
    
    // If validation passes or we're not on the Personal Information step
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };
  
  // Function to handle moving to the previous step
  const handlePrevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent form submission
    e.preventDefault();
    
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };
  
  // Function to handle skipping the current section
  const handleSkipSection = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent form submission
    e.preventDefault();
    // Mark that sections have been skipped - this will show the Risk Profile Selection step
    setHasSkippedSections(true);
    
    // Clear fields in the current section
    const currentSection = steps[activeStep].id;
    
    if (currentSection === 'personal') {
      // Skip optional personal fields but keep required name field
      const currentName = form.getValues('personal.name');
      form.setValue('personal.age', 0);
      form.setValue('personal.occupation', '');
      form.setValue('personal.email', '');
      form.setValue('personal.phone', '');
      form.setValue('personal.maritalStatus', '');
      form.setValue('personal.dependents', 0);
    } else if (currentSection === 'financial') {
      form.setValue('financial.currentInvestments', 0);
      form.setValue('financial.liabilities', 0);
      form.setValue('financial.realEstate', 0);
      form.setValue('financial.savings', 0);
      form.setValue('financial.monthlyExpenses', 0);
      form.setValue('financial.emergencyFund', '');
      form.setValue('financial.existingProducts', []);
    } else if (currentSection === 'investment') {
      // Skip optional investment fields
      form.setValue('investment.primaryGoals', []);
      form.setValue('investment.horizon', '');
      form.setValue('investment.style', '');
      form.setValue('investment.regularContribution', 0);
    } else if (currentSection === 'riskTolerance') {
      // If user skips Risk Tolerance section, submit the form directly
      // This will take them straight to the Risk Assessment page
      handleSubmitForm();
      return; // Exit the function early to prevent further processing
    }
    // We no longer skip the Risk Tolerance section as it should always be shown
    
    // Get the current step title before moving to the next section
    const skippedSectionTitle = steps[activeStep].title;
    
    // Move to the next section
    handleNextStep();
    
    // Show toast notification
    toast.info(`${skippedSectionTitle} section skipped. This will result in manual profiling.`);
  };
  
  const validationSchema = createValidationSchema();
  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: state.clientProfile || {
      personal: {
        name: '',
        initialAmount: 100000,
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
  
  // Function to handle investment product change
  const handleInvestmentProductChange = (productId: string, checked: boolean | string) => {
    const currentProducts = form.getValues('financial.existingProducts') || [];
    if (checked === true || checked === 'true' || checked === 'indeterminate') {
      form.setValue('financial.existingProducts', [...currentProducts, productId]);
    } else {
      form.setValue('financial.existingProducts', 
        currentProducts.filter((id: string) => id !== productId)
      );
    }
  };
  
  // Function to handle primary goal change
  const handlePrimaryGoalChange = (goalId: string, checked: boolean | string) => {
    const currentGoals = form.getValues('investment.primaryGoals') || [];
    if (checked === true || checked === 'true' || checked === 'indeterminate') {
      form.setValue('investment.primaryGoals', [...currentGoals, goalId]);
    } else {
      form.setValue('investment.primaryGoals', 
        currentGoals.filter((id: string) => id !== goalId)
      );
    }
  };

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

  // Helper function to handle form submission
  const handleSubmitForm = async () => {
    // Get the current form data
    const data = form.getValues();
    await onSubmit(data);
  };

  // Function to handle risk profile selection and auto-submit
  const handleRiskProfileSelection = (value: string) => {
    // Set the form value
    form.setValue('manualRiskSelection', value);
    
    // Show toast notification
    toast.info(`Risk profile set to ${value}. Proceeding to Risk Assessment...`);
    
    // Auto-submit the form after a short delay
    setTimeout(() => handleSubmitForm(), 500);
  };

  const onSubmit = async (data: z.infer<typeof validationSchema>) => {
    setIsSubmitting(true);
    try {
      // Create a complete client profile
      const clientProfile: ClientProfile = {
        personal: {
          name: data.personal.name,
          initialAmount: data.personal.initialAmount,
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
          regularContribution: data.investment.regularContribution || 0,
        },
        riskTolerance: {
          marketDropReaction: data.riskTolerance.marketDropReaction || 'hold',
          returnsVsStability: data.riskTolerance.returnsVsStability || 'balanced',
          preferredStyle: data.riskTolerance.preferredStyle || 'moderate',
          maxAcceptableLoss: data.riskTolerance.maxAcceptableLoss || 10,
          investmentKnowledge: isProfileComplete(data) ? 'automated' : 'manual',
        },
      };

      let riskAssessment: RiskAssessment | null = null;
      
      // Check if profile is incomplete and manual risk selection is provided
      const isManualMode = !isProfileComplete(data);
      if (hasSkippedSections && data.manualRiskSelection) {
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
      
      if (hasSkippedSections && riskAssessment) {
        // Use manually selected risk assessment but still get API assessment for comparison
        dispatch({ type: 'SET_RISK_ASSESSMENT', payload: riskAssessment });
        
        // Also get the API-based assessment for reference
        try {
          const riskResponse = await getRiskAssessment(clientProfile);
          if (riskResponse.success) {
            // Store this as a secondary assessment or for comparison
            console.log('API Risk Assessment:', riskResponse.riskAssessment);
            // You could store this in state if needed for comparison
          }
        } catch (error) {
          console.error('Error getting API risk assessment:', error);
        }
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
    
    // Set manual risk selection for demonstration purposes
    form.setValue('manualRiskSelection', 'moderate');
    
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
          <span className="text-sm font-medium">Fill in all fields for automated profiling, or skip optional fields for manual selection</span>
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
        <form onSubmit={(e) => {
          // Only submit the form when explicitly clicking the Submit button
          if (activeStep === steps.length - 1) {
            form.handleSubmit(onSubmit)(e);
          } else {
            e.preventDefault();
          }
        }} className="space-y-8">
          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Step {activeStep + 1} of {steps.length}</h3>
              <div className="text-sm text-muted-foreground">{steps[activeStep].title}</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Personal Information Section */}
          {activeStep === 0 && (
          <Card className="w-full mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Basic details about the client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                name="personal.initialAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex">
                      Investment Amount (₹) <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Initial Amount" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormDescription>
                      The amount you plan to invest initially (minimum ₹10,000)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personal.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex">
                      Email <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
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
                    <FormLabel className="flex">
                      Mobile No <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Phone Number" {...field} />
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
                    <FormLabel>
                      Age
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
                    <FormLabel>
                      Number of Dependents
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          </Card>
          )}

          {/* Financial Situation Section */}
          {activeStep === 1 && (
          <Card className="w-full mb-6">
            <CardHeader>
              <CardTitle>
                Financial Situation
              </CardTitle>
              <CardDescription>
                Current financial status and existing investments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="financial.currentInvestments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Current Investments (₹)
                    </FormLabel>
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
                    <FormLabel>
                      Liabilities (₹)
                    </FormLabel>
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
                    <FormLabel>
                      Real Estate Value (₹)
                    </FormLabel>
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
                    <FormLabel>
                      Savings (₹)
                    </FormLabel>
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
                    <FormLabel>
                      Monthly Expenses (₹)
                    </FormLabel>
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
                    <FormLabel>
                      Emergency Fund Status
                    </FormLabel>
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
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <div className="mb-4">
                      <FormLabel>Existing Investment Products</FormLabel>
                      <FormDescription>
                        Select all that apply
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {existingProductOptions.map((product) => (
                        <FormItem
                          key={product.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(product.id)}
                              onCheckedChange={(checked) => {
                                return handleInvestmentProductChange(product.id, checked);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {product.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          </Card>
          )}

          {/* Investment Objectives Section */}
          {activeStep === 2 && (
          <Card className="w-full mb-6">
            <CardHeader>
              <CardTitle>
                Investment Objectives
              </CardTitle>
              <CardDescription>
                Goals and preferences for investments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="investment.primaryGoals"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <div className="mb-4">
                      <FormLabel className="flex">
                        Primary Investment Goals <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormDescription>
                        Select all that apply
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {primaryGoalOptions.map((goal) => (
                        <FormItem
                          key={goal.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(goal.id)}
                              onCheckedChange={(checked) => {
                                return handlePrimaryGoalChange(goal.id, checked);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {goal.label}
                          </FormLabel>
                        </FormItem>
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
                    <FormLabel>
                      Investment Horizon
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
                    <FormLabel>
                      Investment Style
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
              
              {/* Initial Amount field moved to Personal Information section */}
              
              <FormField
                control={form.control}
                name="investment.regularContribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Regular Monthly Contribution (₹)
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
            </div>
          </CardContent>
          </Card>
          )}

          {/* Risk Tolerance Section */}
          {((!hasSkippedSections && activeStep === 3) || (hasSkippedSections && activeStep === 4)) && (
          <Card className="w-full mb-6">
            <CardHeader>
              <CardTitle>
                Risk Tolerance
              </CardTitle>
              <CardDescription>
                Comfort level with investment risk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
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
              </div>
            </CardContent>
          </Card>
          )}

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row justify-between mt-6 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={activeStep === 0}
              className="w-full sm:w-auto"
            >
              Previous
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Skip button - not shown on Personal Information or Risk Profile Selection step */}
              {!(activeStep === 0 || (hasSkippedSections && activeStep === 3)) && (
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleSkipSection}
                  className="w-full sm:w-auto"
                >
                  Skip
                </Button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={handleNextStep}
                  disabled={hasSkippedSections && activeStep === 3} /* Disable Next button on Risk Profile Selection */
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Submit & Continue
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
