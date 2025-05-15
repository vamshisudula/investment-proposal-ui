import { ClientProfile, RiskAssessment, AssetAllocation, ProductRecommendations, InvestmentProposal } from './types';
import { generateProposalPDF } from './pdf-generator';

// API Base URL
const API_BASE_URL = 'http://localhost:5000';

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      throw new Error(`API Error (${response.status}): ${errorText}`);
    } catch (e) {
      console.error(`API Error (${response.status}): Could not parse error response`);
      throw new Error(`API Error (${response.status}): Unknown error`);
    }
  }
  
  try {
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Error parsing API response:', e);
    throw new Error('Invalid JSON response from API');
  }
};

// Transform client profile data to match API expected format
const transformClientProfileForAPI = (profileData: ClientProfile) => {
  return {
    personalInfo: {
      name: profileData.personal.name,
      age: profileData.personal.age,
      occupation: profileData.personal.occupation,
      annualIncome: profileData.financial.monthlyExpenses * 12, // Estimated annual income
      email: profileData.personal.email,
      phone: profileData.personal.phone,
      address: "" // Not available in client data
    },
    financialSituation: {
      netWorth: profileData.financial.currentInvestments + profileData.financial.realEstate - profileData.financial.liabilities,
      monthlyExpenses: profileData.financial.monthlyExpenses,
      existingInvestments: {
        stocks: profileData.financial.currentInvestments * 0.3, // Estimate allocation
        bonds: profileData.financial.currentInvestments * 0.2,
        realEstate: profileData.financial.realEstate,
        cash: profileData.financial.savings
      },
      debts: {
        mortgage: profileData.financial.liabilities * 0.7, // Estimate allocation
        studentLoans: profileData.financial.liabilities * 0.1,
        carLoan: profileData.financial.liabilities * 0.1,
        creditCards: profileData.financial.liabilities * 0.1
      },
      emergencyFund: profileData.financial.savings,
      insuranceCoverage: {
        health: true, // Default values
        life: true,
        disability: false,
        propertyAndCasualty: true
      }
    },
    investmentObjectives: {
      primaryGoal: profileData.investment.primaryGoals[0]?.toLowerCase() || "retirement",
      timeHorizon: profileData.investment.horizon === "short" ? 5 : 
                  profileData.investment.horizon === "medium" ? 15 : 25,
      initialInvestmentAmount: profileData.investment.initialAmount,
      monthlyContribution: profileData.investment.regularContribution,
      riskTolerance: profileData.riskTolerance.preferredStyle
    },
    preferences: {
      preferredInvestmentTypes: ["stocks", "bonds", "mutualFunds"], // Default values
      excludedSectors: [],
      preferredGeographies: ["India", "US"],
      sustainabilityFocus: false,
      liquidityNeeds: "medium"
    },
    riskTolerance: {
      marketDropReaction: profileData.riskTolerance.marketDropReaction || "hold",
      returnsVsStability: profileData.riskTolerance.returnsVsStability || "balanced",
      preferredStyle: profileData.riskTolerance.preferredStyle || "moderate",
      maxAcceptableLoss: profileData.riskTolerance.maxAcceptableLoss || 10
    }
  };
};

// Real API endpoints implementation
export const getClientProfile = async (profileData: ClientProfile): Promise<{ success: boolean; clientProfile: ClientProfile }> => {
  try {
    // Transform the data to match API expectations
    const transformedData = transformClientProfileForAPI(profileData);
    console.log('Making API call to /api/profile with transformed data:', JSON.stringify(transformedData));
    
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    });
    
    const data = await handleApiResponse(response);
    console.log('API response from /api/profile:', data);
    return { success: true, clientProfile: profileData }; // Return original format for client
  } catch (error) {
    console.error('Error saving client profile:', error);
    // Fallback: Return the input data
    console.warn('Using fallback data for client profile');
    return { success: true, clientProfile: profileData };
  }
};

// Submit profile function that calls the profile API endpoint
export const submitProfile = async (profileData: ClientProfile): Promise<{ success: boolean; clientProfile: ClientProfile }> => {
  return getClientProfile(profileData);
};

// Transform client profile data for risk assessment API
const transformProfileForRiskAssessment = (profileData: ClientProfile) => {
  // Map market drop reaction values to what the API expects
  let marketDropReaction;
  switch (profileData.riskTolerance.marketDropReaction) {
    case 'sell':
      marketDropReaction = 'sell_all';
      break;
    case 'hold':
      marketDropReaction = 'do_nothing';
      break;
    case 'buy':
      marketDropReaction = 'buy_more';
      break;
    default:
      marketDropReaction = 'do_nothing';
  }

  // Map investment horizon values to what the API expects
  let investmentHorizon;
  switch (profileData.investment.horizon) {
    case 'short':
      investmentHorizon = 'short_term';
      break;
    case 'medium':
      investmentHorizon = 'medium_term';
      break;
    case 'long':
      investmentHorizon = 'long_term';
      break;
    default:
      investmentHorizon = 'medium_term';
  }

  // Map portfolio style to what the API expects
  let portfolioStyle = profileData.riskTolerance.preferredStyle;
  if (portfolioStyle === 'moderate') {
    portfolioStyle = 'balanced';
  }
  
  // Create the transformed data object with the correct field names and values
  return {
    personalInfo: {
      age: profileData.personal.age,
      name: profileData.personal.name,
      occupation: profileData.personal.occupation || "Professional"
    },
    investmentObjectives: {
      // Use the mapped investment horizon string value instead of a number
      investmentHorizon: investmentHorizon,
      riskTolerance: profileData.riskTolerance.preferredStyle,
      primaryGoal: profileData.investment.primaryGoals[0]?.toLowerCase() || "retirement",
      initialInvestmentAmount: profileData.investment.initialAmount || 500000,
      monthlyContribution: profileData.investment.regularContribution || 10000
    },
    financialSituation: {
      netWorth: profileData.financial.currentInvestments + profileData.financial.realEstate - profileData.financial.liabilities,
      emergencyFund: profileData.financial.savings,
      monthlyExpenses: profileData.financial.monthlyExpenses || 50000,
      existingInvestments: {
        stocks: profileData.financial.currentInvestments * 0.3,
        bonds: profileData.financial.currentInvestments * 0.2,
        realEstate: profileData.financial.realEstate,
        cash: profileData.financial.savings
      }
    },
    riskTolerance: {
      // Use the mapped values for the fields the API expects
      marketDropReaction: marketDropReaction,
      returnsVsStabilityPreference: profileData.riskTolerance.returnsVsStability || "balanced",
      preferredPortfolioStyle: portfolioStyle,
      maxAcceptableLoss: profileData.riskTolerance.maxAcceptableLoss || 10,
      investmentKnowledge: profileData.riskTolerance.investmentKnowledge || "intermediate"
    },
    knowledgeAndExperience: {
      investmentKnowledge: profileData.riskTolerance.investmentKnowledge === 'advanced' ? 'advanced' : 
                         profileData.riskTolerance.investmentKnowledge === 'beginner' ? 'beginner' : 'intermediate'
    },
    preferences: {
      preferredInvestmentTypes: ["stocks", "bonds", "mutualFunds"],
      excludedSectors: [],
      preferredGeographies: ["India", "US"],
      sustainabilityFocus: false,
      liquidityNeeds: "medium"
    }
  };
};

