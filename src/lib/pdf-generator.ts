
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvestmentProposal, ClientProfile, RiskAssessment, AssetAllocation, ProductRecommendation } from './types';
import { formatIndianCurrency } from './utils';

export const generateProposalPDF = (proposal: InvestmentProposal): Promise<Blob> => {
  return new Promise((resolve) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text(proposal.title, 105, 20, { align: 'center' });
    
    // Add date and client information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${proposal.date}`, 20, 30);
    doc.text(`Client: ${proposal.clientName}`, 20, 36);
    doc.text(`Advisor: ${proposal.advisorName}`, 20, 42);
    
    // Company Introduction
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Company Introduction', 20, 55);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const companyIntroLines = doc.splitTextToSize(proposal.companyIntro, 170);
    doc.text(companyIntroLines, 20, 63);
    
    // Market Outlook
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Market Outlook', 20, 85);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const marketOutlookLines = doc.splitTextToSize(proposal.marketOutlook, 170);
    doc.text(marketOutlookLines, 20, 93);
    
    // Client Profile
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Client Profile', 20, 115);
    addClientProfileTable(doc, proposal.clientProfile, 123);
    
    // Risk Assessment
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Risk Assessment', 20, 20);
    addRiskAssessmentTable(doc, proposal.riskAssessment, 28);
    
    // Asset Allocation
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Asset Allocation', 20, 70);
    addAssetAllocationTable(doc, proposal.assetAllocation, 78);
    
    // Product Recommendations
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Product Recommendations', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const recommendationSummaryLines = doc.splitTextToSize(proposal.productRecommendations.recommendationSummary, 170);
    doc.text(recommendationSummaryLines, 20, 28);
    
    let yPos = 40;
    Object.entries(proposal.productRecommendations.recommendations).forEach(([assetClass, productTypes]) => {
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text(assetClass.charAt(0).toUpperCase() + assetClass.slice(1), 20, yPos);
      
      yPos += 8;
      Object.entries(productTypes).forEach(([typeName, products]) => {
        doc.setFontSize(12);
        doc.text(typeName, 25, yPos);
        
        yPos += 6;
        if (products.length > 0) {
          addProductRecommendationsTable(doc, products, yPos);
          yPos += 10 + products.length * 10;
        }
      });
      
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Implementation Plan
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Implementation Plan', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const implementationPlanLines = doc.splitTextToSize(proposal.implementationPlan, 170);
    doc.text(implementationPlanLines, 20, 28);
    
    // Disclaimer
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Disclaimer', 20, 60);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const disclaimerLines = doc.splitTextToSize(proposal.disclaimer, 170);
    doc.text(disclaimerLines, 20, 68);
    
    // Generate the PDF as a blob
    const pdfBlob = doc.output('blob');
    resolve(pdfBlob);
  });
};

const addClientProfileTable = (doc: jsPDF, clientProfile: ClientProfile, yStart: number) => {
  // Personal Information
  autoTable(doc, {
    startY: yStart,
    head: [['Personal Information', '']],
    body: [
      ['Name', clientProfile.personal.name],
      ['Age', clientProfile.personal.age.toString()],
      ['Occupation', clientProfile.personal.occupation],
      ['Email', clientProfile.personal.email],
      ['Phone', clientProfile.personal.phone],
      ['Marital Status', clientProfile.personal.maritalStatus],
      ['Dependents', clientProfile.personal.dependents.toString()]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
  });
  
  // Financial Information
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Financial Information', '']],
    body: [
      ['Current Investments', formatIndianCurrency(clientProfile.financial.currentInvestments)],
      ['Liabilities', formatIndianCurrency(clientProfile.financial.liabilities)],
      ['Real Estate', formatIndianCurrency(clientProfile.financial.realEstate)],
      ['Savings', formatIndianCurrency(clientProfile.financial.savings)],
      ['Monthly Expenses', formatIndianCurrency(clientProfile.financial.monthlyExpenses)],
      ['Emergency Fund', clientProfile.financial.emergencyFund],
      ['Existing Products', clientProfile.financial.existingProducts.join(', ')]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
  });
  
  // Investment Information
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Investment Objectives', '']],
    body: [
      ['Primary Goals', clientProfile.investment.primaryGoals.join(', ')],
      ['Investment Horizon', clientProfile.investment.horizon],
      ['Investment Style', clientProfile.investment.style],
      ['Initial Investment', formatIndianCurrency(clientProfile.investment.initialAmount)],
      ['Regular Contribution', formatIndianCurrency(clientProfile.investment.regularContribution)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
  });
};

const addRiskAssessmentTable = (doc: jsPDF, riskAssessment: RiskAssessment, yStart: number) => {
  autoTable(doc, {
    startY: yStart,
    head: [['Risk Assessment Summary', '']],
    body: [
      ['Risk Score', riskAssessment.riskScore.toString()],
      ['Risk Category', riskAssessment.riskCategory],
      ['Age Impact', `${riskAssessment.details.ageImpact}%`],
      ['Horizon Impact', `${riskAssessment.details.horizonImpact}%`],
      ['Style Impact', `${riskAssessment.details.styleImpact}%`],
      ['Tolerance Impact', `${riskAssessment.details.toleranceImpact}%`],
      ['Explanation', riskAssessment.details.explanation]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
  });
};

const addAssetAllocationTable = (doc: jsPDF, assetAllocation: AssetAllocation, yStart: number) => {
  // Overall Asset Allocation
  const assetClassRows = Object.entries(assetAllocation.assetClassAllocation).map(([assetClass, percentage]) => {
    const amount = (assetAllocation.portfolioSize * percentage) / 100;
    return [
      assetClass.charAt(0).toUpperCase() + assetClass.slice(1),
      `${percentage}%`,
      formatIndianCurrency(amount)
    ];
  });
  
  autoTable(doc, {
    startY: yStart,
    head: [['Asset Class', 'Percentage', 'Amount']],
    body: assetClassRows,
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
  });
  
  // Product Type Allocations
  let yPos = doc.lastAutoTable.finalY + 10;
  
  Object.entries(assetAllocation.productTypeAllocation).forEach(([assetClass, productTypes]) => {
    if (Object.keys(productTypes).length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 51, 102);
      doc.text(`${assetClass.charAt(0).toUpperCase() + assetClass.slice(1)} Breakdown`, 20, yPos);
      
      const productTypeRows = Object.entries(productTypes).map(([productType, percentage]) => {
        const totalAssetClassPercentage = assetAllocation.assetClassAllocation[assetClass] || 0;
        const percentageOfTotal = totalAssetClassPercentage * (percentage / 100);
        const amount = (assetAllocation.portfolioSize * percentageOfTotal) / 100;
        return [productType, `${percentage}%`, formatIndianCurrency(amount)];
      });
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [['Product Type', 'Percentage', 'Amount']],
        body: productTypeRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 102, 204] },
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
    }
  });
};

const addProductRecommendationsTable = (doc: jsPDF, products: ProductRecommendation[], yStart: number) => {
  const rows = products.map(product => [
    product.name,
    product.expectedReturn,
    product.risk,
    product.lockIn,
    formatIndianCurrency(product.minInvestment)
  ]);
  
  autoTable(doc, {
    startY: yStart,
    head: [['Product', 'Expected Return', 'Risk', 'Lock-In', 'Min Investment']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [0, 102, 204] },
  });
};

export const downloadPDF = (pdfBlob: Blob, filename: string = 'investment-proposal.pdf'): void => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(pdfBlob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
