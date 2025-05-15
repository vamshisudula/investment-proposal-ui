
import { AppState, ClientProfile, RiskAssessment, AssetAllocation, ProductRecommendations, InvestmentProposal } from './types';

// Conservative profile - lower risk tolerance, 8-14 points on risk scoring table
export const conservativeClientProfile: ClientProfile = {
  personal: {
    name: "Robert Johnson",
    age: 58,
    occupation: "Retired Teacher",
    email: "robert.johnson@example.com",
    phone: "+91-9876543210",
    maritalStatus: "married",
    dependents: 0
  },
  financial: {
    currentInvestments: 2500000,
    liabilities: 1000000,
    realEstate: 8000000,
    savings: 1500000,
    monthlyExpenses: 60000,
    emergencyFund: "6-12 months",
    existingProducts: ["Fixed Deposits", "Government Bonds"]
  },
  investment: {
    primaryGoals: ["Retirement Income", "Wealth Preservation"],
    // Option 3 (1 point): <3 Years
    horizon: "short",
    // Option 3 (1 point): Conservative
    style: "conservative",
    initialAmount: 40000000,
    regularContribution: 10000
  },
  riskTolerance: {
    // Option 3 (1 point): Sell
    marketDropReaction: "sell",
    // Option 3 (1 point): Stability
    returnsVsStability: "stability",
    // Option 3 (1 point): Conservative
    preferredStyle: "conservative",
    // Option 3 (1 point): 5%
    maxAcceptableLoss: 5
  }
};

// Moderate profile - balanced risk tolerance, 15-21 points on risk scoring table
export const moderateClientProfile: ClientProfile = {
  personal: {
    name: "Jane Smith",
    age: 42,
    occupation: "Software Engineer",
    email: "jane.smith@example.com",
    phone: "+91-9876543210",
    maritalStatus: "married",
    dependents: 1
  },
  financial: {
    currentInvestments: 1200000,
    liabilities: 2500000,
    realEstate: 5000000,
    savings: 800000,
    monthlyExpenses: 80000,
    emergencyFund: "3-6 months",
    existingProducts: ["Mutual Funds", "Fixed Deposits"]
  },
  investment: {
    primaryGoals: ["Retirement", "Child Education"],
    // Option 2 (2 points): 3-7 Years
    horizon: "medium",
    // Option 2 (2 points): Balanced
    style: "balanced",
    initialAmount: 500000,
    regularContribution: 25000
  },
  riskTolerance: {
    // Option 2 (2 points): Monitor Closely
    marketDropReaction: "hold",
    // Option 2 (2 points): Balanced
    returnsVsStability: "balanced",
    // Option 2 (2 points): Balanced
    preferredStyle: "moderate",
    // Option 2 (2 points): 10%
    maxAcceptableLoss: 10
  }
};

// Aggressive profile - higher risk tolerance, 18-22 points on risk scoring table
export const aggressiveClientProfile: ClientProfile = {
  personal: {
    name: "Alex Chen",
    age: 28,
    occupation: "Startup Founder",
    email: "alex.chen@example.com",
    phone: "+91-9876543210",
    maritalStatus: "single",
    dependents: 0
  },
  financial: {
    currentInvestments: 800000,
    liabilities: 1500000,
    realEstate: 0,
    savings: 500000,
    monthlyExpenses: 70000,
    emergencyFund: "1-3 months",
    existingProducts: ["Equity Mutual Funds", "Stocks"]
  },
  investment: {
    primaryGoals: ["Wealth Creation", "Early Retirement"],
    // Option 1 (3 points): 7+ Years
    horizon: "long",
    // Option 1 (3 points): Aggressive
    style: "aggressive",
    initialAmount: 40000000,
    regularContribution: 40000
  },
  riskTolerance: {
    // Option 2 (2 points): Hold position
    marketDropReaction: "hold",
    // Option 2 (2 points): Balanced approach
    returnsVsStability: "balanced",
    // Option 1 (3 points): Aggressive
    preferredStyle: "aggressive",
    // Option 2 (2 points): 15-20%
    maxAcceptableLoss: 15
  }
};

