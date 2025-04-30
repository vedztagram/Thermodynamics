import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-thermo-blue py-4 px-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            Engineering Thermodynamics Cycles
          </h1>
          <div className="text-white text-sm">
            Modules 4 & 5: First & Second Laws of Thermodynamics
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
        <p>Interactive Thermodynamics Teaching Tool | Created with Lovable</p>
      </footer>
    </div>
  );
};

export default DashboardLayout;
