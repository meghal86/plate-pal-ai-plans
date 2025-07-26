import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout showSidebar={false}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">404</h1>
          <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 mx-auto px-4 py-2 border border-blue-300 rounded-lg"
          >
            Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
