import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SummaryGenerationService } from "@/services/SummaryGenerationService";
import { PDFExportService } from "@/services/PDFExportService";
import { type CalculatorData, type Calculations } from "@/components/calculator/useCalculatorData";
import { Download, Save } from "lucide-react";

interface SaveSummaryButtonProps {
  data: CalculatorData;
  calculations: Calculations;
  submissionId: string;
  formatCurrency: (amount: number) => string;
  variant?: "default" | "outline" | "secondary";
  showIcon?: boolean;
}

export const SaveSummaryButton = ({
  data,
  calculations,
  submissionId,
  formatCurrency,
  variant = "default",
  showIcon = true
}: SaveSummaryButtonProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleSaveSummary = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save summaries",
          variant: "destructive",
        });
        return;
      }

      const summaryData = SummaryGenerationService.generateExecutiveSummary(data, calculations);
      
      const { data: savedSummary, error } = await supabase
        .from('saved_summaries')
        .insert({
          user_id: user.id,
          submission_id: submissionId,
          summary_type: 'executive',
          summary_data: summaryData as any
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Summary saved successfully",
        description: "Your executive summary has been saved to your dashboard",
      });

    } catch (error) {
      console.error('Error saving summary:', error);
      toast({
        title: "Failed to save summary",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const summaryData = SummaryGenerationService.generateExecutiveSummary(data, calculations);
      const pdfBlob = await PDFExportService.generateExecutiveSummaryPDF(summaryData, formatCurrency);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${summaryData.companyName}-executive-summary.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF exported successfully",
        description: "Your executive summary has been downloaded",
      });

    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Failed to export PDF",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={variant}
        onClick={handleSaveSummary}
        disabled={isSaving}
        className="flex items-center gap-2"
      >
        {showIcon && <Save className="h-4 w-4" />}
        {isSaving ? "Saving..." : "Save Summary"}
      </Button>
      
      <Button
        variant="outline"
        onClick={handleExportPDF}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        {showIcon && <Download className="h-4 w-4" />}
        {isExporting ? "Exporting..." : "Export PDF"}
      </Button>
    </div>
  );
};