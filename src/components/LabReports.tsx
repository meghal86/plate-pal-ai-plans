import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import FileUpload from "@/components/FileUpload";
import { 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  Download
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  status?: 'uploaded' | 'processing' | 'completed' | 'error';
}

const LabReports = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Mock lab reports data
  const labReports = [
    {
      id: "1",
      name: "Complete Blood Panel - Q1 2024",
      uploadDate: "2024-01-15",
      status: "verified" as const,
      fileType: "PDF",
      size: "2.4 MB",
      verifiedDate: "2024-01-16"
    },
    {
      id: "2", 
      name: "Lipid Profile - December 2023",
      uploadDate: "2023-12-28",
      status: "verified" as const,
      fileType: "PDF",
      size: "1.8 MB",
      verifiedDate: "2023-12-29"
    },
    {
      id: "3",
      name: "Thyroid Function Test",
      uploadDate: "2024-01-20",
      status: "pending" as const,
      fileType: "PDF", 
      size: "1.2 MB"
    },
    {
      id: "4",
      name: "Vitamin D Level Test",
      uploadDate: "2024-01-18",
      status: "rejected" as const,
      fileType: "JPG",
      size: "0.9 MB",
      rejectionReason: "Image quality too low - please upload a clearer scan"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusCounts = () => {
    return {
      verified: labReports.filter(r => r.status === 'verified').length,
      pending: labReports.filter(r => r.status === 'pending').length,
      rejected: labReports.filter(r => r.status === 'rejected').length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2 text-primary" />
            Upload Lab Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload your health/lab reports for analysis. Accepted formats: PDF, JPG, PNG
            </p>
            <FileUpload />
            {uploadedFiles.length > 0 && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-sm text-success font-medium">
                  {uploadedFiles.length} file(s) uploaded successfully. Processing will begin shortly.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50 shadow-card">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold text-success">{statusCounts.verified}</p>
            <p className="text-sm text-muted-foreground">Verified Reports</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-card">
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold text-warning">{statusCounts.pending}</p>
            <p className="text-sm text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-card">
          <CardContent className="p-6 text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{statusCounts.rejected}</p>
            <p className="text-sm text-muted-foreground">Need Attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            Your Lab Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {labReports.map((report) => (
            <div 
              key={report.id} 
              className="border border-border/50 rounded-lg p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">{report.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Uploaded: {new Date(report.uploadDate).toLocaleDateString()}
                    </div>
                    <span>{report.fileType} • {report.size}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(report.status)}
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {report.status === "pending" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Review Progress</span>
                    <span className="text-warning">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Estimated completion: 1-2 business days
                  </p>
                </div>
              )}
              
              {report.status === "verified" && report.verifiedDate && (
                <div className="bg-success/10 border border-success/20 rounded p-2 mt-2">
                  <p className="text-xs text-success">
                    ✓ Report verified on {new Date(report.verifiedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {report.status === "rejected" && report.rejectionReason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded p-2 mt-2">
                  <p className="text-xs text-destructive font-medium">Reason for rejection:</p>
                  <p className="text-xs text-destructive">{report.rejectionReason}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Re-upload Report
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {labReports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No lab reports uploaded yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first report to get started with health tracking.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LabReports;