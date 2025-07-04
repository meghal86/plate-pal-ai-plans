
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{url: string, name: string}>>([]);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF or image files only",
        variant: "destructive"
      });
      return;
    }

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

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
      const tempUserId = crypto.randomUUID();
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: tempUserId,
          filename: file.name,
          file_url: data.publicUrl,
          file_type: file.type
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't throw here, file is already uploaded
      }

      setUploadedFiles(prev => [...prev, { url: data.publicUrl, name: file.name }]);
      
      toast({
        title: "File uploaded successfully",
        description: "Your diet plan file has been uploaded and saved",
      });

      // Reset the input
      event.target.value = '';
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

  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2 text-primary" />
          Upload Diet Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-foreground">
                  Drop files here or click to upload
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, PNG, JPG up to 10MB
                </p>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
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
