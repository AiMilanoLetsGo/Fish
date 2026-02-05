import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, Package, ScanLine, FileText } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/scanner", label: "Receipt Scanner", icon: ScanLine },
  { to: "/reports", label: "Reports", icon: FileText },
];

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white px-5 py-6">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">SmartStock Enterprise</h1>
          <p className="text-xs text-slate-500">Canadian Edition</p>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
