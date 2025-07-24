import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Download, Share2, BookOpen } from "lucide-react";
import { useState } from "react";

interface MobileResultsOptimizerProps {
  onDownloadPDF: () => void;
  onBookConsultation: () => void;
  children: React.ReactNode;
}

export const MobileResultsOptimizer = ({
  onDownloadPDF,
  onBookConsultation,
  children
}: MobileResultsOptimizerProps) => {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<string>('summary');

  if (!isMobile) {
    return <>{children}</>;
  }

  const sections = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'breakdown', label: 'Breakdown', icon: '📈' },
    { id: 'actions', label: 'Actions', icon: '🎯' },
    { id: 'insights', label: 'Insights', icon: '💡' }
  ];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Revenue Recovery Analysis',
          text: 'Check out my personalized revenue recovery recommendations!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="p-4">
          <h1 className="text-lg font-semibold text-center">Your Revenue Analysis</h1>
        </div>
        
        {/* Section tabs */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 pb-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-shrink-0 px-3 py-2 mx-1 rounded-full text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="mr-1">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area with mobile optimizations */}
      <div className="px-4 pb-24 space-y-4">
        {children}
      </div>

      {/* Mobile floating action buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-20">
        <Button
          size="sm"
          variant="outline"
          onClick={handleShare}
          className="rounded-full w-12 h-12 p-0 shadow-lg bg-background/90 backdrop-blur-sm"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile sticky bottom actions */}
      <Card className="fixed bottom-0 left-0 right-0 z-20 rounded-none border-x-0 border-b-0 bg-background/95 backdrop-blur-sm">
        <div className="p-4 flex gap-3">
          <Button
            variant="outline"
            onClick={onDownloadPDF}
            className="flex-1 touch-manipulation"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          
          <Button
            onClick={onBookConsultation}
            className="flex-1 touch-manipulation"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Book Call
          </Button>
        </div>
      </Card>
    </div>
  );
};