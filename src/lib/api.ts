
import { ClientProfile, RiskAssessment, AssetAllocation, ProductRecommendations, InvestmentProposal } from './types';
import { generateProposalPDF } from './pdf-generator';

// Mock API responses for local development - these would be replaced with actual API calls
export const getClientProfile = async (profileData: ClientProfile): Promise<{ success: boolean; clientProfile: ClientProfile }> => {
  try {
    // Mock API call
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save client profile');
    }
    
    const data = await response.json();
    return { success: true, clientProfile: data.clientProfile };
  } catch (error) {
    console.error('Error saving client profile:', error);
    // Fallback: Return the input data
    return { success: true, clientProfile: profileData };
  }
};

export const getRiskAssessment = async (clientProfile: ClientProfile): Promise<{ success: boolean; riskAssessment: RiskAssessment }> => {
  try {
    // Mock API call
    const response = await fetch('/api/risk-assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientProfile),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get risk assessment');
    }
    
    const data = await response.json();
    return { success: true, riskAssessment: data.riskAssessment };
  } catch (error) {
    console.error('Error getting risk assessment:', error);
    // Fallback: Generate a simple risk assessment
    return { 
      success: true, 
      riskAssessment: fallbackRiskAssessment(clientProfile)
    };
  }
};

export const getAssetAllocation = async (clientProfile: ClientProfile, riskProfile: RiskAssessment): Promise<{ success: boolean; assetAllocation: AssetAllocation }> => {
  try {
    // Mock API call
    const response = await fetch('/api/asset-allocation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientProfile, riskProfile }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get asset allocation');
    }
    
    const data = await response.json();
    return { success: true, assetAllocation: data.assetAllocation };
  } catch (error) {
    console.error('Error getting asset allocation:', error);
    // Fallback: Generate a simple asset allocation
    return { 
      success: true, 
      assetAllocation: fallbackAssetAllocation(clientProfile, riskProfile)
    };
  }
};

export const getProductRecommendations = async (
  clientProfile: ClientProfile, 
  riskProfile: RiskAssessment,
  assetAllocation: AssetAllocation
): Promise<{ success: boolean; productRecommendations: ProductRecommendations }> => {
  try {
    // Mock API call
    const response = await fetch('/api/product-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientProfile, riskProfile, assetAllocation }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get product recommendations');
    }
    
    const data = await response.json();
    return { success: true, productRecommendations: data.productRecommendations };
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    // Fallback: Generate simple product recommendations
    return { 
      success: true, 
      productRecommendations: fallbackProductRecommendations(clientProfile, riskProfile, assetAllocation)
    };
  }
};

export const generateProposal = async (
  data: {
    clientProfile: ClientProfile;
    riskAssessment: RiskAssessment;
    assetAllocation: AssetAllocation;
    productRecommendations: ProductRecommendations;
  }
): Promise<{ success: boolean; investmentProposal: InvestmentProposal }> => {
  try {
    // Mock API call
    const response = await fetch('/api/generate-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate proposal');
    }
    
    const responseData = await response.json();
    return { success: true, investmentProposal: responseData.investmentProposal };
  } catch (error) {
    console.error('Error generating proposal:', error);
    // Fallback: Generate a simple proposal
    return { 
      success: true, 
      investmentProposal: fallbackProposal(data)
    };
  }
};

