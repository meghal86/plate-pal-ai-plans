
import CommunitySharing from "@/components/CommunitySharing";

const Community = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-4xl mx-auto p-6">
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