export const getRiskAssessment = async (clientProfile: ClientProfile): Promise<{ success: boolean; riskAssessment: RiskAssessment }> => {
  try {
    // Transform the data to match API expectations
    const transformedData = transformProfileForRiskAssessment(clientProfile);
    console.log('Making API call to /api/risk-assessment with transformed data:', JSON.stringify(transformedData));
    
    const response = await fetch(`${API_BASE_URL}/api/risk-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    });
    
    const data = await handleApiResponse(response);
    console.log('API response from /api/risk-assessment:', data);
    
    // Transform API response back to client expected format if needed
    const clientRiskAssessment: RiskAssessment = {
      riskScore: data.riskAssessment.riskScore,
      riskCategory: data.riskAssessment.riskCategory,
      details: {
        ageImpact: data.riskAssessment.ageFactorScore || 0,
        horizonImpact: data.riskAssessment.timeHorizonScore || 0,
        styleImpact: data.riskAssessment.selfReportedRiskScore || 0,
        toleranceImpact: data.riskAssessment.financialStabilityScore || 0,
        explanation: `Your risk assessment score of ${data.riskAssessment.riskScore} places you in the ${data.riskAssessment.riskCategory} risk category.`
      }
    };
    
    return { success: true, riskAssessment: clientRiskAssessment };
  } catch (error) {
    console.error('Error getting risk assessment:', error);
    // Fallback: Generate a simple risk assessment
    console.warn('Using fallback data for risk assessment');
    return { 
      success: true, 
      riskAssessment: fallbackRiskAssessment(clientProfile)
    };
  }
};

// Transform data for asset allocation API
const transformDataForAssetAllocation = (clientProfile: ClientProfile, riskProfile: RiskAssessment) => {
  // First transform the client profile
  const transformedProfile = transformClientProfileForAPI(clientProfile);
  
  // Then create the expected structure for the asset allocation API
  return {
    clientProfile: transformedProfile,
    riskProfile: {
      riskScore: riskProfile.riskScore,
      riskCategory: riskProfile.riskCategory,
      recommendedAssetAllocation: {
        equity: riskProfile.riskScore,
        debt: 100 - riskProfile.riskScore - 5,
        alternatives: 5,
        cash: 5
      }
    }
  };
};

export const getAssetAllocation = async (clientProfile: ClientProfile, riskProfile: RiskAssessment): Promise<{ success: boolean; assetAllocation: AssetAllocation }> => {
  try {
    // Transform the data to match API expectations
    const transformedData = transformDataForAssetAllocation(clientProfile, riskProfile);
    console.log('Making API call to /api/asset-allocation with transformed data:', JSON.stringify(transformedData));
    
    const response = await fetch(`${API_BASE_URL}/api/asset-allocation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    });
    
    const data = await handleApiResponse(response);
    console.log('API response from /api/asset-allocation:', data);
    
    // Use the backend's allocation data directly without transforming it
    // This ensures we display the exact allocation that the backend generates
    const clientAssetAllocation: AssetAllocation = {
      portfolioSize: data.assetAllocation.portfolioSize,
      assetClassAllocation: {
        equity: data.assetAllocation.assetClassAllocation.equity,
        debt: data.assetAllocation.assetClassAllocation.debt
      },
      productTypeAllocation: data.assetAllocation.productTypeAllocation || {
        equity: generateDefaultProductTypeAllocation('equity', data.assetAllocation.assetClassAllocation.equity),
        debt: generateDefaultProductTypeAllocation('debt', data.assetAllocation.assetClassAllocation.debt)
      },
      rationale: data.assetAllocation.allocationExplanation || 
                `Based on your ${riskProfile.riskCategory} risk profile and portfolio size (₹${(data.assetAllocation.portfolioSize/100000).toFixed(2)} lakhs), we've designed a portfolio with ${data.assetAllocation.assetClassAllocation.equity}% in equity and ${data.assetAllocation.assetClassAllocation.debt}% in debt.`
    };
    
    console.log('Frontend using asset allocation:', JSON.stringify(clientAssetAllocation, null, 2));
    
    return { success: true, assetAllocation: clientAssetAllocation };
  } catch (error) {
    console.error('Error getting asset allocation:', error);
    // Fallback: Generate a simple asset allocation
    console.warn('Using fallback data for asset allocation');
    return { 
      success: true, 
      assetAllocation: fallbackAssetAllocation(clientProfile, riskProfile)
    };
  }
};

