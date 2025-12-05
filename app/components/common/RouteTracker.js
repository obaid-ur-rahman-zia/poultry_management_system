"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Route configuration
const routeConfig = {
  "/interfaces": { name: "Dashboard", icon: "Home", color: "bg-blue-500", keyword: "Dashboard" },
  "/interfaces/account": { name: "Accounts", icon: "Users", color: "bg-green-500", keyword: "Accounts" },
  "/interfaces/trading": { name: "Trading", icon: "TrendingUp", color: "bg-purple-500", keyword: "Trading" },
  "/interfaces/reports": { name: "Reports", icon: "FileText", color: "bg-orange-500", keyword: "Reports" },
  "/interfaces/add-unit": { name: "Add Unit", icon: "Package", color: "bg-indigo-500", keyword: "Units" },
  "/interfaces/add-product": { name: "Add Product", icon: "ShoppingCart", color: "bg-pink-500", keyword: "Products" },
  "/interfaces/floc-management": { name: "Floc Management", icon: "Activity", color: "bg-teal-500", keyword: "Flocs" },
  "/interfaces/unit-income": { name: "Unit Income", icon: "DollarSign", color: "bg-green-600", keyword: "Income" },
  "/interfaces/unit-expense": { name: "Unit Expense", icon: "DollarSign", color: "bg-red-600", keyword: "Expense" },
  "/interfaces/self-transactions": { name: "Self Transactions", icon: "ArrowRight", color: "bg-blue-600", keyword: "Self" },
  "/interfaces/opposite-transactions": { name: "Opposite Transactions", icon: "ArrowLeftRight", color: "bg-purple-600", keyword: "Opposite" },
};

export default function RouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track quick-access route itself
    if (pathname && !pathname.includes("/quick-access")) {
      const routeInfo = routeConfig[pathname] || {
        name: pathname.split("/").pop() || "Unknown",
        icon: "Settings",
        color: "bg-gray-500",
        keyword: "Route",
      };

      const newRoute = {
        path: pathname,
        name: routeInfo.name,
        icon: routeInfo.icon,
        color: routeInfo.color,
        keyword: routeInfo.keyword,
        timestamp: Date.now(),
      };

      // Get existing routes
      const stored = localStorage.getItem("recentRoutes");
      let routes = [];
      if (stored) {
        try {
          routes = JSON.parse(stored);
        } catch (e) {
          routes = [];
        }
      }

      // Remove duplicates and keep only last 6 routes
      const filtered = routes.filter((r) => r.path !== pathname);
      const updated = [newRoute, ...filtered].slice(0, 6);
      localStorage.setItem("recentRoutes", JSON.stringify(updated));
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}

