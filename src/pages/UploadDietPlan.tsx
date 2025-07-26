import FileUpload from "@/components/FileUpload";

export default function UploadDietPlan() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
      <div className="max-w-xl w-full p-6">
        <FileUpload />
      </div>
    </div>
  );
} 