// Helper function to generate default product type allocation based on API patterns
const generateDefaultProductTypeAllocation = (assetClass: string, percentage: number) => {
  if (assetClass === 'equity') {
    // Match the product types from the API's generateProductTypeAllocation function
    if (percentage <= 40) {
      // For smaller equity allocations, focus on mutual funds
      return {
        'Large Cap': Math.round(percentage * 0.4),
        'Mid Cap': Math.round(percentage * 0.3),
        'Small Cap': Math.round(percentage * 0.3)
      };
    } else if (percentage <= 60) {
      // For moderate equity allocations, include some PMS
      return {
        'Large Cap': Math.round(percentage * 0.35),
        'Mid Cap': Math.round(percentage * 0.25),
        'Small Cap': Math.round(percentage * 0.25),
        'PMS': Math.round(percentage * 0.15)
      };
    } else {
      // For aggressive equity allocations, include PMS and AIF
      return {
        'Large Cap': Math.round(percentage * 0.3),
        'Mid Cap': Math.round(percentage * 0.2),
        'Small Cap': Math.round(percentage * 0.2),
        'PMS': Math.round(percentage * 0.2),
        'AIF': Math.round(percentage * 0.1)
      };
    }
  } else if (assetClass === 'debt') {
    // Match the product types from the API's generateProductTypeAllocation function
    if (percentage <= 30) {
      // For smaller debt allocations, focus on mutual funds
      return {
        'Government Bonds': Math.round(percentage * 0.5),
        'Corporate Bonds': Math.round(percentage * 0.5)
      };
    } else {
      // For larger debt allocations, include fixed deposits
      return {
        'Government Bonds': Math.round(percentage * 0.3),
        'Corporate Bonds': Math.round(percentage * 0.3),
        'Fixed Deposits': Math.round(percentage * 0.4)
      };
    }
  } else {
    // This branch should never be reached after removing alternative assets
    return {};
  }
};

// Transform data for product recommendations API
const transformDataForProductRecommendations = (
  clientProfile: ClientProfile, 
  riskProfile: RiskAssessment,
  assetAllocation: AssetAllocation
) => {
  // First transform the client profile and asset allocation
  const transformedProfile = transformClientProfileForAPI(clientProfile);
  
  // Create a properly formatted productTypeAllocation object for the API
  // The backend expects specific structure for equity and debt allocations
  const equityAllocation = assetAllocation.productTypeAllocation.equity || {};
  const debtAllocation = assetAllocation.productTypeAllocation.debt || {};
  
  // Format equity allocation for the API
  const formattedEquityAllocation = {
    mutualFunds: 60,  // Default values
    pms: 20,
    aif: 15,
    unlistedStocks: 5
  };
  
  // Format debt allocation for the API
  const formattedDebtAllocation = {
    mutualFunds: 70,  // Default values
    direct: 20,
    aif: 10
  };
  
  // Format goldSilver allocation for the API
  const formattedGoldSilverAllocation = {
    etf: 70,
    physical: 30
  };
  
  // Then create the expected structure for the product recommendations API
  return {
    clientProfile: transformedProfile,
    riskProfile: {
      riskScore: riskProfile.riskScore,
      riskCategory: riskProfile.riskCategory
    },
    assetAllocation: {
      portfolioSize: assetAllocation.portfolioSize,
      assetClassAllocation: {
        equity: assetAllocation.assetClassAllocation.equity,
        debt: assetAllocation.assetClassAllocation.debt,
        goldSilver: assetAllocation.assetClassAllocation.alternative ? assetAllocation.assetClassAllocation.alternative / 2 : 5,
        cash: 5
      },
      productTypeAllocation: {
        equity: formattedEquityAllocation,
        debt: formattedDebtAllocation,
        goldSilver: formattedGoldSilverAllocation
      }
    }
  };
};

