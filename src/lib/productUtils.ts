import { ProductRecommendation } from './types';

// Manual definition of product data to avoid JSON import issues
// This is a temporary solution until we resolve the JSON import issue
const productsData = {
  "equity": {
    "Large Cap": [
      {
        "name": "HDFC Top 100 Fund",
        "description": "Invests in top 100 companies by market capitalization",
        "expectedReturn": "12-15%",
        "risk": "Moderate",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Large Cap"
      },
      {
        "name": "Axis Bluechip Fund",
        "description": "Focuses on blue-chip companies with stable growth",
        "expectedReturn": "11-14%",
        "risk": "Moderate",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Large Cap"
      }
    ],
    "Mid Cap": [
      {
        "name": "Kotak Emerging Equity Fund",
        "description": "Focuses on emerging mid-sized companies with growth potential",
        "expectedReturn": "14-18%",
        "risk": "Moderately High",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Mid Cap"
      },
      {
        "name": "HDFC Mid-Cap Opportunities Fund",
        "description": "Invests in mid-cap companies with long-term growth prospects",
        "expectedReturn": "15-18%",
        "risk": "Moderately High",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Mid Cap"
      }
    ],
    "Small Cap": [
      {
        "name": "Axis Small Cap Fund",
        "description": "Invests in small-cap companies with high growth potential",
        "expectedReturn": "16-20%",
        "risk": "High",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Small Cap"
      },
      {
        "name": "SBI Small Cap Fund",
        "description": "Focuses on undiscovered small-cap companies with strong fundamentals",
        "expectedReturn": "17-22%",
        "risk": "High",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Small Cap"
      }
    ]
  },
  "debt": {
    "Government Bonds": [
      {
        "name": "SBI Magnum Gilt Fund",
        "description": "Invests in government securities across different maturities",
        "expectedReturn": "6-8%",
        "risk": "Low",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Government Bonds"
      },
      {
        "name": "HDFC Gilt Fund",
        "description": "Invests in government securities and treasury bills",
        "expectedReturn": "6-8%",
        "risk": "Low",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Government Bonds"
      }
    ],
    "Corporate Bonds": [
      {
        "name": "Kotak Corporate Bond Fund",
        "description": "Invests in high-quality corporate bonds",
        "expectedReturn": "7-9%",
        "risk": "Low to Moderate",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Corporate Bonds"
      },
      {
        "name": "Aditya Birla Sun Life Corporate Bond Fund",
        "description": "Focuses on AAA and AA+ rated corporate bonds",
        "expectedReturn": "7-9%",
        "risk": "Low to Moderate",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Corporate Bonds"
      }
    ]
  },
  "alternative": {
    "Gold": [
      {
        "name": "SBI Gold Fund",
        "description": "Fund of fund investing in gold ETFs",
        "expectedReturn": "8-10%",
        "risk": "Moderate",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Gold"
      },
      {
        "name": "Nippon India Gold Savings Fund",
        "description": "Invests in gold through gold ETFs",
        "expectedReturn": "8-10%",
        "risk": "Moderate",
        "lockIn": "None",
        "minInvestment": 5000,
        "category": "Gold"
      }
    ],
    "REITs": [
      {
        "name": "Embassy Office Parks REIT",
        "description": "India's first publicly listed REIT with premium commercial properties",
        "expectedReturn": "8-10%",
        "risk": "Moderate",
        "lockIn": "None",
        "minInvestment": 10000,
        "category": "REITs"
      },
      {
        "name": "Mindspace Business Parks REIT",
        "description": "Portfolio of commercial properties in major Indian cities",
        "expectedReturn": "8-10%",
        "risk": "Moderate",
        "lockIn": "None",
        "minInvestment": 10000,
        "category": "REITs"
      }
    ]
  }
};

// Type definition for the products data structure
export interface ProductsData {
  equity: Record<string, ProductRecommendation[]>;
  debt: Record<string, ProductRecommendation[]>;
  alternative: Record<string, ProductRecommendation[]>;
}

// Type assertion to ensure proper typing
const typedProductsData = productsData as ProductsData;

// Function to get all available product categories
export const getProductCategories = (): string[] => {
  const categories: string[] = [];
  
  // Add equity categories
  Object.keys(typedProductsData.equity).forEach(category => {
    categories.push(category);
  });
  
  // Add debt categories
  Object.keys(typedProductsData.debt).forEach(category => {
    categories.push(category);
  });
  
  // Add alternative categories
  Object.keys(typedProductsData.alternative).forEach(category => {
    categories.push(category);
  });
  
  return categories;
};

// Function to get products by category
export const getProductsByCategory = (category: string): ProductRecommendation[] => {
  // Check in equity
  if (typedProductsData.equity[category]) {
    return typedProductsData.equity[category];
  }
  
  // Check in debt
  if (typedProductsData.debt[category]) {
    return typedProductsData.debt[category];
  }
  
  // Check in alternative
  if (typedProductsData.alternative[category]) {
    return typedProductsData.alternative[category];
  }
  
  return [];
};

// Function to get asset class for a category
export const getAssetClassForCategory = (category: string): 'equity' | 'debt' | 'alternative' => {
  if (typedProductsData.equity[category]) {
    return 'equity';
  }
  
  if (typedProductsData.debt[category]) {
    return 'debt';
  }
  
  return 'alternative';
};

// Function to get all products
export const getAllProducts = (): ProductRecommendation[] => {
  const allProducts: ProductRecommendation[] = [];
  
  // Add equity products
  Object.values(typedProductsData.equity).forEach((categoryProducts: ProductRecommendation[]) => {
    allProducts.push(...categoryProducts);
  });
  
  // Add debt products
  Object.values(typedProductsData.debt).forEach((categoryProducts: ProductRecommendation[]) => {
    allProducts.push(...categoryProducts);
  });
  
  // Add alternative products
  Object.values(typedProductsData.alternative).forEach((categoryProducts: ProductRecommendation[]) => {
    allProducts.push(...categoryProducts);
  });
  
  return allProducts;
};
