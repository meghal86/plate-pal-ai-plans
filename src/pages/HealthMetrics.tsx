import Layout from "@/components/Layout";
import HealthMetrics from "@/components/HealthMetrics";

const HealthMetricsPage = () => {
  return (
    <Layout showSidebar={true}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <HealthMetrics />
        </div>
      </div>
    </Layout>
  );
};

export default HealthMetricsPage; 