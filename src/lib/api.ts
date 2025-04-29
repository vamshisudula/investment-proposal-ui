
import { ClientProfile, RiskAssessment, AssetAllocation, ProductRecommendations, InvestmentProposal } from './types';
import { testRiskAssessment, testAssetAllocation, testProductRecommendations, testInvestmentProposal } from './test-data';
import { toast } from 'sonner';

const API_BASE_URL = '/api';
const API_TIMEOUT_MS = 8000;

// Helper to handle API calls with timeout and fallback
async function apiCall<T, R>(
  endpoint: string, 
  payload: T, 
  fallbackFn: (payload: T) => R
): Promise<R> {
  // Create a promise that rejects after timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('API request timed out')), API_TIMEOUT_MS);
  });

  try {
    // Try to make the API call with a timeout race
    const response = await Promise.race([
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      timeoutPromise
    ]);

    if (response instanceof Response) {
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success === false) {
        throw new Error('API returned success=false');
      }
      
      return data;
    }
    
    // Should never reach here due to race, but TypeScript needs it
    throw new Error('Unknown API response');
  } 
  catch (error) {
    // Log the error and use fallback
    console.error(`API call to ${endpoint} failed:`, error);
    toast.error(`Could not reach the server. Using local calculations instead.`);
    return fallbackFn(payload);
  }
}

// API functions matching the contract

export async function submitProfile(clientProfile: ClientProfile): Promise<{ clientProfile: ClientProfile }> {
  return apiCall(
    '/profile',
    clientProfile,
    (profile) => ({ clientProfile: profile })
  );
}

export async function getRiskAssessment(clientProfile: ClientProfile): Promise<{ success: boolean, riskAssessment: RiskAssessment }> {
  return apiCall(
    '/risk-assessment',
    clientProfile,
    () => ({ success: true, riskAssessment: fallbackRiskAssessment(clientProfile) })
  );
}

export async function getAssetAllocation(
  payload: { clientProfile: ClientProfile, riskProfile: RiskAssessment }
): Promise<{ success: boolean, assetAllocation: AssetAllocation }> {
  return apiCall(
    '/asset-allocation',
    payload,
    () => ({ success: true, assetAllocation: fallbackAssetAllocation(payload) })
  );
}

export async function getProductRecommendations(
  payload: { clientProfile: ClientProfile, riskProfile: RiskAssessment, assetAllocation: AssetAllocation }
): Promise<{ success: boolean, productRecommendations: ProductRecommendations }> {
  return apiCall(
    '/product-recommendations',
    payload,
    () => ({ success: true, productRecommendations: fallbackProductRecommendations(payload) })
  );
}

export async function generateProposal(
  payload: {
    clientProfile: ClientProfile,
    riskAssessment: RiskAssessment,
    assetAllocation: AssetAllocation,
    productRecommendations: ProductRecommendations
  }
): Promise<{ success: boolean, investmentProposal: InvestmentProposal }> {
  return apiCall(
    '/generate-proposal',
    payload,
    () => ({ success: true, investmentProposal: fallbackGenerateProposal(payload) })
  );
}

