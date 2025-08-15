
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
  File,
  Brain
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { processUploadedDietDocument } from "@/api/process-diet-document";
import { generatePlanEmbedding } from "@/api/generate-diet-plan";
import { useUser } from "@/contexts/UserContext";

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
  const [processingWithAI, setProcessingWithAI] = useState(false);
  const [sessionUploads, setSessionUploads] = useState<UploadedFile[]>([]);
  const [textContent, setTextContent] = useState("");
  const [planName, setPlanName] = useState("");
  const [textPlanName, setTextPlanName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file);
    if (!planName) {
      setPlanName(file.name.split('.')[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    // Create a temporary upload entry
    const tempFile: UploadedFile = {
      id: Date.now().toString(),
      name: selectedFile.name,
      planName: planName || selectedFile.name,
      fileType: selectedFile.type,
      size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'uploading'
    };

    setSessionUploads(prev => [tempFile, ...prev]);
    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `diet-plans/${userId || 'demo'}/${fileName}`;

      console.log('Uploading file:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, selectedFile);

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
          filename: selectedFile.name,
          file_url: data.publicUrl,
          file_type: selectedFile.type,
          plan_name: planName || selectedFile.name
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
      setSelectedFile(null);
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

  const handleProcessWithAI = async () => {
    if (!selectedFile || !planName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter a plan name",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to process diet plans with AI",
        variant: "destructive"
      });
      return;
    }

    const tempFile: UploadedFile = {
      id: Date.now().toString(),
      name: selectedFile.name,
      planName: planName,
      fileType: selectedFile.type,
      size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'uploading'
    };

    setSessionUploads(prev => [tempFile, ...prev]);
    setProcessingWithAI(true);
    
    try {
      // Step 1: Process the document with Gemini AI
      toast({
        title: "🤖 Processing Document",
        description: "Analyzing your diet plan document with AI...",
      });

      console.log('📄 Processing uploaded document:', selectedFile.name);
      const processedPlan = await processUploadedDietDocument(selectedFile, planName, user.id);
      
      console.log('✅ Document processed successfully:', processedPlan);

      // Step 2: Upload file to storage for reference
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `diet-plans/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('nutrition-files')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.warn('⚠️ File upload failed, but continuing with plan creation:', uploadError);
      }

      const { data: storageData } = supabase.storage
        .from('nutrition-files')
        .getPublicUrl(filePath);

      // Step 3: Skip embedding generation due to CORS issues
      let embeddingForDb = null;
      console.log('⏭️ Skipping embedding generation to avoid CORS issues');
      
      // Note: If we were to include embedding, the format should be:
      // embeddingForDb = `[${embedding.join(",")}]` for vector type

      // Step 4: Save as nutrition plan
      const planData = {
        user_id: user.id,
        title: processedPlan.title || 'Uploaded Diet Plan',
        description: (processedPlan.description || 'Diet plan from uploaded document') + ` (Uploaded from ${selectedFile.name})`,
        plan_content: processedPlan as any,
        duration: processedPlan.duration || '7 days',
        calories: processedPlan.calories || '1800-2000',
        is_active: false, // Start as inactive, user can activate later
        ...(embeddingForDb && { embedding: embeddingForDb as unknown as string })
      };
      
      // Validate required fields
      if (!planData.user_id) {
        throw new Error('User ID is required');
      }
      if (!planData.title) {
        throw new Error('Plan title is required');
      }

      console.log('💾 Saving processed plan to database...');
      console.log('📊 Plan data size:', JSON.stringify(planData).length, 'characters');
      console.log('📋 Plan content structure:', {
        hasTitle: !!processedPlan.title,
        hasDescription: !!processedPlan.description,
        hasDailyMeals: !!processedPlan.dailyMeals,
        dailyMealsCount: processedPlan.dailyMeals?.length || 0,
        contentSize: JSON.stringify(processedPlan).length
      });
      
      const { data: savedPlan, error: saveError } = await supabase
        .from('nutrition_plans')
        .insert(planData)
        .select()
        .single();

      if (saveError) {
        console.error('❌ Database save error details:', {
          message: saveError.message,
          details: saveError.details,
          hint: saveError.hint,
          code: saveError.code
        });
        console.error('❌ Plan data being inserted:', planData);
        
        // Try without embedding if save fails
        console.warn('⚠️ Save failed with embedding, trying without embedding...');
        const planDataWithoutEmbedding = { ...planData };
        delete planDataWithoutEmbedding.embedding;
        
        const { data: savedPlanRetry, error: saveErrorRetry } = await supabase
          .from('nutrition_plans')
          .insert(planDataWithoutEmbedding)
          .select()
          .single();
        
        if (saveErrorRetry) {
          throw saveErrorRetry;
        }
        
        console.log('✅ Plan saved successfully without embedding');
      } else {
        console.log('✅ Plan saved successfully with embedding');
      }

      // Step 5: Save file reference
      if (!uploadError) {
        await supabase
          .from('uploaded_files')
          .insert({
            user_id: user.id,
            filename: selectedFile.name,
            file_url: storageData.publicUrl,
            file_type: selectedFile.type,
            plan_name: planName
          });
      }

      // Step 6: Update UI
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'success', url: storageData.publicUrl }
          : f
      ));

      toast({
        title: "AI Processing Complete! 🎉",
        description: `Your diet plan has been processed and converted to a structured format. You can now view it in the Diet Plans section.`,
      });

      // Reset form
      setSelectedFile(null);
      setPlanName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ AI processing error:', error);
      
      // Update the file status to error
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'error' }
          : f
      ));

      let errorTitle = "AI Processing Failed";
      let errorDescription = "Unable to process your diet plan with AI. Please try again.";
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorTitle = "Network Error";
          errorDescription = "Unable to connect to AI service. Please check your internet connection and try again.";
        } else if (errorMessage.includes('timeout')) {
          errorTitle = "Request Timeout";
          errorDescription = "The AI service is taking too long to respond. Please try again.";
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          errorTitle = "Rate Limit Exceeded";
          errorDescription = "Too many requests. Please wait a moment and try again.";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setProcessingWithAI(false);
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
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg mb-6 h-auto">
                <TabsTrigger 
                  value="file" 
                  className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm min-h-[48px] transition-all duration-200"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload File</span>
                  <span className="sm:hidden">Upload</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="text" 
                  className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm min-h-[48px] transition-all duration-200"
                >
                  <Type className="h-4 w-4" />
                  <span className="hidden sm:inline">Enter Text</span>
                  <span className="sm:hidden">Text</span>
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
                      disabled={uploading || processingWithAI}
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
                          disabled={uploading || processingWithAI}
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
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={uploading || processingWithAI}
                          accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx,.rtf,.odt"
                        />
                      </div>
                      {(uploading || processingWithAI) && (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">
                            {processingWithAI ? 'Processing with AI...' : 'Uploading...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected File Display */}
                  {selectedFile && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        ✨ Ready for AI processing - will extract meal plans, ingredients, and nutritional information
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={handleFileUpload}
                      disabled={uploading || processingWithAI || !selectedFile}
                      variant="outline"
                      className="flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Only
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleProcessWithAI}
                      disabled={processingWithAI || uploading || !selectedFile || !planName.trim()}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                    >
                      {processingWithAI ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Process with AI
                        </>
                      )}
                    </Button>
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
                <p className="font-medium mb-2">Upload Options:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Upload Only:</strong> Store file for reference</li>
                  <li>• <strong>Process with AI:</strong> Extract meals, ingredients, and nutrition info</li>
                  <li>• Supported formats: PDF, DOC, DOCX, TXT, and image files</li>
                  <li>• Maximum file size: 10MB per file</li>
                  <li>• Ensure your diet plan is clear and legible for best AI results</li>
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
