import Layout from "@/components/Layout";
import Tracking from "@/components/Tracking";

const TrackingPage = () => {
  return (
    <Layout showSidebar={true}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Tracking />
        </div>
      </div>
    </Layout>
  );
};

export default TrackingPage; 