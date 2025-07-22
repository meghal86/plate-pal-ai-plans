import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import UserProfileForm from "@/components/UserProfileForm";

const Profile = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Personal Information
            </h1>
            <p className="text-muted-foreground">
              Manage your profile and family member settings
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <UserProfileForm />
      </div>
    </div>
  );
};

export default Profile;