export const getProductRecommendations = async (
  clientProfile: ClientProfile, 
  riskProfile: RiskAssessment,
  assetAllocation: AssetAllocation
): Promise<{ success: boolean; productRecommendations: ProductRecommendations }> => {
  try {
    // Transform the data to match API expectations
    const transformedData = transformDataForProductRecommendations(clientProfile, riskProfile, assetAllocation);
    console.log('Making API call to /api/product-recommendations with transformed data:', JSON.stringify(transformedData));
    
    const response = await fetch(`${API_BASE_URL}/api/product-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    });
    
    const data = await handleApiResponse(response);
    console.log('API response from /api/product-recommendations:', data);
    
    // Transform API response to client format if needed
    // Make sure we have the correct structure for the frontend
    if (data.productRecommendations) {
      console.log('Product recommendations structure:', JSON.stringify(data.productRecommendations, null, 2));
      
      // Ensure the recommendations object has the expected structure
      if (!data.productRecommendations.recommendations) {
        console.warn('Missing recommendations object in product recommendations response');
        data.productRecommendations.recommendations = {};
      }
      
      return { success: true, productRecommendations: data.productRecommendations };
    } else if (data.recommendations) {
      // If the API returns a different structure, adapt it
      console.log('Direct recommendations structure found:', JSON.stringify(data.recommendations, null, 2));
      
      // Transform the recommendations to match the ProductCategory interface
      const transformedRecommendations: any = {};
      
      // Process each asset class (equity, debt, alternative)
      Object.keys(data.recommendations).forEach(assetClass => {
        transformedRecommendations[assetClass] = {};
        
        // Process each product type within the asset class
        Object.keys(data.recommendations[assetClass]).forEach(productType => {
          const products = data.recommendations[assetClass][productType];
          
          // If it's already in the correct format with products and allocation
          if (products.products && typeof products.allocation === 'number') {
            transformedRecommendations[assetClass][productType] = products;
          } 
          // If it's an array of products, convert to the correct format
          else if (Array.isArray(products)) {
            transformedRecommendations[assetClass][productType] = {
              products: products,
              allocation: 10 // Default allocation percentage
            };
          }
        });
      });
      
      const formattedRecommendations = {
        recommendations: transformedRecommendations,
        recommendationSummary: data.recommendationSummary || 'Based on your risk profile, we have recommended a diversified portfolio of investment products.'
      };
      
      return { success: true, productRecommendations: formattedRecommendations };
    } else {
      // Direct API response structure - this is likely how the products.js module returns data
      console.log('Checking for direct API response structure');
      if (data.success && data.recommendations) {
        console.log('Found direct API response with recommendations:', JSON.stringify(data.recommendations, null, 2));
        
        // Transform the recommendations to match the ProductCategory interface
        const transformedRecommendations: any = {};
        
        // Process each asset class (equity, debt, alternative)
        Object.keys(data.recommendations).forEach(assetClass => {
          transformedRecommendations[assetClass] = {};
          
          // Process each product type within the asset class
          Object.keys(data.recommendations[assetClass]).forEach(productType => {
            const products = data.recommendations[assetClass][productType];
            
            // If it's already in the correct format with products and allocation
            if (products.products && typeof products.allocation === 'number') {
              transformedRecommendations[assetClass][productType] = products;
            } 
            // If it's an array of products, convert to the correct format
            else if (Array.isArray(products)) {
              transformedRecommendations[assetClass][productType] = {
                products: products,
                allocation: 10 // Default allocation percentage
              };
            }
          });
        });
        
        const formattedRecommendations = {
          recommendations: transformedRecommendations,
          recommendationSummary: data.recommendationSummary || 'Based on your risk profile, we have recommended a diversified portfolio of investment products.'
        };
        
        return { success: true, productRecommendations: formattedRecommendations };
      }
      
      console.warn('Unexpected product recommendations structure:', data);
      return { success: true, productRecommendations: fallbackProductRecommendations(clientProfile, riskProfile, assetAllocation) };
    }
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    // Fallback: Generate simple product recommendations
    console.warn('Using fallback data for product recommendations');
    return { 
      success: true, 
      productRecommendations: fallbackProductRecommendations(clientProfile, riskProfile, assetAllocation)
    };
  }
};

// Transform data for proposal generation API
const transformDataForProposal = (
  data: {
    clientProfile: ClientProfile;
    riskAssessment: RiskAssessment;
    assetAllocation: AssetAllocation;
    productRecommendations: ProductRecommendations;
  }
) => {
  // Transform each component to match API expectations
  const transformedProfile = transformClientProfileForAPI(data.clientProfile);
  
  return {
    clientProfile: transformedProfile,
    riskProfile: {
      riskScore: data.riskAssessment.riskScore,
      riskCategory: data.riskAssessment.riskCategory
    },
    assetAllocation: {
      portfolioSize: data.assetAllocation.portfolioSize,
      assetClassAllocation: {
        equity: data.assetAllocation.assetClassAllocation.equity,
        debt: data.assetAllocation.assetClassAllocation.debt,
        goldSilver: data.assetAllocation.assetClassAllocation.alternative / 2,
        cash: 5
      },
      productTypeAllocation: {
        equity: data.assetAllocation.productTypeAllocation.equity,
        debt: data.assetAllocation.productTypeAllocation.debt,
        goldSilver: data.assetAllocation.productTypeAllocation.alternative
      }
    },
    productRecommendations: data.productRecommendations
  };
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
    // Validate data before making API call
    if (!data.riskAssessment || !data.riskAssessment.riskCategory) {
      console.error('Missing required data: riskAssessment.riskCategory');
      throw new Error('Missing required data: riskAssessment.riskCategory');
    }
    
    if (!data.clientProfile || !data.clientProfile.personal || !data.clientProfile.personal.name) {
      console.error('Missing required data: clientProfile.personal.name');
      throw new Error('Missing required data: clientProfile.personal.name');
    }
    
    // Transform the data to match API expectations
    const transformedData = transformDataForProposal(data);
    console.log('Making API call to /api/generate-proposal with transformed data:', JSON.stringify(transformedData));
    
    const response = await fetch(`${API_BASE_URL}/api/generate-proposal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    });
    
    const responseData = await handleApiResponse(response);
    console.log('API response from /api/generate-proposal:', responseData);
    
    // Transform the API response to match client expected format if needed
    return { success: true, investmentProposal: responseData.investmentProposal };
  } catch (error) {
    console.error('Error generating proposal:', error);
    // Fallback: Generate a simple proposal
    console.warn('Using fallback data for investment proposal');
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
  // First, ensure we have valid product recommendations with a summary
  if (!proposal.productRecommendations?.recommendationSummary) {
    console.warn('Product recommendations summary missing, generating default');
    proposal.productRecommendations = {
      ...proposal.productRecommendations,
      recommendationSummary: `Based on your risk profile (${proposal.riskAssessment?.riskCategory || 'Moderate'}) and investment objectives, we recommend a diversified portfolio of investment products across equity, debt, and alternative assets. The specific allocation and product selection are designed to align with your financial goals while maintaining an appropriate risk level.`
    };
  }

  try {
    // Ensure proposal has all required fields before sending to API
    const validatedProposal = ensureValidProposal(proposal);
    
    // Transform the data into the exact format expected by the API
    const apiProposalData = {
      title: validatedProposal.title || "Investment Proposal",
      date: validatedProposal.date || new Date().toLocaleDateString(),
      clientName: validatedProposal.clientName || "Client",
      advisorName: validatedProposal.advisorName || "InvestWise Advisor",
      
      // Use a try-catch block to ensure transformClientProfileForAPI doesn't fail
      clientProfile: (() => {
        try {
          return transformClientProfileForAPI(validatedProposal.clientProfile);
        } catch (error) {
          console.error('Error transforming client profile:', error);
          // Return a minimal valid structure
          return {
            personalInfo: {
              name: validatedProposal.clientName || "Client",
              age: 35,
              occupation: "Professional",
              annualIncome: 1000000,
              email: "client@example.com",
              phone: "+91-0000000000",
              address: ""
            },
            financialSituation: {
              netWorth: 2000000,
              monthlyExpenses: 50000,
              existingInvestments: { stocks: 0, bonds: 0, realEstate: 0, cash: 0 },
              debts: { mortgage: 0, studentLoans: 0, carLoan: 0, creditCards: 0 },
              emergencyFund: 100000,
              insuranceCoverage: { health: true, life: true, disability: false, propertyAndCasualty: true }
            },
            investmentObjectives: {
              primaryGoal: "retirement",
              timeHorizon: 20,
              initialInvestmentAmount: 500000,
              monthlyContribution: 10000,
              riskTolerance: "moderate"
            },
            preferences: {
              preferredInvestmentTypes: ["stocks", "bonds", "mutualFunds"],
              excludedSectors: [],
              preferredGeographies: ["India", "US"],
              sustainabilityFocus: false,
              liquidityNeeds: "medium"
            },
            riskTolerance: {
              marketDropReaction: "hold",
              returnsVsStability: "balanced",
              preferredStyle: "moderate",
              maxAcceptableLoss: 10
            }
          };
        }
      })(),
      
      riskProfile: {
        riskScore: validatedProposal.riskAssessment?.riskScore || 50,
        riskCategory: validatedProposal.riskAssessment?.riskCategory || "Moderate",
        details: validatedProposal.riskAssessment?.details || {
          explanation: "Balanced risk profile suitable for medium-term investment goals."
        }
      },
      
      assetAllocation: {
        portfolioSize: validatedProposal.assetAllocation?.portfolioSize || 500000,
        assetClassAllocation: {
          equity: validatedProposal.assetAllocation?.assetClassAllocation?.equity || 50,
          debt: validatedProposal.assetAllocation?.assetClassAllocation?.debt || 40,
          goldSilver: (validatedProposal.assetAllocation?.assetClassAllocation?.alternative || 10) / 2,
          cash: 5
        },
        rationale: validatedProposal.assetAllocation?.rationale || "Balanced allocation strategy aligned with risk profile."
      },
      
      companyIntroduction: {
        title: "About INVEST4EDU PRIVATE LIMITED",
        content: validatedProposal.companyIntro || "INVEST4EDU is a leading financial advisory firm dedicated to helping clients achieve their financial goals."
      },
      
      marketOverview: {
        title: "Market Outlook",
        content: validatedProposal.marketOutlook || "The current market environment presents both challenges and opportunities for investors."
      },
      
      clientProfileRecap: {
        title: "Client Profile Summary",
        content: `
## Personal Information
- **Name**: ${validatedProposal.clientProfile?.personal?.name || "Client"}
- **Age**: ${validatedProposal.clientProfile?.personal?.age || 35}
- **Occupation**: ${validatedProposal.clientProfile?.personal?.occupation || "Professional"}

## Investment Objectives
- **Primary Goals**: ${(validatedProposal.clientProfile?.investment?.primaryGoals || ["Retirement"]).join(', ')}
- **Investment Horizon**: ${validatedProposal.clientProfile?.investment?.horizon || "Medium-term"}

## Risk Profile
- **Risk Category**: ${validatedProposal.riskAssessment?.riskCategory || "Moderate"}
- **Risk Score**: ${validatedProposal.riskAssessment?.riskScore || 50}
`
      },
      
      assetAllocationSummary: {
        title: "Asset Allocation Strategy",
        content: `Based on your risk profile (${validatedProposal.riskAssessment?.riskCategory || "Moderate"}), we recommend the following asset allocation:

| Asset Class | Allocation (%) |
|-------------|----------------|
| Equity | ${validatedProposal.assetAllocation?.assetClassAllocation?.equity || 50}% |
| Debt | ${validatedProposal.assetAllocation?.assetClassAllocation?.debt || 40}% |
| Gold & Silver | ${(validatedProposal.assetAllocation?.assetClassAllocation?.alternative || 10) / 2}% |
| Cash | 5% |`
      },
      
      productDetails: {
        title: "Investment Products",
        content: proposal.productRecommendations?.recommendationSummary || `Based on your risk profile and asset allocation strategy, we recommend a diversified portfolio of investment products:

1. Equity: Large-cap and mid-cap mutual funds for stable growth
2. Debt: Government securities and corporate bonds for regular income
3. Gold & Silver: ETFs for portfolio diversification
4. Cash: High-yield savings account for liquidity`
      },
      
      implementationPlan: {
        title: "Implementation Strategy",
        content: validatedProposal.implementationPlan || `
1. Initial allocation of 60% of funds to core holdings within 1 week
2. Staggered investment of remaining 40% over 3 months
3. Regular portfolio review and rebalancing every quarter
4. Annual comprehensive strategy reassessment`
      },
      
      disclaimer: validatedProposal.disclaimer || `This investment proposal is based on the information provided and current market conditions. Past performance is not indicative of future results. Investments are subject to market risks. Please read all scheme-related documents carefully before investing.`
    };

    console.log('Making API call to generate PDF with data:', JSON.stringify(apiProposalData));

    const response = await fetch(`${API_BASE_URL}/api/generate-proposal-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiProposalData)
    });

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate PDF: ${response.status} - ${errorText}`);
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();

    // Create a download link
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${validatedProposal.clientName || 'Client'}_Investment_Proposal.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

// Helper function to ensure the proposal has all required fields
const ensureValidProposal = (proposal: Partial<InvestmentProposal>): InvestmentProposal => {
  // Create a complete proposal with default values for any missing fields
  return {
    title: proposal.title || "Investment Proposal",
    date: proposal.date || new Date().toLocaleDateString(),
    clientName: proposal.clientName || "Client",
    advisorName: proposal.advisorName || "InvestWise Advisor",
    companyIntro: proposal.companyIntro || "InvestWise is a leading financial advisory firm.",
    marketOutlook: proposal.marketOutlook || "Current market conditions are favorable for a balanced approach.",
    
    // Ensure clientProfile exists with all required nested objects
    clientProfile: {
      personal: {
        name: proposal.clientProfile?.personal?.name || "Client",
        age: proposal.clientProfile?.personal?.age || 35,
        occupation: proposal.clientProfile?.personal?.occupation || "Professional",
        email: proposal.clientProfile?.personal?.email || "client@example.com",
        phone: proposal.clientProfile?.personal?.phone || "+91-0000000000",
        maritalStatus: proposal.clientProfile?.personal?.maritalStatus || "single",
        dependents: proposal.clientProfile?.personal?.dependents || 0
      },
      financial: {
        currentInvestments: proposal.clientProfile?.financial?.currentInvestments || 500000,
        liabilities: proposal.clientProfile?.financial?.liabilities || 0,
        realEstate: proposal.clientProfile?.financial?.realEstate || 0,
        savings: proposal.clientProfile?.financial?.savings || 100000,
        monthlyExpenses: proposal.clientProfile?.financial?.monthlyExpenses || 50000,
        emergencyFund: proposal.clientProfile?.financial?.emergencyFund || "3-6 months",
        existingProducts: proposal.clientProfile?.financial?.existingProducts || []
      },
      investment: {
        primaryGoals: proposal.clientProfile?.investment?.primaryGoals || ["retirement"],
        horizon: proposal.clientProfile?.investment?.horizon || "medium",
        style: proposal.clientProfile?.investment?.style || "balanced",
        initialAmount: proposal.clientProfile?.investment?.initialAmount || 500000,
        regularContribution: proposal.clientProfile?.investment?.regularContribution || 0
      },
      riskTolerance: {
        marketDropReaction: proposal.clientProfile?.riskTolerance?.marketDropReaction || "",
        returnsVsStability: proposal.clientProfile?.riskTolerance?.returnsVsStability || "balanced",
        preferredStyle: proposal.clientProfile?.riskTolerance?.preferredStyle || "moderate",
        maxAcceptableLoss: proposal.clientProfile?.riskTolerance?.maxAcceptableLoss || 10,
        investmentKnowledge: proposal.clientProfile?.riskTolerance?.investmentKnowledge || "intermediate"
      }
    },
    
    // Ensure riskAssessment exists with required fields
    riskAssessment: {
      riskScore: proposal.riskAssessment?.riskScore || 50,
      riskCategory: proposal.riskAssessment?.riskCategory || "Moderate",
      details: {
        ageImpact: proposal.riskAssessment?.details?.ageImpact || 25,
        horizonImpact: proposal.riskAssessment?.details?.horizonImpact || 25,
        styleImpact: proposal.riskAssessment?.details?.styleImpact || 25,
        toleranceImpact: proposal.riskAssessment?.details?.toleranceImpact || 25,
        explanation: proposal.riskAssessment?.details?.explanation || "Balanced risk profile based on age, investment horizon, and financial situation."
      }
    },
    
    // Ensure assetAllocation exists with required fields
    assetAllocation: {
      portfolioSize: proposal.assetAllocation?.portfolioSize || 500000,
      assetClassAllocation: {
        equity: proposal.assetAllocation?.assetClassAllocation?.equity || 50,
        debt: proposal.assetAllocation?.assetClassAllocation?.debt || 40,
        alternative: proposal.assetAllocation?.assetClassAllocation?.alternative || 10
      },
      productTypeAllocation: proposal.assetAllocation?.productTypeAllocation || {
        equity: { 'Large Cap': 25, 'Mid Cap': 15, 'Small Cap': 10 },
        debt: { 'Government Bonds': 20, 'Corporate Bonds': 20 },
        alternative: { 'Gold': 5, 'REITs': 5 }
      },
      rationale: proposal.assetAllocation?.rationale || "Balanced allocation for moderate risk profile."
    },
    
    // Ensure productRecommendations exists with required fields
    productRecommendations: {
      recommendationSummary: proposal.productRecommendations?.recommendationSummary || "Recommended products for a balanced portfolio.",
      recommendations: proposal.productRecommendations?.recommendations || {
        equity: {
          'Large Cap': {
            products: [{ name: 'Index Fund', description: 'Tracks major index', expectedReturn: '10-12%', risk: 'Moderate', lockIn: 'None', minInvestment: 5000 }],
            allocation: 25
          },
          'Mid Cap': {
            products: [{ name: 'Mid Cap Fund', description: 'Growth-oriented mid cap stocks', expectedReturn: '12-15%', risk: 'Moderate-High', lockIn: 'None', minInvestment: 5000 }],
            allocation: 15
          }
        },
        debt: {
          'Government Bonds': {
            products: [{ name: 'Govt Bond Fund', description: 'Safe government securities', expectedReturn: '6-8%', risk: 'Low', lockIn: 'None', minInvestment: 5000 }],
            allocation: 20
          }
        },
        alternative: {
          'Gold': {
            products: [{ name: 'Gold ETF', description: 'Tracks gold prices', expectedReturn: '8-10%', risk: 'Moderate', lockIn: 'None', minInvestment: 1000 }],
            allocation: 5
          }
        }
      }
    },
    
    implementationPlan: proposal.implementationPlan || "Implement in phases over 3 months with regular reviews.",
    disclaimer: proposal.disclaimer || "Past performance is not indicative of future results. Investments are subject to market risks. Please read all scheme-related documents carefully before investing. This is not an official document for regulatory submission."
  };
};

// Fallback functions for when the API is not available or returns an error
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
  const riskCategory = riskProfile.riskCategory;
  const portfolioSize = clientProfile.investment.initialAmount;
  const portfolioSizeInCrores = portfolioSize / 10000000; // Convert to crores
  
  // Asset allocation based on risk category and portfolio size
  let equity, debt;
  let rationale = '';
  
  // For small portfolios (1 cr or less)
  if (portfolioSizeInCrores <= 1) {
    
    if (riskCategory === 'Ultra Aggressive') {
      equity = 100;
      debt = 0;
      rationale = `Based on your Ultra Aggressive risk profile and smaller portfolio size (₹${(portfolioSize/100000).toFixed(2)} lakhs), we recommend focusing entirely on equity mutual funds for maximum growth potential.`;
    } else if (riskCategory === 'Aggressive') {
      equity = 75;
      debt = 25;
      rationale = `Based on your Aggressive risk profile and smaller portfolio size (₹${(portfolioSize/100000).toFixed(2)} lakhs), we recommend a growth-oriented allocation with 75% in equity mutual funds and 25% in debt instruments.`;
    } else if (riskCategory === 'Moderate') {
      equity = 60;
      debt = 40;
      rationale = `Based on your Moderate risk profile and smaller portfolio size (₹${(portfolioSize/100000).toFixed(2)} lakhs), we recommend a balanced allocation with 60% in equity mutual funds and 40% in debt instruments.`;
    } else { // Conservative
      equity = 40;
      debt = 60;
      rationale = `Based on your Conservative risk profile and smaller portfolio size (₹${(portfolioSize/100000).toFixed(2)} lakhs), we recommend a stability-focused allocation with 40% in equity mutual funds and 60% in debt instruments.`;
    }
  } 
  // For Conservative portfolios up to 2 cr
  else if (riskCategory === 'Conservative' && portfolioSizeInCrores <= 2) {
    equity = 40;
    debt = 60;
    rationale = `Based on your Conservative risk profile and portfolio size (₹${(portfolioSize/100000).toFixed(2)} lakhs), we recommend a stability-focused allocation with 40% in equity and 60% in debt instruments.`;
  }
  // For larger portfolios, use standard allocations
  else {
    if (riskCategory === 'Ultra Aggressive') {
      equity = 90;
      debt = 10;
      rationale = `Based on your Ultra Aggressive risk profile and portfolio size (₹${(portfolioSize/100000).toFixed(2)} lakhs), we recommend a growth-focused allocation with 90% in equity and 10% in debt.`;
    } else if (riskCategory === 'Aggressive') {
      equity = 80;
      debt = 20;
      rationale = `Based on your Aggressive risk profile and portfolio size (₹${(portfolioSize/100000).toFixed(2)} lakhs), we recommend a growth-oriented allocation with 80% in equity and 20% in debt.`;
    } else if (riskCategory === 'Moderate') {
      equity = 60;
      debt = 40;
      rationale = `Based on your Moderate risk profile and portfolio size (₹${(portfolioSize/100000).toFixed(2)} lakhs), we recommend a balanced allocation with 60% in equity and 40% in debt instruments.`;
    } else { // Conservative
      equity = 40;
      debt = 60;
      rationale = `Based on your Conservative risk profile and portfolio size (₹${(portfolioSize/100000).toFixed(2)} lakhs), we recommend a stability-focused allocation with 40% in equity and 60% in debt instruments.`;
    }
  }
  
  // Generate product type allocation based on asset class percentages
  const equityTypes = generateDefaultProductTypeAllocation('equity', equity);
  const debtTypes = generateDefaultProductTypeAllocation('debt', debt);
  
  return {
    portfolioSize,
    assetClassAllocation: {
      equity,
      debt
    },
    productTypeAllocation: {
      equity: equityTypes,
      debt: debtTypes
    },
    rationale
  };
};

const fallbackProductRecommendations = (
  clientProfile: ClientProfile, 
  riskProfile: RiskAssessment,
  assetAllocation: AssetAllocation
): ProductRecommendations => {
  // Get allocation percentages from asset allocation
  const equityAllocation = assetAllocation.assetClassAllocation.equity || 50;
  const debtAllocation = assetAllocation.assetClassAllocation.debt || 40;
  const alternativeAllocation = assetAllocation.assetClassAllocation.alternative || 10;
  
  // Get product type allocations
  const equityTypes = assetAllocation.productTypeAllocation?.equity || {
    'Large Cap': 25,
    'Mid Cap': 15,
    'Small Cap': 5,
    'International': 5
  };
  
  const debtTypes = assetAllocation.productTypeAllocation?.debt || {
    'Government Bonds': 20,
    'Corporate Bonds': 15,
    'Fixed Deposits': 5
  };
  
  const alternativeTypes = {
    'Gold': 5,
    'REITs': 5
  };
  
  // Generate generic product recommendations based on asset allocation
  return {
    recommendationSummary: `Based on your ${riskProfile.riskCategory.toLowerCase()} risk profile and asset allocation, we recommend a diversified portfolio with a focus on capital preservation and moderate growth.`,
    recommendations: {
      equity: {
        "Large Cap": {
          products: [
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
          allocation: equityTypes['Large Cap'] || 25
        },
        "Mid Cap": {
          products: [
            {
              name: "Emerging Opportunities Fund",
              description: "Focuses on mid-sized companies with high growth potential.",
              expectedReturn: "15-18% p.a.",
              risk: "Moderately High",
              lockIn: "None",
              minInvestment: 5000
            }
          ],
          allocation: equityTypes['Mid Cap'] || 15
        },
        "Small Cap": {
          products: [
            {
              name: "Small Cap Discovery Fund",
              description: "Invests in small companies with exceptional growth prospects.",
              expectedReturn: "18-22% p.a.",
              risk: "High",
              lockIn: "None",
              minInvestment: 5000
            }
          ],
          allocation: equityTypes['Small Cap'] || 5
        },
        "International": {
          products: [
            {
              name: "Global Opportunities Fund",
              description: "Invests in international markets for geographical diversification.",
              expectedReturn: "12-15% p.a.",
              risk: "Moderately High",
              lockIn: "None",
              minInvestment: 5000
            }
          ],
          allocation: equityTypes['International'] || 5
        }
      },
      debt: {
        "Government Bonds": {
          products: [
            {
              name: "Gilt Fund",
              description: "Invests primarily in government securities of various maturities.",
              expectedReturn: "6-8% p.a.",
              risk: "Low",
              lockIn: "None",
              minInvestment: 5000
            }
          ],
          allocation: debtTypes['Government Bonds'] || 20
        },
        "Corporate Bonds": {
          products: [
            {
              name: "Corporate Bond Fund",
              description: "Invests in bonds issued by high-rated corporations.",
              expectedReturn: "7-9% p.a.",
              risk: "Low to Moderate",
              lockIn: "None",
              minInvestment: 5000
            }
          ],
          allocation: debtTypes['Corporate Bonds'] || 15
        },
        "Fixed Deposits": {
          products: [
            {
              name: "Bank FD",
              description: "Traditional fixed deposit with guaranteed returns.",
              expectedReturn: "5-6% p.a.",
              risk: "Very Low",
              lockIn: "1-5 years",
              minInvestment: 10000
            }
          ],
          allocation: debtTypes['Fixed Deposits'] || 5
        }
      },
      alternative: {
        "Gold": {
          products: [
            {
              name: "Gold ETF",
              description: "Exchange-traded fund that tracks the price of gold.",
              expectedReturn: "8-10% p.a.",
              risk: "Moderate",
              lockIn: "None",
              minInvestment: 1000
            }
          ],
          allocation: alternativeTypes['Gold'] || 5
        },
        "REITs": {
          products: [
            {
              name: "Real Estate Investment Trust",
              description: "Invests in income-generating real estate properties.",
              expectedReturn: "8-12% p.a.",
              risk: "Moderate",
              lockIn: "None",
              minInvestment: 10000
            }
          ],
          allocation: alternativeTypes['REITs'] || 5
        }
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
  // Create safe references to potentially undefined data
  const clientProfile = data.clientProfile || {
    personal: { name: 'Client', age: 35, occupation: '', email: '', phone: '', maritalStatus: 'single', dependents: 0 },
    financial: { currentInvestments: 0, liabilities: 0, realEstate: 0, savings: 0, monthlyExpenses: 0, emergencyFund: 'None', existingProducts: [] },
    investment: { primaryGoals: [], horizon: 'medium', style: 'balanced', initialAmount: 100000, regularContribution: 0 },
    riskTolerance: { marketDropReaction: '', returnsVsStability: '', preferredStyle: '', maxAcceptableLoss: 10 }
  };
  
  const riskAssessment = data.riskAssessment || {
    riskScore: 50,
    riskCategory: 'Moderate',
    details: {
      ageImpact: 25,
      horizonImpact: 25,
      styleImpact: 25,
      toleranceImpact: 25,
      explanation: 'Fallback risk assessment with moderate risk profile.'
    }
  };
  
  const assetAllocation = data.assetAllocation || {
    portfolioSize: clientProfile.investment.initialAmount,
    assetClassAllocation: { equity: 50, debt: 40, alternative: 10 },
    productTypeAllocation: {
      equity: { 'Large Cap': 25, 'Mid Cap': 15, 'Small Cap': 10 },
      debt: { 'Government Bonds': 20, 'Corporate Bonds': 20 },
      alternative: { 'Gold': 5, 'REITs': 5 }
    },
    rationale: 'Balanced allocation for moderate risk profile.'
  };
  
  const productRecommendations = data.productRecommendations || {
    recommendationSummary: 'Fallback product recommendations for a balanced portfolio.',
    recommendations: {
      equity: {
        'Large Cap': {
          products: [{ name: 'Index Fund', description: 'Tracks major index', expectedReturn: '10-12%', risk: 'Moderate', lockIn: 'None', minInvestment: 5000 }],
          allocation: 25
        },
        'Mid Cap': {
          products: [{ name: 'Mid Cap Fund', description: 'Growth-oriented mid cap stocks', expectedReturn: '12-15%', risk: 'Moderate-High', lockIn: 'None', minInvestment: 5000 }],
          allocation: 15
        }
      },
      debt: {
        'Government Bonds': {
          products: [{ name: 'Govt Bond Fund', description: 'Safe government securities', expectedReturn: '6-8%', risk: 'Low', lockIn: 'None', minInvestment: 5000 }],
          allocation: 20
        }
      },
      alternative: {
        'Gold': {
          products: [{ name: 'Gold ETF', description: 'Tracks gold prices', expectedReturn: '8-10%', risk: 'Moderate', lockIn: 'None', minInvestment: 1000 }],
          allocation: 5
        }
      }
    }
  };
  
  return {
    title: "Personalized Investment Proposal",
    date: new Date().toLocaleDateString(),
    clientName: clientProfile.personal?.name || 'Client',
    advisorName: "InvestWise Advisor",
    companyIntro: "InvestWise is a leading financial advisory firm dedicated to helping clients achieve their financial goals through personalized investment strategies. Our team of experienced advisors works closely with clients to understand their unique needs and develop tailored solutions.",
    marketOutlook: "The current market environment presents both challenges and opportunities. While economic indicators suggest moderate growth, inflation concerns and geopolitical tensions create uncertainty. In this context, a diversified approach with a mix of defensive and growth-oriented assets is advisable.",
    clientProfile,
    riskAssessment,
    assetAllocation,
    productRecommendations,
    implementationPlan: "We recommend implementing this investment strategy in phases:\n\n1. Initial allocation of 60% of funds to core holdings within 1 week.\n2. Staggered investment of the remaining 40% over 3 months.\n3. Regular portfolio review and rebalancing every quarter.\n4. Annual comprehensive strategy reassessment.",
    disclaimer: "This investment proposal is based on the information provided and current market conditions. Past performance is not indicative of future results. Investments are subject to market risks. Please read all scheme-related documents carefully before investing. This is not an official document for regulatory submission."
  };
};
