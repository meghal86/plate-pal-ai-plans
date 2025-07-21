
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CommunitySharing from "@/components/CommunitySharing";

const Community = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Community
          </h1>
          <p className="text-muted-foreground">
            Share your journey and get inspired by others
          </p>
        </div>
        
        <CommunitySharing />
      </div>
    </div>
  );
};

export default Community;
