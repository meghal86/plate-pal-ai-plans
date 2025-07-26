import Layout from "@/components/Layout";
import Rewards from "@/components/Rewards";

const RewardsPage = () => {
  return (
    <Layout showSidebar={true}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Rewards />
        </div>
      </div>
    </Layout>
  );
};

export default RewardsPage; 