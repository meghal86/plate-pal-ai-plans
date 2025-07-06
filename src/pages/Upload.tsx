
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import UserProfileForm from "@/components/UserProfileForm";
import AIGeneratedPlans from "@/components/AIGeneratedPlans";
import PlanCalendar from "@/components/PlanCalendar";

const Upload = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Set Up Your Nutrition Profile
            </h1>
            <p className="text-muted-foreground">
              Upload your diet plans and let AI create personalized recommendations
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
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

        {/* Plan Calendar Section */}
        <div className="mt-8">
          <PlanCalendar />
        </div>
      </div>
    </div>
  );
};

export default Upload;
