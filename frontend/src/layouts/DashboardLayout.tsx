import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/navigation/Navbar";
import { Sidebar } from "../components/navigation/Sidebar";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9 lg:py-9"><Outlet /></main>
        <footer className="px-4 pb-5 text-center text-[10px] text-muted/75 sm:px-7 lg:px-9">Flowline operations workspace <span className="px-1.5">·</span> Data shown for foundation preview</footer>
      </div>
    </div>
  );
}