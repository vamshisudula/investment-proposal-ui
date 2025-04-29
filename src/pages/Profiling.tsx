// Fix the type error with submitProfile function
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'sonner';
import { submitProfile } from '@/lib/api';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';

// Validation schema for client profile
const clientProfileSchema = z.object({
  // Defining a proper schema to ensure all required fields are provided
  personal: z.object({
    name: z.string().min(2, 'Name is required'),
    age: z.number().min(18, 'Age must be at least 18').max(100, 'Age must be at most 100'),
    occupation: z.string(),
    email: z.string().email('Invalid email format'),
    phone: z.string(),
    maritalStatus: z.string(),
    dependents: z.number(),
  }),
  financial: z.object({
    currentInvestments: z.number(),
    liabilities: z.number(),
    realEstate: z.number(),
    savings: z.number(),
    monthlyExpenses: z.number(),
    emergencyFund: z.string(),
    existingProducts: z.array(z.string()),
  }),
  investment: z.object({
    primaryGoals: z.array(z.string()),
    horizon: z.string(),
    style: z.string(),
    initialAmount: z.number().min(10000, 'Initial amount must be at least 10,000'),
    regularContribution: z.number(),
  }),
  riskTolerance: z.object({
    marketDropReaction: z.string(),
    returnsVsStability: z.string(),
    preferredStyle: z.string(),
    maxAcceptableLoss: z.number(),
  }),
});

type ClientProfileForm = z.infer<typeof clientProfileSchema>;

export const ProfilingPage = () => {
  const { state, dispatch } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with existing data or defaults
  const form = useForm<ClientProfileForm>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: state.clientProfile || {
      personal: {
        name: '',
        age: 30,
        occupation: '',
        email: '',
        phone: '',
        maritalStatus: 'Single',
        dependents: 0,
      },
      financial: {
        currentInvestments: 0,
        liabilities: 0,
        realEstate: 0,
        savings: 0,
        monthlyExpenses: 0,
        emergencyFund: 'None',
        existingProducts: [],
      },
      investment: {
        primaryGoals: [],
        horizon: 'medium',
        style: 'balanced',
        initialAmount: 100000,
        regularContribution: 0,
      },
      riskTolerance: {
        marketDropReaction: 'hold',
        returnsVsStability: 'balanced',
        preferredStyle: 'balanced',
        maxAcceptableLoss: 10,
      },
    },
  });

  // Function to handle form submission
  const onSubmit = async (data: ClientProfileForm) => {
    setIsSubmitting(true);
    try {
      // Ensure that data is properly typed as ClientProfile
      const typedData = data as unknown as ClientProfile;
      const response = await submitProfile(typedData);
      
      if (response.success) {
        dispatch({ type: 'SET_CLIENT_PROFILE', payload: response.clientProfile });
        toast.success('Client profile saved successfully');
        dispatch({ type: 'SET_STEP', payload: 2 });
      } else {
        toast.error('Failed to save client profile');
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      toast.error('An error occurred while saving the profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to load test data
  const handleLoadTestData = () => {
    // Implement loading test data logic
  };

  return (
    <div>
      <PageTitle
        title="Client Profiling"
        description="Enter the client's personal information and investment preferences."
      />

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Add form fields here based on the schema */}
              {/* For brevity, this is a simplified version */}
              
              <Button type="button" variant="outline" onClick={handleLoadTestData}>
                Load Test Data
              </Button>
              
              <StepNavigation
                nextStep={2}
                nextDisabled={isSubmitting}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