// Ultra-Aggressive profile - very high risk tolerance, 23+ points on risk scoring table
export const ultraAggressiveClientProfile: ClientProfile = {
  personal: {
    name: "Rishi Kapoor",
    age: 25,
    occupation: "Tech Entrepreneur",
    email: "rishi.kapoor@example.com",
    phone: "+91-9876543210",
    maritalStatus: "single",
    dependents: 0
  },
  financial: {
    currentInvestments: 1200000,
    liabilities: 800000,
    realEstate: 0,
    savings: 700000,
    monthlyExpenses: 60000,
    emergencyFund: "1-3 months",
    existingProducts: ["Stocks", "Cryptocurrency", "Options Trading"]
  },
  investment: {
    primaryGoals: ["Aggressive Growth", "Wealth Creation"],
    // Option 1 (3 points): 10+ Years
    horizon: "long",
    // Option 1 (3 points): Very Aggressive
    style: "very_aggressive",
    initialAmount: 50000000,
    regularContribution: 50000
  },
  riskTolerance: {
    // Option 1 (3 points): Buy More
    marketDropReaction: "buy_more",
    // Option 1 (3 points): Maximum Returns
    returnsVsStability: "returns",
    // Option 1 (3 points): Very Aggressive
    preferredStyle: "aggressive",
    // Option 1 (3 points): 30%+
    maxAcceptableLoss: 30,
    // Advanced knowledge
    investmentKnowledge: "advanced"
  }
};

// Default test client profile (using moderate as default)
export const testClientProfile: ClientProfile = moderateClientProfile;

// Conservative risk assessment (8-14 points on risk scoring table)
export const conservativeRiskAssessment: RiskAssessment = {
  riskScore: 12,
  riskCategory: "Conservative",
  details: {
    ageImpact: 3,
    horizonImpact: 4,
    styleImpact: 3,
    toleranceImpact: 2,
    explanation: "Your risk assessment score of 12 places you in the Conservative risk category (8-14 points). You prefer stability over returns and have a lower tolerance for market volatility. Your investment choices focus on capital preservation with a shorter investment horizon of less than 3 years."
  }
};

// Moderate risk assessment (15-21 points on risk scoring table)
export const moderateRiskAssessment: RiskAssessment = {
  riskScore: 18,
  riskCategory: "Moderate",
  details: {
    ageImpact: 5,
    horizonImpact: 5,
    styleImpact: 4,
    toleranceImpact: 4,
    explanation: "Your risk assessment score of 18 places you in the Moderate risk category (15-21 points). You seek a balance between growth and stability with a medium-term investment horizon of 3-7 years. You're comfortable with some market fluctuations while maintaining a balanced approach to risk and return."
  }
};

// Aggressive risk assessment (18-22 points on risk scoring table)
export const aggressiveRiskAssessment: RiskAssessment = {
  riskScore: 20,
  riskCategory: "Aggressive",
  details: {
    ageImpact: 7,
    horizonImpact: 5,
    styleImpact: 5,
    toleranceImpact: 3,
    explanation: "Your age and long investment horizon allow for a higher risk tolerance. Your preference for aggressive growth and comfort with market volatility indicate an aggressive risk profile."
  }
};

// Ultra-Aggressive risk assessment (23+ points on risk scoring table)
export const ultraAggressiveRiskAssessment: RiskAssessment = {
  riskScore: 26,
  riskCategory: "Ultra-Aggressive",
  details: {
    ageImpact: 8,
    horizonImpact: 6,
    styleImpact: 6,
    toleranceImpact: 6,
    explanation: "Your young age, very long investment horizon, and advanced investment knowledge make you an ideal candidate for a very high-risk strategy. Your willingness to accept significant market volatility and preference for maximum returns indicate an ultra-aggressive risk profile."
  }
};

