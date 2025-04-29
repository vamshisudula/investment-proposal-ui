
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getRiskAssessment } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronRight } from 'lucide-react';
import { Activity } from 'lucide-react';

// Import React Plotly
import Plot from 'react-plotly.js';

export const RiskPage = () => {
  const { state, dispatch, navigateToStep } = useAppContext();
  const { clientProfile, riskAssessment } = state;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRiskAssessment = async () => {
      // Check if clientProfile exists, otherwise redirect to profiling
      if (!clientProfile) {
        toast.warning('Please complete client profiling first');
        navigateToStep(1);
        return;
      }

      // Check if riskAssessment already exists
      if (riskAssessment) {
        return; // Don't re-fetch if we already have data
      }

      setLoading(true);
      try {
        const response = await getRiskAssessment(clientProfile);
        
        if (response.success) {
          dispatch({ type: 'SET_RISK_ASSESSMENT', payload: response.riskAssessment });
          toast.success('Risk assessment completed');
        } else {
          toast.error('Failed to complete risk assessment');
        }
      } catch (error) {
        console.error('Error fetching risk assessment:', error);
        toast.error('An error occurred while processing the risk assessment');
      } finally {
        setLoading(false);
      }
    };

    fetchRiskAssessment();
  }, [clientProfile, riskAssessment, dispatch, navigateToStep]);

  // If no clientProfile, this will redirect in the useEffect
  if (!clientProfile) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  if (loading) {
    return <LoadingSpinner message="Analyzing risk profile..." />;
  }

  if (!riskAssessment) {
    return <LoadingSpinner message="Processing data..." />;
  }

  // Calculate gauge indicator position (0-100)
  const score = riskAssessment.riskScore;

  return (
    <div>
      <PageTitle 
        title="Risk Assessment" 
        description="Analysis of client's risk tolerance and investment profile."
        icon={<Activity className="h-6 w-6" />}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Risk Profile Results</CardTitle>
          <CardDescription>
            Based on your responses, we've analyzed your risk tolerance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center mb-6">
            <div className="w-full h-64">
              <Plot
                data={[
                  {
                    type: 'indicator',
                    mode: 'gauge+number',
                    value: score,
                    title: { text: `Risk Score: ${riskAssessment.riskCategory}` },
                    gauge: {
                      axis: { range: [0, 100] },
                      bar: { color: '#3B82F6' },
                      steps: [
                        { range: [0, 30], color: '#E0F2FE' },
                        { range: [30, 50], color: '#BAE6FD' },
                        { range: [50, 70], color: '#7DD3FC' },
                        { range: [70, 90], color: '#38BDF8' },
                        { range: [90, 100], color: '#0EA5E9' },
                      ],
                      threshold: {
                        line: { color: 'red', width: 4 },
                        thickness: 0.75,
                        value: score
                      }
                    }
                  }
                ]}
                layout={{
                  width: 400,
                  height: 250,
                  margin: { t: 0, b: 0, l: 30, r: 30 }
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <div className="text-center mt-4">
              <p className="text-2xl font-semibold text-primary">
                {riskAssessment.riskCategory}
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-medium">Risk Assessment Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Age Impact</p>
                <p className="text-xl font-semibold">{riskAssessment.details.ageImpact}%</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Horizon Impact</p>
                <p className="text-xl font-semibold">{riskAssessment.details.horizonImpact}%</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Style Impact</p>
                <p className="text-xl font-semibold">{riskAssessment.details.styleImpact}%</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Tolerance Impact</p>
                <p className="text-xl font-semibold">{riskAssessment.details.toleranceImpact}%</p>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-md mt-4">
              <h4 className="font-medium mb-2">Analysis</h4>
              <p className="text-muted-foreground">{riskAssessment.details.explanation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What This Means For Your Investment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">Asset Allocation</h3>
              <p className="text-muted-foreground text-sm">
                Your risk profile suggests an asset allocation that balances growth potential with risk management.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">Investment Horizon</h3>
              <p className="text-muted-foreground text-sm">
                With your determined risk profile, we can align your investments with your time horizon.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">Product Selection</h3>
              <p className="text-muted-foreground text-sm">
                We'll recommend specific financial products that match your risk tolerance and financial goals.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <StepNavigation
        previousStep={1}
        nextStep={3}
      />
    </div>
  );
};
