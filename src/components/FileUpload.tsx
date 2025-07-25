
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Image, Loader2, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [submittingText, setSubmittingText] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{url: string, name: string}>>([]);
  const [textContent, setTextContent] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load uploaded files on component mount
  useEffect(() => {
    loadUploadedFiles();
  }, []);

  const loadUploadedFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading files:', error);
        return;
      }

      if (data) {
        const files = data.map(file => ({
          url: file.file_url,
          name: file.filename
        }));
        setUploadedFiles(files);
      }
    } catch (error) {
      console.error('Error loading uploaded files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Allow any file type - removed file type restriction

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Use null for user_id since we don't have authentication yet
      const userId = null;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `demo/${fileName}`;

      console.log('Uploading file:', fileName, 'to bucket: nutrition-files');

      const { error: uploadError } = await supabase.storage
        .from('nutrition-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('nutrition-files')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully, URL:', data.publicUrl);

      // Save file info to database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: userId,
          filename: file.name,
          file_url: data.publicUrl,
          file_type: file.type
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't throw here, file is already uploaded
      }

      // Reload the files list to show the new upload
      await loadUploadedFiles();
      
      toast({
        title: "File uploaded successfully",
        description: "Your diet plan file has been uploaded and saved",
      });

      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload process error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const triggerFileUpload = () => {
    console.log('Upload button clicked');
    fileInputRef.current?.click();
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

    setSubmittingText(true);
    
    try {
      // Use null for user_id since we don't have authentication yet  
      const userId = null;
      
      // Create a text file from the content
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      const fileName = `text-plan-${Date.now()}.txt`;
      const filePath = `demo/${fileName}`;

      console.log('Uploading text content as file:', fileName);

      // Upload the text as a file
      const { error: uploadError } = await supabase.storage
        .from('nutrition-files')
        .upload(filePath, textBlob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('nutrition-files')
        .getPublicUrl(filePath);

      console.log('Text file uploaded successfully, URL:', data.publicUrl);

      // Save file info to database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: userId,
          filename: fileName,
          file_url: data.publicUrl,
          file_type: 'text/plain'
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't throw here, file is already uploaded
      }

      // Reload the files list to show the new upload
      await loadUploadedFiles();
      
      toast({
        title: "Text submitted successfully",
        description: "Your text content has been saved and uploaded",
      });

      // Clear the text area
      setTextContent("");
    } catch (error) {
      console.error('Text submission error:', error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingText(false);
    }
  };

  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2 text-primary" />
          Upload Diet Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center">
              <Type className="h-4 w-4 mr-2" />
              Enter Text
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <Button
                    onClick={triggerFileUpload}
                    disabled={uploading}
                    className="text-lg font-medium"
                    variant="ghost"
                  >
                    Drop files here or click to upload
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    Any document type up to 10MB
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="diet-text" className="block text-sm font-medium text-foreground mb-2">
                  Enter your diet plan or meal information
                </label>
                <Textarea
                  id="diet-text"
                  placeholder="Enter your diet plan, meal schedule, ingredients list, or any nutrition information here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                  disabled={submittingText}
                />
              </div>
              <Button
                onClick={handleTextSubmit}
                disabled={submittingText || !textContent.trim()}
                className="w-full"
              >
                {submittingText ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Type className="h-4 w-4 mr-2" />
                    Submit Text Content
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Uploaded Files:</h4>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-secondary rounded">
                {file.name.toLowerCase().includes('.pdf') ? (
                  <FileText className="h-4 w-4 text-red-500" />
                ) : (
                  <Image className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-sm truncate">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
