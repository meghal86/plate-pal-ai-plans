
import CommunitySharing from "@/components/CommunitySharing";
import Layout from "@/components/Layout";

const Community = () => {
  return (
    <Layout showSidebar={true}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <p className="text-muted-foreground">
            Share your journey and get inspired by others
          </p>
        </div>
        
        <CommunitySharing />
      </div>
    </Layout>
  );
};

export default Community;
