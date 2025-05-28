import { ClientProfile, RiskAssessment, AssetAllocation, ProductRecommendations, InvestmentProposal, MarketOutlookData, StockCategory } from './types';
import { generateProposalPDF } from './pdf-generator';
import { formatIndianCurrency } from './utils';

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
      initialInvestmentAmount: profileData.personal.initialAmount,
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
      initialInvestmentAmount: profileData.personal.initialAmount || 500000,
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
    mutualFunds: 40,  // Reduced to make room for listedStocks
    listedStocks: 30, // Added listedStocks allocation
    pms: 15,          // Reduced slightly
    aif: 10,          // Reduced slightly
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
        // Use bracket notation to access the 'alternative' property to avoid TypeScript errors
        goldSilver: data.assetAllocation.assetClassAllocation['alternative'] ? data.assetAllocation.assetClassAllocation['alternative'] / 2 : 5,
        cash: 5
      },
      productTypeAllocation: {
        equity: data.assetAllocation.productTypeAllocation.equity,
        debt: data.assetAllocation.productTypeAllocation.debt,
        // Use bracket notation to access the 'alternative' property to avoid TypeScript errors
        goldSilver: data.assetAllocation.productTypeAllocation['alternative'] || {}
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

// Fetch stock categories from the API
export const getStockCategories = async (): Promise<{ success: boolean; data: StockCategory[] }> => {
  try {
    console.log('Fetching stock categories data from API');
    
    const response = await fetch(`${API_BASE_URL}/api/stock-categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await handleApiResponse(response);
    
    if (data.success && Array.isArray(data.data)) {
      console.log('Stock categories data received:', data.data);
      return {
        success: true,
        data: data.data
      };
    } else {
      console.error('Invalid stock categories data format:', data);
      throw new Error('Invalid stock categories data format');
    }
  } catch (error) {
    console.error('Error fetching stock categories data:', error);
    // Return a default structure in case of error
    return {
      success: false,
      data: []
    };
  }
};

// Fetch market outlook data from the API
export const getMarketOutlook = async (): Promise<{ success: boolean; data: MarketOutlookData }> => {
  try {
    console.log('Fetching market outlook data from API');
    
    const response = await fetch(`${API_BASE_URL}/api/market-outlook`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await handleApiResponse(response);
    
    if (data.success && data.data) {
      console.log('Market outlook data received:', data.data);
      return {
        success: true,
        data: data.data
      };
    } else {
      console.error('Invalid market outlook data format:', data);
      throw new Error('Invalid market outlook data format');
    }
  } catch (error) {
    console.error('Error fetching market outlook data:', error);
    // Return a default structure in case of error
    return {
      success: false,
      data: {
        latestEntry: null
      }
    };
  }
};

export const downloadProposalPdf = async (proposal: InvestmentProposal): Promise<void> => {
  console.log('Received proposal data for PDF generation:', {
    title: proposal.title,
    clientName: proposal.clientName,
    portfolioSize: proposal.assetAllocation?.portfolioSize,
    assetClassAllocation: proposal.assetAllocation?.assetClassAllocation
  });

  try {
    // Create a direct mapping from the proposal data to the API format
    // This ensures we use exactly what's displayed on the page
    
    // Categorize products by their actual types
    const mutualFundsList = [];
    const pmsFunds = [];
    const aifFunds = [];
    const unlisted = [];
    const debtPapers = [];
    
    // Process all recommendations by category
    const allRecommendations = proposal.productRecommendations?.recommendations || {};
    
    // Helper function to extract return value
    const extractReturnValue = (returnStr) => {
      if (!returnStr) return 10.00; // Default
      const match = returnStr.match(/(\d+(\.\d+)?)/); 
      return match ? parseFloat(match[1]) : 10.00;
    };
    
    // Process equity products and categorize them
    if (allRecommendations.equity) {
      Object.entries(allRecommendations.equity).forEach(([type, details]) => {
        // @ts-ignore - type safety for details
        if (details && details.products && Array.isArray(details.products)) {
          // @ts-ignore - type safety for products
          details.products.forEach(product => {
            const returnValue = extractReturnValue(product.expectedReturn);
            
            // Determine the actual category based on product type and name
            let category = 'Balanced';
            if (type.toLowerCase().includes('large cap')) {
              category = 'LargeCap';
            } else if (type.toLowerCase().includes('mid cap')) {
              category = 'MidCap';
            } else if (type.toLowerCase().includes('small cap')) {
              category = 'SmallCap';
            } else if (type.toLowerCase().includes('global')) {
              category = 'Global Fund';
            } else if (type.toLowerCase().includes('hybrid')) {
              category = 'Hybrid';
            } else if (type.toLowerCase().includes('elss')) {
              category = 'ELSS';
            }
            
            // Check if this is a PMS, AIF, or unlisted equity
            const productName = product.name.toLowerCase();
            const productDesc = (product.description || '').toLowerCase();
            
            if (type.toLowerCase().includes('pms') || 
                productName.includes('pms') || 
                productDesc.includes('portfolio management') ||
                productName.includes('island') ||
                productName.includes('abakkus') ||
                productName.includes('phoenix pms')) {
              // This is a PMS product
              pmsFunds.push({
                fund_name: product.name,
                category: "PMS",
                investment_size: formatIndianCurrency(proposal.assetAllocation?.portfolioSize * 0.1) // Estimate
              });
            } 
            else if (type.toLowerCase().includes('aif') || 
                    productName.includes('aif') || 
                    productName.includes('alternative investment') ||
                    productName.includes('special situations') ||
                    productName.includes('long-short') ||
                    productName.includes('northern arc')) {
              // This is an AIF product
              aifFunds.push({
                fund_name: product.name,
                category: "AIF",
                investment_size: formatIndianCurrency(proposal.assetAllocation?.portfolioSize * 0.1) // Estimate
              });
            }
            else if (productName.includes('unlisted') || 
                    type.toLowerCase().includes('unlisted') ||
                    productDesc.includes('unlisted') ||
                    productName.includes('private') ||
                    !productName.includes('fund')) {
              // This is likely an unlisted equity
              unlisted.push({
                name: product.name,
                industry: "Financials", // Default
                investment_size: formatIndianCurrency(proposal.assetAllocation?.portfolioSize * 0.05) // Estimate
              });
            }
            else {
              // This is a regular mutual fund
              mutualFundsList.push({
                name: product.name,
                category: category,
                returns: {
                  one_year: returnValue,
                  three_years: returnValue,
                  five_years: returnValue
                }
              });
            }
          });
        }
      });
    }
    
    // Process debt products
    if (allRecommendations.debt) {
      Object.entries(allRecommendations.debt).forEach(([type, details]) => {
        // @ts-ignore
        if (details && details.products && Array.isArray(details.products)) {
          // @ts-ignore
          details.products.forEach(product => {
            debtPapers.push({
              fund_name: product.name,
              maturity: "28 Jan 2027(M)",
              payment_frequency: "Monthly",
              ytm: product.expectedReturn || "7-8%",
              quantum: "10 Lac",
              type: "Senior Secured",
              face_value: "1,00,000",
              rating: "A by ICRA"
            });
          });
        }
      });
    }
    
    // Process alternative products if they exist
    if (allRecommendations.alternative) {
      Object.entries(allRecommendations.alternative).forEach(([type, details]) => {
        // @ts-ignore
        if (details && details.products && Array.isArray(details.products)) {
          // @ts-ignore
          details.products.forEach(product => {
            // Categorize based on product type
            const productName = product.name.toLowerCase();
            
            if (productName.includes('pms') || type.toLowerCase().includes('pms')) {
              pmsFunds.push({
                fund_name: product.name,
                category: "PMS",
                investment_size: formatIndianCurrency(proposal.assetAllocation?.portfolioSize * 0.1)
              });
            } 
            else if (productName.includes('aif') || type.toLowerCase().includes('aif')) {
              aifFunds.push({
                fund_name: product.name,
                category: "AIF",
                investment_size: formatIndianCurrency(proposal.assetAllocation?.portfolioSize * 0.1)
              });
            }
            else {
              unlisted.push({
                name: product.name,
                industry: "Alternative",
                investment_size: formatIndianCurrency(proposal.assetAllocation?.portfolioSize * 0.05)
              });
            }
          });
        }
      });
    }
    
    // Process asset allocation items
    const assetAllocationItems = [];
    
    // Process equity allocation
    if (proposal.assetAllocation?.productTypeAllocation?.equity) {
      Object.entries(proposal.assetAllocation.productTypeAllocation.equity).forEach(([type, allocation]) => {
        const amount = proposal.assetAllocation.portfolioSize * (Number(allocation) / 100);
        
        assetAllocationItems.push({
          name: `${type} Funds`,
          details: [`${type} Fund - ${formatIndianCurrency(amount)}`],
          asset_class: "Equity",
          amount: formatIndianCurrency(amount)
        });
      });
    }
    
    // Process debt allocation
    if (proposal.assetAllocation?.productTypeAllocation?.debt) {
      Object.entries(proposal.assetAllocation.productTypeAllocation.debt).forEach(([type, allocation]) => {
        const amount = proposal.assetAllocation.portfolioSize * (Number(allocation) / 100);
        
        assetAllocationItems.push({
          name: type,
          details: [`${type} - ${formatIndianCurrency(amount)}`],
          asset_class: "Debt",
          amount: formatIndianCurrency(amount)
        });
      });
    }
    
    // Process alternative allocation if available
    if (proposal.assetAllocation?.productTypeAllocation['alternative']) {
      Object.entries(proposal.assetAllocation.productTypeAllocation['alternative']).forEach(([type, allocation]) => {
        const amount = proposal.assetAllocation.portfolioSize * (Number(allocation) / 100);
        
        assetAllocationItems.push({
          name: type,
          details: [`${type} - ${formatIndianCurrency(amount)}`],
          asset_class: "Alternative",
          amount: formatIndianCurrency(amount)
        });
      });
    }
    
    // Format the data according to the new API structure
    // Extract client name from the proposal - prioritize direct clientName property
    // This ensures we don't depend on the potentially missing clientProfile structure
    const clientName = proposal.clientName || "";
    
    console.log('Client name extracted from proposal (direct property):', clientName);
    
    // For debugging only - check if client profile exists and has a name
    if (proposal.clientProfile && 
    typeof proposal.clientProfile === 'object') {
      if (proposal.clientProfile.personal && 
      typeof proposal.clientProfile.personal === 'object') {
        console.log('Client profile personal name:', proposal.clientProfile.personal.name);
      } else {
        console.log('Client profile exists but personal data is missing or invalid');
      }
    } else {
      console.log('Client profile is missing or not an object');
    }
    
    // Use the direct clientName property which we've ensured is set correctly in the Proposal page
    console.log('Final client name to be used:', clientName);
    
    // Prepare the final data for the API in the expected format
    // Only include sections that have actual data
    const pdfData = {
      clientname: clientName,
      report_title: proposal.title || "Investment Proposal for " + clientName,
      logo_url: "",
      investment_products: {
        target: formatIndianCurrency(proposal.assetAllocation?.portfolioSize || 0),
        mutual_fund: mutualFundsList.length > 0 ? {
          points: [
            "Focus on creating a Mutual fund portfolio with objective of long term wealth creation.",
            "Selection of fund which are majorly equity oriented and capable of generating Alpha in comparison with the benchmark returns.",
            "Investment in funds with a time horizon of 5 - 7years.",
            "Selection of portfolio which are managed by Fund Managers with proven track record."
          ],
          top_funds: mutualFundsList
        } : null
      },
      asset_allocation: {
        description: "Asset Allocation is a mix of different asset class eg equity, Debt, Gold etc in an investment portfolio. The aim of asset allocation is to balance risk and return in accordance with different financial goals and risk appetite of the client.",
        benefits: [
          "Reduce Investment Risk",
          "Optimises Returns",
          "Liquidity Management",
          "Achievement of Financial Goal",
          "Aids in Tax Planning"
        ],
        distribution: {
          equity: proposal.assetAllocation?.assetClassAllocation?.equity || 50,
          debt: proposal.assetAllocation?.assetClassAllocation?.debt || 50
        },
        items: assetAllocationItems,
        total: formatIndianCurrency(proposal.assetAllocation?.portfolioSize || 0)
      }
    };
    
    // Only add fixed_income_offering if we have debt papers
    if (debtPapers.length > 0) {
      pdfData.fixed_income_offering = {
        target: formatIndianCurrency(proposal.assetAllocation?.portfolioSize * (proposal.assetAllocation?.assetClassAllocation?.debt || 40) / 100),
        description: "The investment strategy is to invest across high quality Fixed Income Instruments along with structured diversified portfolio with an aim to generate periodic cash flows and capital growth.",
        bullets: [
          "Focus on high credit quality instruments with majority allocation to issuers with high degree of corporate governance",
          "Investment strategy is to achieve diversification, targeting periodic cash flows, balancing risk and higher portfolio performance",
          "High quality income portfolio with dynamic investment duration to take care of market volatility"
        ],
        debt_papers: debtPapers
      };
    }
    
    // Only add PMS if we have PMS funds
    if (pmsFunds.length > 0) {
      pdfData.pms = {
        target: formatIndianCurrency(proposal.assetAllocation?.portfolioSize * 0.2), // Estimate
        description: "The funds endeavor to generate alpha and risk adjusted returns for the investor by investing in benchmark agnostic multi-cap portfolio with bias towards companies which classify in the mid and small market capitalization.",
        bullets: [
          "The Selected Funds invest in companies where valuations are attractive and strong underlying fundamentals form high intrinsic value.",
          "The companies selected have a strong economic moat that helps them build a competitive advantage to not just withstand economic headwinds but also to compound their earnings over the long term."
        ],
        funds: pmsFunds
      };
    }
    
    // Only add AIFs if we have AIF funds
    if (aifFunds.length > 0) {
      pdfData.aif = {
        target: formatIndianCurrency(proposal.assetAllocation?.portfolioSize * 0.15), // Estimate
        description: "Alternative Investment Funds provide exposure to non-traditional investment strategies and asset classes.",
        bullets: [
          "AIFs offer diversification benefits and potentially higher returns compared to traditional investments.",
          "These funds are managed by specialized teams with expertise in specific alternative strategies."
        ],
        funds: aifFunds
      };
    }
    
    // Only add private equity if we have unlisted shares
    if (unlisted.length > 0) {
      pdfData.private_equity = {
        target: formatIndianCurrency(proposal.assetAllocation?.portfolioSize * 0.15), // Estimate
        description: "The investment strategy is to invest in high-potential unlisted companies with strong growth prospects.",
        bullets: [
          "The popularity of unlisted shares has grown as a result of the competition between new-age companies to reach the necessary threshold for being listed on the stock market.",
          "In contrast to investing later, investing in a start-up at an early stage will benefit the investor more because it will result in greater profits and ownership holdings."
        ],
        scrips: unlisted
      };
    }
    
    // Remove any null sections
    Object.keys(pdfData).forEach(key => {
      if (pdfData[key] === null) {
        delete pdfData[key];
      }
    });
    
    // If investment_products.mutual_fund is null, remove it
    if (pdfData.investment_products && pdfData.investment_products.mutual_fund === null) {
      delete pdfData.investment_products.mutual_fund;
    }

    // Add the new template and blur_funds parameters
    // Use the template from the proposal or default to 'invest4edu'
    pdfData.template = proposal.template || 'invest4edu';
    
    // Use the blur_funds parameter from the proposal or default to true (initial proposal)
    pdfData.blur_funds = proposal.blur_funds !== undefined ? proposal.blur_funds : true;
    
    // Log the final data being sent to the API with full details
    console.log('FULL PDF DATA BEING SENT TO API:', JSON.stringify(pdfData, null, 2));
    
    // Log a summary for quick reference
    console.log('Summary of data being sent:', {
      clientname: pdfData.clientname,
      report_title: pdfData.report_title,
      template: pdfData.template,
      blur_funds: pdfData.blur_funds,
      total_investment: pdfData.investment_products.target,
      asset_allocation: pdfData.asset_allocation.distribution,
      mutual_funds_count: pdfData.investment_products.mutual_fund?.top_funds.length,
      debt_papers_count: pdfData.fixed_income_offering?.debt_papers.length
    });
    
    // Calculate the total percentage for asset allocation to validate data
    const totalPercentage = (
      Number(pdfData.asset_allocation.distribution.equity || 0) +
      Number(pdfData.asset_allocation.distribution.debt || 0)
    );
    
    console.log('Total asset allocation percentage:', totalPercentage, '%');
    console.log('Template:', pdfData.template);
    console.log('Blur funds:', pdfData.blur_funds);
    
    // Log the exact JSON string being sent to the API
    const jsonData = JSON.stringify(pdfData);
    console.log('Exact JSON string being sent:', jsonData);
    
    // Send the data to the API
    const response = await fetch('http://127.0.0.1:8000/generate-pdf-json/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: jsonData
    });
    
    // Log the response status
    console.log('API Response status:', response.status, response.statusText);

    // If the API call was successful, download the PDF
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proposal.title || 'Investment Proposal'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } else {
      console.error('Failed to generate PDF:', await response.text());
      throw new Error('Failed to generate PDF');
    }
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
    clientName: proposal.clientProfile?.personal?.name || proposal.clientName || "Client",
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
        initialAmount: proposal.clientProfile?.personal?.initialAmount || 500000,
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
        ...(proposal.assetAllocation?.assetClassAllocation || {}),
        equity: proposal.assetAllocation?.assetClassAllocation?.['equity'] || 50,
        debt: proposal.assetAllocation?.assetClassAllocation?.['debt'] || 40,
      },
      productTypeAllocation: {
        equity: proposal.assetAllocation?.productTypeAllocation?.equity || { 'Large Cap': 25, 'Mid Cap': 15, 'Small Cap': 10 },
        debt: proposal.assetAllocation?.productTypeAllocation?.debt || { 'Government Bonds': 20, 'Corporate Bonds': 20 }
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
  const portfolioSize = clientProfile.personal.initialAmount;
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
    personal: { name: 'Client', initialAmount: 100000, age: 35, occupation: '', email: '', phone: '', maritalStatus: 'single', dependents: 0 },
    financial: { currentInvestments: 0, liabilities: 0, realEstate: 0, savings: 0, monthlyExpenses: 0, emergencyFund: 'None', existingProducts: [] },
    investment: { primaryGoals: [], horizon: 'medium', style: 'balanced', regularContribution: 0 },
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
    portfolioSize: clientProfile.personal.initialAmount,
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
