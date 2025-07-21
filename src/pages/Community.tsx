
import { useState } from "react";
import Navigation from "@/components/Navigation";
import CommunitySharing from "@/components/CommunitySharing";

const Community = () => {
  const [activeTab, setActiveTab] = useState("community");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="flex flex-col md:flex-row">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6 md:ml-0">
          <div className="max-w-4xl mx-auto">
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
        </main>
      </div>
    </div>
  );
};

export default Community;