export async function downloadJsonProposal(proposal: InvestmentProposal): Promise<void> {
  const blob = new Blob([JSON.stringify(proposal, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `investment_proposal_${proposal.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Fallback functions (local calculations)

function fallbackRiskAssessment(profile: ClientProfile): RiskAssessment {
  // Simple fallback calculation for risk assessment
  const { age } = profile.personal;
  const { horizon, style } = profile.investment;
  const { marketDropReaction, maxAcceptableLoss } = profile.riskTolerance;
  
  // Age impact (younger = higher score)
  const ageImpact = Math.max(0, Math.min(25, 100 - age));
  
  // Horizon impact
  const horizonMap: Record<string, number> = { 'short': 5, 'medium': 15, 'long': 25 };
  const horizonImpact = horizonMap[horizon] || 15;
  
  // Style impact
  const styleMap: Record<string, number> = { 'growth': 25, 'balanced': 15, 'capital protection': 5 };
  const styleImpact = styleMap[style] || 15;
  
  // Tolerance impact
  const reactionMap: Record<string, number> = { 'buy more': 25, 'hold': 15, 'sell': 5 };
  const toleranceImpact = reactionMap[marketDropReaction] || 15;
  
  // Loss acceptance (direct proportional to score)
  const lossImpact = maxAcceptableLoss * 0.8;
  
  // Calculate total risk score
  let riskScore = ageImpact * 0.2 + horizonImpact * 0.3 + styleImpact * 0.2 + toleranceImpact * 0.2 + lossImpact * 0.1;
  riskScore = Math.round(riskScore);
  
  // Determine risk category
  let riskCategory;
  if (riskScore < 30) riskCategory = "Conservative";
  else if (riskScore < 50) riskCategory = "Moderately Conservative";
  else if (riskScore < 70) riskCategory = "Moderate";
  else if (riskScore < 90) riskCategory = "Moderately Aggressive";
  else riskCategory = "Aggressive";
  
  return {
    riskScore,
    riskCategory,
    details: {
      ageImpact,
      horizonImpact,
      styleImpact,
      toleranceImpact,
      explanation: `Your risk assessment score of ${riskScore} places you in the ${riskCategory} risk category. This is based on your age (${age}), investment horizon (${horizon}), preferred investment style (${style}), and risk tolerance factors.`
    }
  };
}

function fallbackAssetAllocation(
  payload: { clientProfile: ClientProfile, riskProfile: RiskAssessment }
): AssetAllocation {
  const { clientProfile, riskProfile } = payload;
  const { riskScore } = riskProfile;
  const { initialAmount, regularContribution } = clientProfile.investment;
  
  // Calculate portfolio size
  const portfolioSize = initialAmount + (regularContribution * 12); // Simplified

  // Determine asset allocation percentages based on risk score
  let equityPercent, debtPercent, alternativePercent;
  
  if (riskScore < 30) {
    // Conservative
    equityPercent = 30;
    debtPercent = 60;
    alternativePercent = 10;
  } else if (riskScore < 50) {
    // Moderately Conservative
    equityPercent = 45;
    debtPercent = 45;
    alternativePercent = 10;
  } else if (riskScore < 70) {
    // Moderate
    equityPercent = 60;
    debtPercent = 30;
    alternativePercent = 10;
  } else if (riskScore < 90) {
    // Moderately Aggressive
    equityPercent = 75;
    debtPercent = 15;
    alternativePercent = 10;
  } else {
    // Aggressive
    equityPercent = 85;
    debtPercent = 5;
    alternativePercent = 10;
  }
  
  // Product type allocation (simplistic implementation)
  const equityAllocation = {
    "Large Cap": riskScore < 50 ? 20 : 25,
    "Mid Cap": riskScore < 50 ? 5 : 15,
    "Small Cap": riskScore < 50 ? 0 : 10,
    "International": 5
  };
  
  const debtAllocation = {
    "Government Bonds": riskScore < 50 ? 15 : 10,
    "Corporate Bonds": riskScore < 50 ? 20 : 15,
    "Fixed Deposits": riskScore < 50 ? 10 : 5
  };
  
  const alternativeAllocation = {
    "Gold": 5,
    "REITs": 5
  };
  
  // Rationale
  let rationale;
  if (riskScore < 30) {
    rationale = "Based on your conservative risk profile, we've designed a portfolio that emphasizes capital preservation with significant debt allocation.";
  } else if (riskScore < 50) {
    rationale = "Your moderately conservative profile suggests a balanced approach with emphasis on stability while allowing some growth potential.";
  } else if (riskScore < 70) {
    rationale = "With your moderate risk tolerance, we've balanced growth and stability with a significant equity component complemented by debt instruments.";
  } else if (riskScore < 90) {
    rationale = "Your moderately aggressive profile allows for a growth-oriented portfolio with a strong tilt towards equity investments.";
  } else {
    rationale = "Given your aggressive risk profile, we've created a high-growth portfolio with maximum exposure to equity markets.";
  }
  
  return {
    portfolioSize,
    assetClassAllocation: {
      equity: equityPercent,
      debt: debtPercent,
      alternative: alternativePercent
    },
    productTypeAllocation: {
      equity: equityAllocation,
      debt: debtAllocation,
      alternative: alternativeAllocation
    },
    rationale
  };
}

function fallbackProductRecommendations(
  payload: { clientProfile: ClientProfile, riskProfile: RiskAssessment, assetAllocation: AssetAllocation }
): ProductRecommendations {
  // For simplicity, using the test data
  // In a real implementation, this would filter products based on risk profile, asset allocation, etc.
  return testProductRecommendations;
}

function fallbackGenerateProposal(
  payload: {
    clientProfile: ClientProfile,
    riskAssessment: RiskAssessment,
    assetAllocation: AssetAllocation,
    productRecommendations: ProductRecommendations
  }
): InvestmentProposal {
  const { clientProfile, riskAssessment, assetAllocation, productRecommendations } = payload;

  return {
    title: "Personalized Investment Proposal",
    date: new Date().toLocaleDateString(),
    clientName: clientProfile.personal.name,
    advisorName: "System Generated",
    companyIntro: "InvestWise is a leading financial advisory firm with over 20 years of experience in providing personalized investment solutions to clients across various risk profiles and financial goals.",
    marketOutlook: "The current market outlook indicates moderate economic growth with inflationary pressures expected to ease in the coming months. Equity markets are projected to deliver positive returns, while fixed income yields are likely to stabilize.",
    clientProfile,
    riskAssessment,
    assetAllocation,
    productRecommendations,
    implementationPlan: "We recommend a phased approach to implementing your investment plan. Start with an initial lump sum investment of 60% of your allocated amount, followed by systematic investments over the next 3 months to take advantage of rupee cost averaging.",
    disclaimer: "This investment proposal is based on the information provided and current market conditions. Investment markets are subject to risks, and past performance is not indicative of future results. Please consult with your financial advisor before making investment decisions."
  };
}