// Default test risk assessment (using moderate as default)
export const testRiskAssessment: RiskAssessment = moderateRiskAssessment;

export const testAssetAllocation: AssetAllocation = {
  portfolioSize: 800000,
  assetClassAllocation: {
    equity: 60,
    debt: 30,
    alternative: 10
  },
  productTypeAllocation: {
    equity: {
      "Large Cap": 25,
      "Mid Cap": 15,
      "Small Cap": 10,
      "International": 10
    },
    debt: {
      "Government Bonds": 10,
      "Corporate Bonds": 15,
      "Fixed Deposits": 5
    },
    alternative: {
      "Gold": 5,
      "REITs": 5
    }
  },
  rationale: "Based on your moderate risk profile and long-term investment horizon, we've designed a balanced portfolio with significant equity exposure for growth, complemented by debt instruments for stability, and a small allocation to alternative investments for diversification."
};

export const testProductRecommendations: ProductRecommendations = {
  recommendationSummary: "Your recommended portfolio includes a mix of mutual funds, ETFs, and fixed income instruments selected to match your risk profile and investment goals.",
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

export const testInvestmentProposal: InvestmentProposal = {
  title: "Personalized Investment Proposal",
  date: "April 29, 2025",
  clientName: "Jane Smith",
  advisorName: "Advisor Name",
  companyIntro: "InvestWise is a leading financial advisory firm with over 20 years of experience in providing personalized investment solutions to clients across various risk profiles and financial goals.",
  marketOutlook: "The current market outlook indicates moderate economic growth with inflationary pressures expected to ease in the coming months. Equity markets are projected to deliver positive returns, while fixed income yields are likely to stabilize.",
  clientProfile: moderateClientProfile,
  riskAssessment: testRiskAssessment,
  assetAllocation: testAssetAllocation,
  productRecommendations: testProductRecommendations,
  implementationPlan: "We recommend a phased approach to implementing your investment plan. Start with an initial lump sum investment of 60% of your allocated amount, followed by systematic investments over the next 3 months to take advantage of rupee cost averaging.",
  disclaimer: "This investment proposal is based on the information provided and current market conditions. Investment markets are subject to risks, and past performance is not indicative of future results. Please consult with your financial advisor before making investment decisions."
};

// Ultra-Aggressive asset allocation example
export const ultraAggressiveAssetAllocation: AssetAllocation = {
  portfolioSize: 5000000,
  assetClassAllocation: {
    equity: 90,
    debt: 5,
    alternative: 5
  },
  productTypeAllocation: {
    equity: {
      "Large Cap": 15,
      "Mid Cap": 20,
      "Small Cap": 25,
      "International": 15,
      "Sector Funds": 15
    },
    debt: {
      "Government Bonds": 2,
      "Corporate Bonds": 3
    }
  },
  rationale: "Your Ultra-Aggressive risk profile suggests a portfolio heavily weighted toward equity investments with significant allocation to high-growth segments like small-cap and sector-specific funds. The minimal debt allocation provides a small safety cushion while maximizing growth potential."
};

export const testAppState: AppState = {
  currentStep: 1,
  clientProfile: moderateClientProfile,
  riskAssessment: testRiskAssessment,
  assetAllocation: testAssetAllocation,
  productRecommendations: testProductRecommendations,
  investmentProposal: testInvestmentProposal
};

// Ultra-Aggressive test app state
export const ultraAggressiveAppState: AppState = {
  currentStep: 1,
  clientProfile: ultraAggressiveClientProfile,
  riskAssessment: ultraAggressiveRiskAssessment,
  assetAllocation: ultraAggressiveAssetAllocation,
  productRecommendations: testProductRecommendations, // Using the same product recommendations for simplicity
  investmentProposal: testInvestmentProposal // Using the same investment proposal for simplicity
};