export const downloadJsonProposal = async (proposal: InvestmentProposal): Promise<void> => {
  const blob = new Blob([JSON.stringify(proposal, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${proposal.clientName.toLowerCase().replace(/\s+/g, '_')}_investment_proposal.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadProposalPdf = async (proposal: InvestmentProposal): Promise<void> => {
  try {
    // Try to call the API first
    const response = await fetch('/api/proposal/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proposal),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }
    
    // Get the PDF blob from the API
    const pdfBlob = await response.blob();
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${proposal.clientName.toLowerCase().replace(/\s+/g, '_')}_investment_proposal.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading PDF from API, falling back to client-side generation:', error);
    
    // Fallback to client-side PDF generation
    try {
      const pdfBlob = await generateProposalPDF(proposal);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${proposal.clientName.toLowerCase().replace(/\s+/g, '_')}_investment_proposal.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (pdfError) {
      console.error('Error generating PDF client-side:', pdfError);
      throw pdfError;
    }
  }
};

// Fallback functions for when the API is not available
const fallbackRiskAssessment = (clientProfile: ClientProfile): RiskAssessment => {
  // Simple algorithm to determine risk score based on client profile
  const age = clientProfile.personal.age;
  const horizon = clientProfile.investment.horizon;
  const style = clientProfile.investment.style;
  const maxLoss = clientProfile.riskTolerance.maxAcceptableLoss;
  
  // Age factor - younger clients can take more risk
  const ageImpact = Math.max(0, 40 - Math.max(0, age - 25));
  
  // Horizon factor - longer horizon allows for more risk
  const horizonImpact = horizon === 'short' ? 10 : horizon === 'medium' ? 25 : 40;
  
  // Style factor - growth-oriented clients accept more risk
  const styleImpact = style === 'capital protection' ? 10 : style === 'balanced' ? 25 : 40;
  
  // Risk tolerance factor
  const toleranceImpact = Math.min(50, maxLoss * 2); // maxLoss is a percentage
  
  // Calculate weighted score (0-100)
  const riskScore = Math.round((ageImpact + horizonImpact + styleImpact + toleranceImpact) / 4);
  
  // Determine risk category based on score
  let riskCategory;
  if (riskScore < 20) riskCategory = "Conservative";
  else if (riskScore < 40) riskCategory = "Moderately Conservative";
  else if (riskScore < 60) riskCategory = "Moderate";
  else if (riskScore < 80) riskCategory = "Moderately Aggressive";
  else riskCategory = "Aggressive";
  
  return {
    riskScore,
    riskCategory,
    details: {
      ageImpact: Math.min(40, ageImpact),
      horizonImpact,
      styleImpact,
      toleranceImpact,
      explanation: `Your risk assessment score of ${riskScore} places you in the ${riskCategory} risk category. This is based on your age (${age}), investment horizon (${horizon}), preferred investment style (${style}), and risk tolerance factors.`
    }
  };
};

const fallbackAssetAllocation = (clientProfile: ClientProfile, riskProfile: RiskAssessment): AssetAllocation => {
  const riskScore = riskProfile.riskScore;
  const portfolioSize = clientProfile.investment.initialAmount;
  
  // Basic asset allocation based on risk score
  let equity, debt, alternative;
  
  if (riskScore < 20) {
    // Conservative
    equity = 20;
    debt = 70;
    alternative = 10;
  } else if (riskScore < 40) {
    // Moderately Conservative
    equity = 35;
    debt = 55;
    alternative = 10;
  } else if (riskScore < 60) {
    // Moderate
    equity = 50;
    debt = 40;
    alternative = 10;
  } else if (riskScore < 80) {
    // Moderately Aggressive
    equity = 65;
    debt = 25;
    alternative = 10;
  } else {
    // Aggressive
    equity = 80;
    debt = 10;
    alternative = 10;
  }
  
  // Product type allocation based on asset class percentages
  const equityTypes = {
    "Large Cap": Math.min(30, equity),
    "Mid Cap": equity >= 40 ? 15 : Math.max(0, equity - 30),
    "Small Cap": equity >= 60 ? 15 : 0,
    "International": equity >= 70 ? 10 : 0,
  };
  
  const debtTypes = {
    "Government Bonds": Math.min(20, debt),
    "Corporate Bonds": debt >= 30 ? 20 : Math.max(0, debt - 20),
    "Fixed Deposits": debt >= 50 ? debt - 40 : 0,
  };
  
  const alternativeTypes = {
    "Gold": Math.min(5, alternative),
    "REITs": alternative > 5 ? alternative - 5 : 0,
  };
  
  return {
    portfolioSize,
    assetClassAllocation: {
      equity,
      debt,
      alternative
    },
    productTypeAllocation: {
      equity: equityTypes,
      debt: debtTypes,
      alternative: alternativeTypes
    },
    rationale: `Based on your ${riskProfile.riskCategory.toLowerCase()} risk profile, we've designed a portfolio that aligns with your risk tolerance and investment goals with ${equity}% in equity, ${debt}% in debt, and ${alternative}% in alternative investments.`
  };
};

const fallbackProductRecommendations = (
  clientProfile: ClientProfile, 
  riskProfile: RiskAssessment,
  assetAllocation: AssetAllocation
): ProductRecommendations => {
  // Generate generic product recommendations based on asset allocation
  return {
    recommendationSummary: `Based on your ${riskProfile.riskCategory.toLowerCase()} risk profile and asset allocation, we recommend a diversified portfolio with a focus on capital preservation and moderate growth.`,
    recommendations: {
      equity: {
        "Large Cap": [
          {
            name: "Bluechip Growth Fund",
            description: "A fund investing in established companies with stable growth.",
            expectedReturn: "12-14% p.a.",
            risk: "Moderate",
            lockIn: "None",
            minInvestment: 5000
          },
          {
            name: "Index Fund - Nifty 50",
            description: "Tracks the performance of the top 50 companies in India.",
            expectedReturn: "10-12% p.a.",
            risk: "Moderate",
            lockIn: "None",
            minInvestment: 1000
          }
        ],
        "Mid Cap": [
          {
            name: "Emerging Opportunities Fund",
            description: "Focuses on mid-sized companies with high growth potential.",
            expectedReturn: "15-18% p.a.",
            risk: "Moderately High",
            lockIn: "None",
            minInvestment: 5000
          }
        ],
        "Small Cap": [
          {
            name: "Small Cap Discovery Fund",
            description: "Invests in small companies with exceptional growth prospects.",
            expectedReturn: "18-22% p.a.",
            risk: "High",
            lockIn: "None",
            minInvestment: 5000
          }
        ],
        "International": [
          {
            name: "Global Opportunities Fund",
            description: "Invests in international markets for geographical diversification.",
            expectedReturn: "12-15% p.a.",
            risk: "Moderately High",
            lockIn: "None",
            minInvestment: 5000
          }
        ]
      },
      debt: {
        "Government Bonds": [
          {
            name: "Gilt Fund",
            description: "Invests primarily in government securities of various maturities.",
            expectedReturn: "6-8% p.a.",
            risk: "Low",
            lockIn: "None",
            minInvestment: 5000
          }
        ],
        "Corporate Bonds": [
          {
            name: "Corporate Bond Fund",
            description: "Invests in bonds issued by high-rated corporations.",
            expectedReturn: "7-9% p.a.",
            risk: "Low to Moderate",
            lockIn: "None",
            minInvestment: 5000
          }
        ],
        "Fixed Deposits": [
          {
            name: "Bank FD",
            description: "Traditional fixed deposit with guaranteed returns.",
            expectedReturn: "5-6% p.a.",
            risk: "Very Low",
            lockIn: "1-5 years",
            minInvestment: 10000
          }
        ]
      },
      alternative: {
        "Gold": [
          {
            name: "Gold ETF",
            description: "Exchange-traded fund that tracks the price of gold.",
            expectedReturn: "8-10% p.a.",
            risk: "Moderate",
            lockIn: "None",
            minInvestment: 1000
          }
        ],
        "REITs": [
          {
            name: "Real Estate Investment Trust",
            description: "Invests in income-generating real estate properties.",
            expectedReturn: "8-12% p.a.",
            risk: "Moderate",
            lockIn: "None",
            minInvestment: 10000
          }
        ]
      }
    }
  };
};

const fallbackProposal = (data: {
  clientProfile: ClientProfile;
  riskAssessment: RiskAssessment;
  assetAllocation: AssetAllocation;
  productRecommendations: ProductRecommendations;
}): InvestmentProposal => {
  const { clientProfile, riskAssessment, assetAllocation, productRecommendations } = data;
  
  return {
    title: "Personalized Investment Proposal",
    date: new Date().toLocaleDateString(),
    clientName: clientProfile.personal.name,
    advisorName: "InvestWise Advisor",
    companyIntro: "InvestWise is a leading financial advisory firm dedicated to helping clients achieve their financial goals through personalized investment strategies. Our team of experienced advisors works closely with clients to understand their unique needs and develop tailored solutions.",
    marketOutlook: "The current market environment presents both challenges and opportunities. While economic indicators suggest moderate growth, inflation concerns and geopolitical tensions create uncertainty. In this context, a diversified approach with a mix of defensive and growth-oriented assets is advisable.",
    clientProfile,
    riskAssessment,
    assetAllocation,
    productRecommendations,
    implementationPlan: "We recommend implementing this investment strategy in phases:\n\n1. Initial allocation of 60% of funds to core holdings within 1 week.\n2. Staggered investment of the remaining 40% over 3 months to average market entry points.\n3. Regular portfolio review and rebalancing every quarter.\n4. Annual comprehensive strategy reassessment.",
    disclaimer: "This investment proposal is based on the information provided and current market conditions. Past performance is not indicative of future results. Investments are subject to market risks. Please read all scheme-related documents carefully before investing. This is not an official document for regulatory submission."
  };
};
