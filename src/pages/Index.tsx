import { useState } from "react";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import DietPlans from "@/components/DietPlans";
import Tracking from "@/components/Tracking";
import Community from "@/components/Community";
import HealthMetrics from "@/components/HealthMetrics";
import LabReports from "@/components/LabReports";
import Rewards from "@/components/Rewards";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "plans":
        return <DietPlans />;
      case "tracking":
        return <Tracking />;
      case "health-metrics":
        return <HealthMetrics />;
      case "lab-reports":
        return <LabReports />;
      case "rewards":
        return <Rewards />;
      case "community":
        return <Community />;
      case "settings":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Settings</h2>
            <p className="text-muted-foreground">Settings panel coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout showSidebar={true}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </Layout>
  );
};

export default Index;