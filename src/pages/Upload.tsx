
import FileUpload from "@/components/FileUpload";
import UserProfileForm from "@/components/UserProfileForm";
import AIGeneratedPlans from "@/components/AIGeneratedPlans";

const Upload = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Set Up Your Nutrition Profile
          </h1>
          <p className="text-muted-foreground">
            Upload your diet plans and let AI create personalized recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <FileUpload />
            <UserProfileForm />
          </div>
          <div>
            <AIGeneratedPlans />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
