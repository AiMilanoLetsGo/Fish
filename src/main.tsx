import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import App from "./App";
import Dashboard from "./views/Dashboard";
import ReceiptScanner from "./components/ReceiptScanner";
import { seedDatabase } from "./db";

function InventoryView() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Inventory</h2>
      <p className="mt-2 text-sm text-slate-500">
        Use the receipt scanner or recipes to update inventory in real time.
      </p>
    </div>
  );
}

function ReportsView() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
      <p className="mt-2 text-sm text-slate-500">
        Export GST/HST-ready reports and HACCP logs for compliance audits.
      </p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "inventory", element: <InventoryView /> },
      { path: "scanner", element: <ReceiptScanner /> },
      { path: "reports", element: <ReportsView /> },
    ],
  },
]);

seedDatabase();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
