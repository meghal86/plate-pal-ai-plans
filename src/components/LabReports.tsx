import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import LabReportUpload from "@/components/LabReportUpload";
import { 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  Download,
  AlertCircle,
  TrendingUp,
  Activity,
  FileImage
} from "lucide-react";

const LabReports = () => {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Mock lab reports data
  const labReports = [
    {
      id: "1",
      name: "Complete Blood Panel - Q1 2024",
      uploadDate: "2024-01-15",
      status: "verified" as const,
      fileType: "PDF",
      size: "2.4 MB",
      verifiedDate: "2024-01-16",
      category: "Blood Work",
      priority: "High"
    },
    {
      id: "2", 
      name: "Lipid Profile - December 2023",
      uploadDate: "2023-12-28",
      status: "verified" as const,
      fileType: "PDF",
      size: "1.8 MB",
      verifiedDate: "2023-12-29",
      category: "Cardiovascular",
      priority: "Medium"
    },
    {
      id: "3",
      name: "Thyroid Function Test",
      uploadDate: "2024-01-20",
      status: "pending" as const,
      fileType: "PDF", 
      size: "1.2 MB",
      category: "Endocrine",
      priority: "High"
    },
    {
      id: "4",
      name: "Vitamin D Level Test",
      uploadDate: "2024-01-18",
      status: "rejected" as const,
      fileType: "JPG",
      size: "0.9 MB",
      rejectionReason: "Image quality too low - please upload a clearer scan",
      category: "Vitamins",
      priority: "Low"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">High</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Medium</Badge>;
      case "Low":
        return <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "PDF":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "JPG":
      case "PNG":
        return <FileImage className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Lab Reports</h1>
        <p className="text-gray-600">Manage and track your health reports and test results</p>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">Verified Reports</p>
                <p className="text-3xl font-bold text-emerald-900">{statusCounts.verified}</p>
                <p className="text-xs text-emerald-600 mt-1">Successfully processed</p>
              </div>
              <div className="h-12 w-12 bg-emerald-200 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">Under Review</p>
                <p className="text-3xl font-bold text-amber-900">{statusCounts.pending}</p>
                <p className="text-xs text-amber-600 mt-1">Processing in progress</p>
              </div>
              <div className="h-12 w-12 bg-amber-200 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Need Attention</p>
                <p className="text-3xl font-bold text-red-900">{statusCounts.rejected}</p>
                <p className="text-xs text-red-600 mt-1">Requires action</p>
              </div>
              <div className="h-12 w-12 bg-red-200 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <Upload className="h-5 w-5 mr-3 text-blue-600" />
            Upload New Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <LabReportUpload />
            {uploadedFiles.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                  <p className="text-sm text-emerald-700 font-medium">
                    {uploadedFiles.length} file(s) uploaded successfully. Processing will begin shortly.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-3 text-blue-600" />
              Your Reports
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {labReports.length} Total
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {labReports.map((report, index) => (
              <div 
                key={report.id} 
                className="p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(report.fileType)}
                        <h3 className="font-semibold text-gray-900 truncate">{report.name}</h3>
                      </div>
                      {getPriorityBadge(report.priority)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Uploaded {new Date(report.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <span>•</span>
                      <span>{report.fileType} • {report.size}</span>
                      <span>•</span>
                      <span className="text-blue-600 font-medium">{report.category}</span>
                    </div>

                    {/* Status-specific content */}
                    {report.status === "pending" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Review Progress</span>
                          <span className="text-amber-600 font-medium">60%</span>
                        </div>
                        <Progress value={60} className="h-2" />
                        <p className="text-xs text-gray-500">
                          Estimated completion: 1-2 business days
                        </p>
                      </div>
                    )}
                    
                    {report.status === "verified" && report.verifiedDate && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                          <p className="text-sm text-emerald-700">
                            Report verified on {new Date(report.verifiedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {report.status === "rejected" && report.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 text-red-600 mr-2" />
                            <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                          </div>
                          <p className="text-sm text-red-600 ml-6">{report.rejectionReason}</p>
                          <Button variant="outline" size="sm" className="ml-6 mt-2">
                            Re-upload Report
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-4">
                    {getStatusBadge(report.status)}
                    <Button variant="outline" size="sm" className="border-gray-300">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {labReports.length === 0 && (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports uploaded yet</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Upload your first lab report to start tracking your health metrics and get AI-powered insights.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LabReports;