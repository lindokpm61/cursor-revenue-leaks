import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Download, Share2, Mail, Calendar, FileText, Presentation } from "lucide-react";

interface EnhancedExportCTAProps {
  onExportPDF?: () => void;
  onEmailResults?: () => void;
  onScheduleReview?: () => void;
  onShareResults?: () => void;
}

export const EnhancedExportCTA = ({
  onExportPDF,
  onEmailResults,
  onScheduleReview,
  onShareResults
}: EnhancedExportCTAProps) => {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Download PDF Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEmailResults}>
            <Mail className="h-4 w-4 mr-2" />
            Email Results to Team
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Presentation className="h-4 w-4 mr-2" />
            Export PowerPoint
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onShareResults}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Analysis Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onScheduleReview}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Results Review Call
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Mail className="h-4 w-4 mr-2" />
            Send to Consultant
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};