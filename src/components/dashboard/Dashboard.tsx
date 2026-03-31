import { useState, useEffect } from "react";
import { AppUser } from "../../hooks/useAuth"; // ✅ correct user type
import Sidebar from "./Sidebar";
import AdminDashboard from "./roles/AdminDashboard";
import AccessionDashboard from "./roles/AccessionDashboard";
import TechnicianDashboard from "./roles/TechnicianDashboard";
import PathologistDashboard from "./roles/PathologistDashboard";
import CustomerDashboard from "./roles/CustomerDashboard";
import TopBar from "./TopBar";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useSamples } from "@/hooks/useApiData";

interface DashboardProps {
  user: AppUser | null; // ✅ matches useAuth.ts
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem("currentView") || "dashboard";
  });
  const { samples, loading } = useSamples();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Push a history entry whenever the view changes
  const navigateTo = (view: string) => {
    window.history.pushState({ view }, "", window.location.pathname);
    setCurrentView(view);
    localStorage.setItem("currentView", view);
  };

  // Handle browser back/forward button
  useEffect(() => {
    const savedView = localStorage.getItem("currentView") || "dashboard";
    window.history.replaceState({ view: savedView }, "", window.location.pathname);

    const handlePopState = (event: PopStateEvent) => {
      const view = event.state?.view ?? "dashboard";
      setCurrentView(view);
      localStorage.setItem("currentView", view);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Show loading if user is null (safety fallback)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard currentView={currentView} />;

      case "accession":
        return (
          <AccessionDashboard
            currentView={currentView}
            setCurrentView={navigateTo}
          />
        );
      case "technician":
        return (
          <TechnicianDashboard
            currentView={currentView}
            setCurrentView={navigateTo}
          />
        );

      case "pathologist":
        return (
          <PathologistDashboard
            currentView={currentView}
            setCurrentView={navigateTo}
          />
        );

      case "customer":
        return <CustomerDashboard currentView={currentView} />;

      default:
        return <div>Invalid role</div>;
    }
  };

  // Inside Dashboard.tsx
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 w-full overflow-hidden">
        <Sidebar
          user={user}
          currentView={currentView}
          setCurrentView={navigateTo}
        />

        {/* SidebarInset must take all remaining horizontal space */}
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-white">
          <TopBar user={user} onLogout={onLogout} />

          {/* CRITICAL FIX: 
            1. Remove 'mx-auto' or 'max-w-screen-xl' if they exist.
            2. Add 'w-full', 'justify-start', and 'items-start'.
        */}
          {/* Find the main tag and add 'items-start' and 'justify-start' */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 w-full flex flex-col items-start justify-start bg-slate-50">
            <div className="w-full max-w-none text-left">{renderContent()}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
