
import { AppState, ClientProfile, RiskAssessment, AssetAllocation, ProductRecommendations, InvestmentProposal } from './types';

export const testClientProfile: ClientProfile = {
  personal: {
    name: "Jane Smith",
    age: 35,
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
    horizon: "long",
    style: "balanced",
    initialAmount: 500000,
    regularContribution: 25000
  },
  riskTolerance: {
    marketDropReaction: "hold",
    returnsVsStability: "balanced",
    preferredStyle: "moderate",
    maxAcceptableLoss: 15
  }
};

export const testRiskAssessment: RiskAssessment = {
  riskScore: 65,
  riskCategory: "Moderate",
  details: {
    ageImpact: 20,
    horizonImpact: 25,
    styleImpact: 15,
    toleranceImpact: 5,
    explanation: "Your risk assessment indicates a moderate risk tolerance. Your long investment horizon and age allow for some market volatility, while your preferred investment style leans towards balanced growth and stability."
  }
};

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
  clientProfile: testClientProfile,
  riskAssessment: testRiskAssessment,
  assetAllocation: testAssetAllocation,
  productRecommendations: testProductRecommendations,
  implementationPlan: "We recommend a phased approach to implementing your investment plan. Start with an initial lump sum investment of 60% of your allocated amount, followed by systematic investments over the next 3 months to take advantage of rupee cost averaging.",
  disclaimer: "This investment proposal is based on the information provided and current market conditions. Investment markets are subject to risks, and past performance is not indicative of future results. Please consult with your financial advisor before making investment decisions."
};

export const testAppState: AppState = {
  currentStep: 1,
  clientProfile: testClientProfile,
  riskAssessment: testRiskAssessment,
  assetAllocation: testAssetAllocation,
  productRecommendations: testProductRecommendations,
  investmentProposal: testInvestmentProposal
};
