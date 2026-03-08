import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import IdleProvider from "../security/IdleProvider";
import loginBg from "../images/ExpenseManagement_BGOnly2.png";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-cover bg-center bg-no-repeat text-slate-900"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px]" />

      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        <IdleProvider>
          <div className="relative flex flex-1 min-h-0 overflow-hidden">
            <Sidebar
              isOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              closeSidebar={closeSidebar}
            />

            <main className="min-w-0 flex-1 overflow-hidden pt-24">
              <div className="h-full overflow-y-auto overflow-x-hidden">
                <div className="mx-auto w-full max-w-[1700px] px-4 pb-8 md:px-6 lg:px-8">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </IdleProvider>
      </div>
    </div>
  );
};

export default Layout;