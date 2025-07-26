import Layout from "@/components/Layout";
import LabReports from "@/components/LabReports";

const LabReportsPage = () => {
  return (
    <Layout showSidebar={true}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <LabReports />
        </div>
      </div>
    </Layout>
  );
};

export default LabReportsPage; 