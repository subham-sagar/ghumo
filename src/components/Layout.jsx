import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './custom/Header';
import { Toaster } from 'sonner';

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main>
        <Outlet />
      </main>
      
      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}

export default Layout;
