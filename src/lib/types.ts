
export interface ClientProfile {
  personal: {
    name: string;
    age: number;
    occupation: string;
    email: string;
    phone: string;
    maritalStatus: string;
    dependents: number;
  };
  financial: {
    currentInvestments: number;
    liabilities: number;
    realEstate: number;
    savings: number;
    monthlyExpenses: number;
    emergencyFund: string;
    existingProducts: string[];
  };
  investment: {
    primaryGoals: string[];
    horizon: string;
    style: string;
    initialAmount: number;
    regularContribution: number;
  };
  riskTolerance: {
    marketDropReaction: string;
    returnsVsStability: string;
    preferredStyle: string;
    maxAcceptableLoss: number;
    investmentKnowledge?: string; // Added as optional property
  };
}

export interface RiskAssessment {
  riskScore: number;
  riskCategory: string;
  details: {
    ageImpact: number;
    horizonImpact: number;
    styleImpact: number;
    toleranceImpact: number;
    explanation: string;
  };
}

export interface AssetAllocation {
  portfolioSize: number;
  assetClassAllocation: Record<string, number>;
  productTypeAllocation: {
    equity: Record<string, number>;
    debt: Record<string, number>;
  };
  rationale: string;
}

export interface ProductRecommendation {
  name: string;
  description: string;
  expectedReturn: string;
  risk: string;
  lockIn?: string;
  lockInPeriod?: string;
  minInvestment?: number;
  minimumInvestment?: string;
  // Additional fields from API
  amcCode?: string;
  schemeCode?: string;
  nav?: string;
  rating?: number;
  category?: string;
  schemeType?: string;
  returns?: Record<string, string | number>;
}

export interface ProductCategory {
  products: ProductRecommendation[];
  allocation: number;
  amount?: number;
}

export interface ProductRecommendations {
  recommendationSummary: string;
  recommendations: {
    equity: Record<string, ProductCategory>;
    debt: Record<string, ProductCategory>;
    alternative?: Record<string, ProductCategory>;
    goldSilver?: Record<string, ProductCategory>;
  };
}

export interface InvestmentProposal {
  title: string;
  date: string;
  clientName: string;
  advisorName: string;
  companyIntro: string;
  marketOutlook: string;
  clientProfile: ClientProfile;
  riskAssessment: RiskAssessment;
  assetAllocation: AssetAllocation;
  productRecommendations: ProductRecommendations;
  implementationPlan: string;
  disclaimer: string;
}

export type StepType = 1 | 2 | 3 | 4 | 5 | 6;

export interface AppState {
  currentStep: StepType;
  clientProfile: ClientProfile | null;
  riskAssessment: RiskAssessment | null;
  assetAllocation: AssetAllocation | null;
  productRecommendations: ProductRecommendations | null;
  investmentProposal: InvestmentProposal | null;
}

export interface MarketOutlookEntry {
  id: string;
  description: string;
  marketOutlook: string | null;
  lastUpdated: string;
  createdBy: string;
  createdOn: string;
}

export interface MarketOutlookData {
  latestEntry: MarketOutlookEntry | null;
}

export interface StockCategory {
  id: string;
  code: string;
  name: string;
}

export type AppAction = 
  | { type: 'SET_STEP'; payload: StepType }
  | { type: 'SET_CLIENT_PROFILE'; payload: ClientProfile }
  | { type: 'SET_RISK_ASSESSMENT'; payload: RiskAssessment }
  | { type: 'SET_ASSET_ALLOCATION'; payload: AssetAllocation }
  | { type: 'SET_PRODUCT_RECOMMENDATIONS'; payload: ProductRecommendations }
  | { type: 'SET_INVESTMENT_PROPOSAL'; payload: InvestmentProposal }
  | { type: 'LOAD_TEST_DATA'; payload: AppState }
  | { type: 'RESET_STATE' };
