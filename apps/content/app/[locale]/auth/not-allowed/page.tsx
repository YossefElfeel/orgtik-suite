"use client";
import React from "react";

function NotAllowed() {
  return (
    <div className="flex items-center justify-center h-screen w-screen gap-12">
      {/* Debug: JSON.stringify({ scopes: user?.scopes, dashboardRoles: getDashboardRoles(user), scopeNames: getScopeNames(user?.scopes) }, null, 2) */}
      <div className="flex flex-col gap-4 items-center justify-center">
        <h1 className="text-6xl font-bold text-red-500">Not Allowed</h1>
        <p className="text-gray-500">You are not allowed to access this page</p>
      </div>
    </div>
  );
}

export default NotAllowed;
