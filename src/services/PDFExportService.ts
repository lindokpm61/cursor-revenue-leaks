import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExecutiveSummaryData } from './SummaryGenerationService';

export class PDFExportService {
  static async generateExecutiveSummaryPDF(
    summaryData: ExecutiveSummaryData,
    formatCurrency: (amount: number) => string
  ): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', 20, 30);
    pdf.text(`${summaryData.companyName} Revenue Analysis`, 20, 45);

    // Add generation date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date(summaryData.generatedAt).toLocaleDateString()}`, 20, 55);

    let yPosition = 70;

    // Key Metrics Section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Financial Metrics', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const metrics = [
      `Current ARR: ${formatCurrency(summaryData.currentARR)}`,
      `Total Revenue Leak: ${formatCurrency(summaryData.totalRevenueLeak)}`,
      `Leakage Percentage: ${summaryData.leakagePercentage.toFixed(1)}%`,
      `Recovery Potential (70%): ${formatCurrency(summaryData.recoveryPotential70)}`,
      `Recovery Potential (85%): ${formatCurrency(summaryData.recoveryPotential85)}`,
      `ROI Potential: ${summaryData.roiPotential.toFixed(0)}%`
    ];

    metrics.forEach(metric => {
      pdf.text(metric, 20, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Revenue Leak Breakdown
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Revenue Leak Breakdown', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const breakdown = [
      `Lead Response Loss: ${formatCurrency(summaryData.leadResponseLoss)}`,
      `Failed Payment Loss: ${formatCurrency(summaryData.failedPaymentLoss)}`,
      `Process Inefficiency: ${formatCurrency(summaryData.processInefficiency)}`,
      `Self-Serve Gap: ${formatCurrency(summaryData.selfServeGap)}`
    ];

    breakdown.forEach(item => {
      pdf.text(item, 20, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Key Insights
    if (summaryData.keyInsights.length > 0) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Insights', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      summaryData.keyInsights.forEach((insight, index) => {
        const lines = pdf.splitTextToSize(`${index + 1}. ${insight}`, 170);
        lines.forEach((line: string) => {
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      });
    }

    yPosition += 10;

    // Priority Actions
    if (summaryData.priorityActions.length > 0) {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Priority Actions', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      summaryData.priorityActions.forEach((action, index) => {
        const lines = pdf.splitTextToSize(`${index + 1}. ${action}`, 170);
        lines.forEach((line: string) => {
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 6;
        });
        yPosition += 3;
      });
    }

    // Implementation Timeframe
    yPosition += 10;
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Implementation Timeframe', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(summaryData.implementationTimeframe, 20, yPosition);

    return pdf.output('blob');
  }

  static async captureElementAsPDF(elementId: string, filename: string = 'summary.pdf'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}