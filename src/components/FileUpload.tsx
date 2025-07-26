
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  Image, 
  Loader2, 
  Type, 
  CheckCircle,
  X,
  AlertCircle,
  FileImage,
  File
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  planName: string;
  fileType: string;
  size: string;
  status: 'uploading' | 'success' | 'error';
  url?: string;
}

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [submittingText, setSubmittingText] = useState(false);
  const [sessionUploads, setSessionUploads] = useState<UploadedFile[]>([]);
  const [textContent, setTextContent] = useState("");
  const [planName, setPlanName] = useState("");
  const [textPlanName, setTextPlanName] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Create a temporary upload entry
    const tempFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      planName: planName || file.name,
      fileType: file.type,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'uploading'
    };

    setSessionUploads(prev => [tempFile, ...prev]);
    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `diet-plans/${userId || 'demo'}/${fileName}`;

      console.log('Uploading file:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully, URL:', data.publicUrl);

      // Save file info to database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: userId,
          filename: file.name,
          file_url: data.publicUrl,
          file_type: file.type,
          plan_name: planName || file.name
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Update the file status to success
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'success', url: data.publicUrl }
          : f
      ));
      
      toast({
        title: "Upload successful",
        description: "Your diet plan has been uploaded successfully",
      });

      // Reset the input and plan name
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setPlanName("");
    } catch (error) {
      console.error('Upload process error:', error);
      
      // Update the file status to error
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'error' }
          : f
      ));

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim()) {
      toast({
        title: "No content",
        description: "Please enter some text content",
        variant: "destructive"
      });
      return;
    }

    // Create a temporary upload entry
    const tempFile: UploadedFile = {
      id: Date.now().toString(),
      name: `Text Plan - ${textPlanName || 'Untitled'}`,
      planName: textPlanName || 'Text Diet Plan',
      fileType: 'text/plain',
      size: (textContent.length / 1024).toFixed(2) + ' KB',
      status: 'uploading'
    };

    setSessionUploads(prev => [tempFile, ...prev]);
    setSubmittingText(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Create a text file from the content
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      const fileName = `text-plan-${Date.now()}.txt`;
      const filePath = `diet-plans/${userId || 'demo'}/${fileName}`;

      console.log('Uploading text content as file:', fileName);

      // Upload the text as a file
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, textBlob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      console.log('Text file uploaded successfully, URL:', data.publicUrl);

      // Save file info to database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: userId,
          filename: fileName,
          file_url: data.publicUrl,
          file_type: 'text/plain',
          plan_name: textPlanName || 'Text Diet Plan'
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Update the file status to success
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'success', url: data.publicUrl }
          : f
      ));

      toast({
        title: "Text submitted successfully",
        description: "Your diet plan text has been saved successfully",
      });

      // Clear the text area and plan name
      setTextContent("");
      setTextPlanName("");
    } catch (error) {
      console.error('Text submission error:', error);
      
      // Update the file status to error
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'error' }
          : f
      ));

      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingText(false);
    }
  };

  const removeUpload = (id: string) => {
    setSessionUploads(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes('image')) return <FileImage className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('text')) return <FileText className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading</Badge>;
      case 'success':
        return <Badge className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return null;
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="page" style={{
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: '1440px',
      height: '1208px',
      background: '#FFFFFFFF',
      padding: '40px',
      overflow: 'auto'
    }}>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Diet Plan Upload</h1>
        <p className="text-gray-600">Upload your existing diet plan or create a new one with text input</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Upload Section */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Diet Plan</h2>
              <p className="text-gray-600 text-sm">Choose your preferred upload method</p>
            </div>

            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg mb-6">
                <TabsTrigger value="file" className="flex items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Type className="h-4 w-4 mr-2" />
                  Enter Text
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="plan-name" className="text-sm font-medium text-gray-700">
                      Plan Name (Optional)
                    </Label>
                    <Input
                      id="plan-name"
                      type="text"
                      placeholder="e.g., Mediterranean Diet Plan"
                      value={planName}
                      onChange={e => setPlanName(e.target.value)}
                      disabled={uploading}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <Button
                          onClick={triggerFileUpload}
                          disabled={uploading}
                          variant="outline"
                          className="border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                        >
                          Choose File or Drag & Drop
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          PDF, DOC, TXT, or any document type (Max 10MB)
                        </p>
                        <Input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </div>
                      {uploading && (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="text-plan-name" className="text-sm font-medium text-gray-700">
                      Plan Name (Optional)
                    </Label>
                    <Input
                      id="text-plan-name"
                      type="text"
                      placeholder="e.g., My Custom Diet Plan"
                      value={textPlanName}
                      onChange={e => setTextPlanName(e.target.value)}
                      disabled={submittingText}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="diet-text" className="text-sm font-medium text-gray-700">
                      Diet Plan Content
                    </Label>
                    <Textarea
                      id="diet-text"
                      placeholder="Enter your diet plan, meal schedule, ingredients list, or any nutrition information here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="mt-1 min-h-[200px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={submittingText}
                    />
                  </div>
                  <Button
                    onClick={handleTextSubmit}
                    disabled={submittingText || !textContent.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {submittingText ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Type className="h-4 w-4 mr-2" />
                        Save Diet Plan
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Upload Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Upload Guidelines:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Supported formats: PDF, DOC, DOCX, TXT, and image files</li>
                  <li>• Maximum file size: 10MB per file</li>
                  <li>• Ensure your diet plan is clear and legible</li>
                  <li>• You can upload multiple files in one session</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Session Uploads Section */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">This Session's Uploads</h2>
              <p className="text-gray-600 text-sm">Files uploaded during this session</p>
            </div>

            {sessionUploads.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Upload your first diet plan to see it appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessionUploads.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.fileType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.planName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.name} • {file.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(file.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpload(file.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
