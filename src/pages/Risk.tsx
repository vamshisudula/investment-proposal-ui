import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PageTitle } from '@/components/PageTitle';
import { StepNavigation } from '@/components/StepNavigation';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getRiskAssessment } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronRight, Edit, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RiskAssessment } from '@/lib/types';

// Import React Plotly
import Plot from 'react-plotly.js';

export const RiskPage = () => {
  const { state, dispatch, navigateToStep } = useAppContext();
  const { clientProfile, riskAssessment } = state;
  const [loading, setLoading] = useState(false);
  const [isEditingRiskProfile, setIsEditingRiskProfile] = useState(false);
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<string>('');

  // Set initial selected risk profile based on current assessment
  useEffect(() => {
    if (riskAssessment) {
      const category = riskAssessment.riskCategory;
      if (category === 'Ultra Aggressive') {
        setSelectedRiskProfile('ultraAggressive');
      } else if (category === 'Aggressive') {
        setSelectedRiskProfile('aggressive');
      } else if (category === 'Moderate') {
        setSelectedRiskProfile('moderate');
      } else if (category === 'Conservative') {
        setSelectedRiskProfile('conservative');
      }
    }
  }, [riskAssessment]);

  useEffect(() => {
    const fetchRiskAssessment = async () => {
      // Check if clientProfile exists, otherwise redirect to profiling
      if (!clientProfile) {
        toast.warning('Please complete client profiling first');
        navigateToStep(1);
        return;
      }

      // Check if we're in manual mode (by checking if manualRiskSelection exists in clientProfile)
      // Note: We added this property in our Profiling.tsx edit but it's not in the ClientProfile type
      // So we need to use a type assertion here
      // We no longer skip risk assessment regardless of manual or automated mode
  // Always show the risk assessment to the user

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
  
  // We no longer redirect for manual mode - always show risk assessment

  if (loading) {
    return <LoadingSpinner message="Analyzing risk profile..." />;
  }

  if (!riskAssessment) {
    return <LoadingSpinner message="Processing data..." />;
  }

  // Function to handle risk profile change
  const handleRiskProfileChange = (value: string) => {
    setSelectedRiskProfile(value);
  };

  // Function to apply the selected risk profile
  const applyRiskProfileChange = () => {
    let newRiskAssessment: RiskAssessment;

    switch (selectedRiskProfile) {
      case 'ultraAggressive':
        newRiskAssessment = {
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
        newRiskAssessment = {
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
        newRiskAssessment = {
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
      default:
        newRiskAssessment = {
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

    // Update the risk assessment in the app context
    dispatch({ type: 'SET_RISK_ASSESSMENT', payload: newRiskAssessment });
    setIsEditingRiskProfile(false);
    toast.success('Risk profile updated successfully');
  };

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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Risk Profile Results</CardTitle>
              <CardDescription>
                Based on your responses, we've analyzed your risk tolerance.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditingRiskProfile(!isEditingRiskProfile)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Change Risk Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditingRiskProfile && (
            <div className="mb-6 p-4 border rounded-md bg-muted/50">
              <h3 className="font-medium mb-2">Select a Different Risk Profile</h3>
              <div className="flex flex-col gap-4">
                <Select
                  value={selectedRiskProfile}
                  onValueChange={handleRiskProfileChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a risk profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ultraAggressive">Ultra Aggressive (Highest risk, highest potential return)</SelectItem>
                    <SelectItem value="aggressive">Aggressive (High risk, high potential return)</SelectItem>
                    <SelectItem value="moderate">Moderate (Medium risk, medium potential return)</SelectItem>
                    <SelectItem value="conservative">Conservative (Low risk, low potential return)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditingRiskProfile(false)}>Cancel</Button>
                  <Button onClick={applyRiskProfileChange}>Apply Changes</Button>
                </div>
              </div>
            </div>
          )}
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
                      axis: { range: [0, 30] },
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
                {riskAssessment.riskCategory === 'Conservative' && (
                  "Your conservative risk profile suggests an asset allocation focused on capital preservation and stable returns. We recommend a higher allocation to fixed income and debt instruments with limited equity exposure."
                )}
                {riskAssessment.riskCategory === 'Moderate' && (
                  "Your moderate risk profile suggests a balanced asset allocation that combines growth potential with risk management. We recommend a mix of equity and fixed income investments to achieve long-term growth while managing volatility."
                )}
                {riskAssessment.riskCategory === 'Aggressive' && (
                  "Your aggressive risk profile suggests an asset allocation focused on maximizing growth potential. We recommend a higher allocation to equity and alternative investments to capitalize on market opportunities for long-term wealth creation."
                )}
                {riskAssessment.riskCategory === 'Ultra-Aggressive' && (
                  "Your ultra-aggressive risk profile suggests an asset allocation heavily focused on maximum growth potential. We recommend a dominant allocation to equity investments (90%+), including higher-risk segments like small-caps, sector-specific funds, and emerging markets, with minimal allocation to fixed income."
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">Investment Horizon</h3>
              <p className="text-muted-foreground text-sm">
                {riskAssessment.riskCategory === 'Conservative' && (
                  "With your conservative risk profile, we recommend shorter to medium-term investment horizons (1-5 years) with an emphasis on liquidity and capital protection. This approach is suitable for investors nearing retirement or with short-term financial goals."
                )}
                {riskAssessment.riskCategory === 'Moderate' && (
                  "With your moderate risk profile, we recommend medium to long-term investment horizons (5-10 years) that allow for some market fluctuations while pursuing growth. This balanced approach suits investors with mid-term financial goals."
                )}
                {riskAssessment.riskCategory === 'Aggressive' && (
                  "With your aggressive risk profile, we recommend longer investment horizons (10+ years) that can withstand market volatility and capitalize on growth opportunities. This approach is ideal for younger investors or those with distant financial goals."
                )}
                {riskAssessment.riskCategory === 'Ultra-Aggressive' && (
                  "With your ultra-aggressive risk profile, we recommend very long investment horizons (10+ years) with a high tolerance for significant market fluctuations. This approach requires the ability to withstand extended periods of volatility and is best suited for younger investors with substantial risk capacity and a long runway to retirement."
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">Product Selection</h3>
              <p className="text-muted-foreground text-sm">
                {riskAssessment.riskCategory === 'Conservative' && (
                  "We'll recommend conservative financial products such as government bonds, corporate fixed deposits, debt mutual funds, and blue-chip dividend stocks that prioritize capital preservation and regular income."
                )}
                {riskAssessment.riskCategory === 'Moderate' && (
                  "We'll recommend a diversified mix of financial products including balanced mutual funds, index funds, high-quality corporate bonds, and select growth stocks that balance income generation with capital appreciation."
                )}
                {riskAssessment.riskCategory === 'Aggressive' && (
                  "We'll recommend growth-oriented financial products such as equity mutual funds, small and mid-cap stocks, international equity, and alternative investments that maximize long-term capital appreciation potential."
                )}
                {riskAssessment.riskCategory === 'Ultra-Aggressive' && (
                  "We'll recommend high-growth financial products such as sector-specific equity funds, small-cap stocks, emerging market equities, thematic funds, and potentially higher-risk alternative investments like private equity or venture capital funds that aim for maximum capital appreciation with higher volatility."
                )}
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
