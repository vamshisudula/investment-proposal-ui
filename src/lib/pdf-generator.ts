
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvestmentProposal } from './types';

export async function generateProposalPDF(proposal: InvestmentProposal): Promise<Blob> {
  return new Promise((resolve) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Add the document title
    pdf.setFontSize(20);
    pdf.text(proposal.title, pageWidth / 2, 20, { align: 'center' });
    
    // Add date and client name
    pdf.setFontSize(12);
    pdf.text(`Date: ${proposal.date}`, 20, 30);
    pdf.text(`Client: ${proposal.clientName}`, 20, 40);
    pdf.text(`Advisor: ${proposal.advisorName}`, 20, 50);
    
    // Draw a separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, 55, pageWidth - 20, 55);
    
    // Company Introduction
    pdf.setFontSize(16);
    pdf.text('Company Introduction', 20, 70);
    pdf.setFontSize(11);
    const introLines = pdf.splitTextToSize(proposal.companyIntro, pageWidth - 40);
    pdf.text(introLines, 20, 80);
    
    // Market Outlook
    let yPos = 80 + (introLines.length * 7);
    pdf.setFontSize(16);
    pdf.text('Market Outlook', 20, yPos);
    yPos += 10;
    pdf.setFontSize(11);
    const outlookLines = pdf.splitTextToSize(proposal.marketOutlook, pageWidth - 40);
    pdf.text(outlookLines, 20, yPos);
    
    // Check if we need a new page for client profile
    yPos += (outlookLines.length * 7) + 10;
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }
    
    // Client Profile
    pdf.setFontSize(16);
    pdf.text('Client Profile', 20, yPos);
    yPos += 10;
    
    // Personal details
    pdf.setFontSize(14);
    pdf.text('Personal Information', 20, yPos);
    yPos += 10;
    
    autoTable(pdf, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: [
        ['Name', proposal.clientProfile.personal.name],
        ['Age', proposal.clientProfile.personal.age.toString()],
        ['Occupation', proposal.clientProfile.personal.occupation || 'Not Specified'],
        ['Email', proposal.clientProfile.personal.email || 'Not Specified'],
        ['Marital Status', proposal.clientProfile.personal.maritalStatus || 'Not Specified'],
        ['Dependents', proposal.clientProfile.personal.dependents.toString()],
      ],
      margin: { left: 20 },
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Get the Y position after the table
    yPos = (pdf as any).lastAutoTable.finalY + 10;
    
    // Financial details
    pdf.setFontSize(14);
    pdf.text('Financial Situation', 20, yPos);
    yPos += 10;
    
    autoTable(pdf, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: [
        ['Current Investments', `₹${proposal.clientProfile.financial.currentInvestments.toLocaleString()}`],
        ['Liabilities', `₹${proposal.clientProfile.financial.liabilities.toLocaleString()}`],
        ['Real Estate', `₹${proposal.clientProfile.financial.realEstate.toLocaleString()}`],
        ['Savings', `₹${proposal.clientProfile.financial.savings.toLocaleString()}`],
        ['Monthly Expenses', `₹${proposal.clientProfile.financial.monthlyExpenses.toLocaleString()}`],
        ['Emergency Fund', proposal.clientProfile.financial.emergencyFund],
        ['Existing Products', proposal.clientProfile.financial.existingProducts.join(', ')],
      ],
      margin: { left: 20 },
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Get the Y position after the table
    yPos = (pdf as any).lastAutoTable.finalY + 10;
    
    // Check if we need a new page
    if (yPos > 200) {
      pdf.addPage();
      yPos = 20;
    }
    
    // Risk Assessment
    pdf.setFontSize(16);
    pdf.text('Risk Assessment', 20, yPos);
    yPos += 10;
    
    pdf.setFontSize(12);
    pdf.text(`Risk Score: ${proposal.riskAssessment.riskScore}/100 (${proposal.riskAssessment.riskCategory})`, 20, yPos);
    yPos += 10;
    
    if (proposal.riskAssessment.details && proposal.riskAssessment.details.explanation) {
      const riskLines = pdf.splitTextToSize(proposal.riskAssessment.details.explanation, pageWidth - 40);
      pdf.text(riskLines, 20, yPos);
      yPos += (riskLines.length * 7) + 10;
    }
    
    // Asset Allocation
    pdf.setFontSize(16);
    pdf.text('Asset Allocation', 20, yPos);
    yPos += 10;
    
    pdf.setFontSize(12);
    pdf.text(`Portfolio Size: ₹${proposal.assetAllocation.portfolioSize.toLocaleString()}`, 20, yPos);
    yPos += 10;
    
    // Add asset allocation table
    const assetAllocationBody = [];
    for (const [assetClass, percentage] of Object.entries(proposal.assetAllocation.assetClassAllocation)) {
      assetAllocationBody.push([
        assetClass.charAt(0).toUpperCase() + assetClass.slice(1),
        `${percentage}%`,
        `₹${Math.round(proposal.assetAllocation.portfolioSize * percentage / 100).toLocaleString()}`,
      ]);
    }
    
    autoTable(pdf, {
      startY: yPos,
      head: [['Asset Class', 'Allocation %', 'Amount (₹)']],
      body: assetAllocationBody,
      margin: { left: 20 },
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Get the Y position after the table
    yPos = (pdf as any).lastAutoTable.finalY + 10;
    
    if (proposal.assetAllocation.rationale) {
      const rationaleLines = pdf.splitTextToSize(proposal.assetAllocation.rationale, pageWidth - 40);
      pdf.text(rationaleLines, 20, yPos);
      yPos += (rationaleLines.length * 7) + 10;
    }
    
    // Check if we need a new page for product recommendations
    if (yPos > 200) {
      pdf.addPage();
      yPos = 20;
    }
    
    // Product Recommendations
    pdf.setFontSize(16);
    pdf.text('Product Recommendations', 20, yPos);
    yPos += 10;
    
    if (proposal.productRecommendations.recommendationSummary) {
      const summaryLines = pdf.splitTextToSize(proposal.productRecommendations.recommendationSummary, pageWidth - 40);
      pdf.setFontSize(11);
      pdf.text(summaryLines, 20, yPos);
      yPos += (summaryLines.length * 7) + 10;
    }
    
    // Product recommendations by asset class
    for (const [assetClass, productTypes] of Object.entries(proposal.productRecommendations.recommendations)) {
      // Check if we need a new page
      if (yPos > 230) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(14);
      pdf.text(assetClass.charAt(0).toUpperCase() + assetClass.slice(1), 20, yPos);
      yPos += 10;
      
      for (const [productType, products] of Object.entries(productTypes)) {
        pdf.setFontSize(12);
        pdf.text(productType, 30, yPos);
        yPos += 7;
        
        const productData = products.map(product => [
          product.name,
          product.expectedReturn,
          product.risk,
          `₹${product.minInvestment.toLocaleString()}`,
        ]);
        
        autoTable(pdf, {
          startY: yPos,
          head: [['Product', 'Expected Return', 'Risk', 'Min. Investment']],
          body: productData,
          margin: { left: 30 },
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] },
        });
        
        // Get the Y position after the table
        yPos = (pdf as any).lastAutoTable.finalY + 10;
      }
    }
    
    // Implementation Plan
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Implementation Plan', 20, 20);
    pdf.setFontSize(11);
    const implementationLines = pdf.splitTextToSize(proposal.implementationPlan, pageWidth - 40);
    pdf.text(implementationLines, 20, 30);
    
    // Disclaimer
    let disclaimerY = 30 + (implementationLines.length * 7) + 20;
    if (disclaimerY > 250) {
      pdf.addPage();
      disclaimerY = 20;
    }
    
    pdf.setFontSize(16);
    pdf.text('Disclaimer', 20, disclaimerY);
    disclaimerY += 10;
    pdf.setFontSize(9);
    const disclaimerLines = pdf.splitTextToSize(proposal.disclaimer, pageWidth - 40);
    pdf.text(disclaimerLines, 20, disclaimerY);
    
    // Convert the PDF to a blob and resolve the promise
    const pdfBlob = pdf.output('blob');
    resolve(pdfBlob);
  });
}
