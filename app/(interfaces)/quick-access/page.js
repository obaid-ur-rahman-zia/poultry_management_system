"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  Home,
  TrendingUp,
  FileText,
  ShoppingCart,
  Users,
  Package,
  Activity,
  Settings,
  DollarSign,
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Route configuration with icons and colors - matching actual Next.js routes
const routeConfig = {
  "/": { name: "Dashboard", icon: "Home", color: "bg-blue-500", keyword: "Dashboard" },
  "/account": { name: "Accounts", icon: "Users", color: "bg-green-500", keyword: "Accounts" },
  "/trading": { name: "Trading", icon: "TrendingUp", color: "bg-purple-500", keyword: "Trading" },
  "/reports": { name: "Reports", icon: "FileText", color: "bg-orange-500", keyword: "Reports" },
  "/add-unit": { name: "Add Unit", icon: "Package", color: "bg-indigo-500", keyword: "Units" },
  "/add-product": { name: "Add Product", icon: "ShoppingCart", color: "bg-pink-500", keyword: "Products" },
  "/floc-management": { name: "Floc Management", icon: "Activity", color: "bg-teal-500", keyword: "Flocs" },
  "/unit-income": { name: "Unit Income", icon: "DollarSign", color: "bg-green-600", keyword: "Income" },
  "/unit-expense": { name: "Unit Expense", icon: "DollarSign", color: "bg-red-600", keyword: "Expense" },
  "/self-transactions": { name: "Self Transactions", icon: "ArrowRight", color: "bg-blue-600", keyword: "Self" },
  "/opposite-transactions": { name: "Opposite Transactions", icon: "ArrowLeftRight", color: "bg-purple-600", keyword: "Opposite" },
};

// Default icon for unknown routes
const DefaultIcon = Settings;

// Icon mapping
const iconMap = {
  Home,
  Users,
  TrendingUp,
  FileText,
  ShoppingCart,
  Package,
  Activity,
  DollarSign,
  ArrowRight,
  ArrowLeftRight,
  Settings: DefaultIcon,
};

export default function QuickAccessPage() {
  const router = useRouter();
  const [recentRoutes, setRecentRoutes] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handleResize = () => setIsMobile(mq.matches);
    handleResize();
    mq.addEventListener("change", handleResize);

    // Load recent routes from localStorage
    const loadRoutes = () => {
      const stored = localStorage.getItem("recentRoutes");
      if (stored) {
        try {
          const routes = JSON.parse(stored);
          // Filter out quick-access route itself
          const filtered = routes.filter((r) => !r.path.includes("/quick-access"));
          setRecentRoutes(filtered);
        } catch (e) {
          console.error("Error parsing recent routes:", e);
          setRecentRoutes([]);
        }
      }
    };

    loadRoutes();
    // Refresh routes periodically to catch updates from RouteTracker
    const interval = setInterval(loadRoutes, 1000);
    return () => {
      clearInterval(interval);
      mq.removeEventListener("change", handleResize);
    };
  }, []);

  const handleRouteClick = (route) => {
    router.push(route.path);
  };

  const handleRemoveRoute = (e, index) => {
    e.stopPropagation();
    const updated = recentRoutes.filter((_, i) => i !== index);
    setRecentRoutes(updated);
    localStorage.setItem("recentRoutes", JSON.stringify(updated));
  };

  const clearAllRoutes = () => {
    setRecentRoutes([]);
    localStorage.removeItem("recentRoutes");
  };

  // Calculate positions for petal-like layout (6 segments)
  const calculatePetalPosition = (index, total) => {
    if (total === 0) return { x: 0, y: 0, angle: 0 };
    
    // Always use 6 positions for the petal structure
    const positions = 6;
    const angle = (2 * Math.PI * index) / positions - Math.PI / 2; // Start from top
    const radius = 110; // Keep the route cluster compact and near the top
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return { x, y, angle };
  };

  const centerX = 200;
  const centerY = 165;

  return (
    <div className="min-h-screen overflow-hidden flex flex-col bg-background">
      {/* Compact Header */}
      <div className="flex-shrink-0 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold  flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              Quick Access
            </h1>
            <p className="text-xs mt-0.5">
              Your recently accessed routes
            </p>
          </div>
          {recentRoutes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllRoutes}
              className="gap-2 h-8 text-xs"
            >
              <X className="w-3 h-3" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 pb-4 overflow-hidden">
        {isMobile ? (
          <div className="space-y-3">
            {recentRoutes.length === 0 ? (
              <Card>
                <CardContent className="py-6 flex flex-col items-center gap-2">
                  <Home className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No Recent Routes</p>
                  <p className="text-xs text-muted-foreground">Navigate to pages to see them here</p>
                </CardContent>
              </Card>
            ) : (
              recentRoutes.map((route, index) => {
                const IconComponent = iconMap[route.icon] || DefaultIcon;
                const config = routeConfig[route.path] || {};
                return (
                  <Card
                    key={`${route.path}-${route.timestamp}-${index}`}
                    className="border border-muted"
                  >
                    <button
                      onClick={() => handleRouteClick(route)}
                      className="w-full text-left"
                    >
                      <CardContent className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-semibold", config.color || "bg-slate-500")}>
                            <IconComponent className="w-5 h-5" />
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{config.name || route.path}</span>
                            <span className="text-xs text-muted-foreground">{route.keyword || config.keyword || ""}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleRemoveRoute(e, index)}
                          className="h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </button>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Left Side - Petal View */}
        <div className="col-span-12 lg:col-span-7 flex items-center justify-center">
          <Card className="w-full h-full border-slate-700 backdrop-blur shadow-2xl">
            <CardContent className="p-4 h-full flex items-center justify-center">
              {recentRoutes.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center border-2 border-slate-600">
                    <Home className="w-10 h-10 text-gray-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-300">
                      No Recent Routes
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Navigate to pages to see them here
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full" style={{ maxHeight: "400px" }}>
                  {/* Center circle */}
                  <div
                    className="absolute rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl flex items-center justify-center z-10 transition-all duration-300 hover:scale-105 border-2 border-white/30"
                    style={{
                      width: "100px",
                      height: "100px",
                      left: `${centerX + 125}px`,
                      top: `${centerY - 50}px`,
                    }}
                  >
                    <div className="text-center text-white">
                      <div className="text-2xl font-bold">
                        {recentRoutes.length}
                      </div>
                      <div className="text-[10px] font-medium">Routes</div>
                    </div>
                  </div>

                  {/* Petal segments */}
                  {recentRoutes.slice(0, 6).map((route, index) => {
                    const position = calculatePetalPosition(index, recentRoutes.length);
                    const x = centerX + position.x;
                    const y = centerY + position.y;
                    const isHovered = hoveredIndex === index;

                    const IconComponent = iconMap[route.icon] || DefaultIcon;

                    return (
                      <div
                        key={`${route.path}-${route.timestamp}`}
                        className="absolute transition-all duration-500 ease-out z-20"
                        style={{
                          left: `${x + 100}px`,
                          top: `${y - 50}px`,
                          transform: isHovered ? "scale(1.1)" : "scale(1)",
                        }}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Petal shape - more compact */}
                        <div
                          className={cn(
                            "relative w-40 h-28 rounded-xl shadow-xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center group overflow-hidden",
                            route.color,
                            "hover:shadow-2xl hover:ring-2 hover:ring-white/60"
                          )}
                          style={{
                            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                          }}
                          onClick={() => handleRouteClick(route)}
                        >
                          {/* Background gradient overlay */}
                          <div className="absolute inset-0" />
                          
                          {/* Icon */}
                          <div className="relative z-10 mb-1">
                            <IconComponent className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                          </div>

                          {/* Route name */}
                          <div className="relative z-10 text-center px-2">
                            <div className="text-white font-bold text-xs mb-0.5 leading-tight">
                              {route.name}
                            </div>
                            <div className="text-white/70 text-[10px] font-medium">
                              {route.keyword}
                            </div>
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={(e) => handleRemoveRoute(e, index)}
                            className="absolute top-5 right-5 w-5 h-5 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-md z-30"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {/* Pulse animation */}
                          <div
                            className={cn(
                              "absolute inset-0 rounded-xl animate-ping opacity-15",
                              route.color
                            )}
                            style={{
                              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                            }}
                          />
                        </div>

                        {/* Connection line to center */}
                        <svg
                          className="absolute pointer-events-none z-0"
                          style={{
                            left: `${80}px`,
                            top: `${50}px`,
                            width: `${Math.abs(position.x)}px`,
                            height: `${Math.abs(position.y)}px`,
                            transform: `rotate(${(position.angle * 180) / Math.PI}deg)`,
                            transformOrigin: "0 0",
                            backgroundColor: "rgba(255, 255, 255, 0.15)",
                          }}
                        >
                          <line
                            x1="0"
                            y1="0"
                            x2={Math.sqrt(position.x * position.x + position.y * position.y)}
                            y2="0"
                            stroke="rgba(255, 255, 255, 1)"
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                            className={cn(
                              "transition-opacity duration-300",
                              isHovered ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Quick Links */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 overflow-hidden">
          <Card className="flex-1 border-slate-700 shadow-2xl overflow-hidden">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h2 className="text-sm font-semibold    ">Quick Links</h2>
                <div className="text-xs">
                  {Object.keys(routeConfig).length} routes
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(routeConfig).map(([path, config]) => {
                    const IconComponent = iconMap[config.icon] || DefaultIcon;
                    const isRecent = recentRoutes.some((r) => r.path === path);
                    return (
                      <Button
                        key={path}
                        variant="outline"
                        className={cn(
                          "flex flex-col items-center gap-1.5 h-auto py-2.5 hover:shadow-lg transition-all  hover:bg-slate-700 hover:text-white relative",
                          isRecent && "ring-1 ring-blue-400/50"
                        )}
                        onClick={() => router.push(path)}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-md",
                            config.color
                          )}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] text-center leading-tight font-medium">
                          {config.name}
                        </span>
                        {isRecent && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Routes List - Compact */}
          {recentRoutes.length > 0 && (
            <Card className="border-slate-700   backdrop-blur shadow-2xl">
              <CardContent className="p-3">
                <h3 className="text-xs font-semibold mb-2">Recent Activity</h3>
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {recentRoutes.slice(0, 4).map((route, index) => {
                    const IconComponent = iconMap[route.icon] || DefaultIcon;
                    const timeAgo = getTimeAgo(route.timestamp);

                    return (
                      <div
                        key={`${route.path}-${route.timestamp}`}
                        className="group flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-700/50 transition-all duration-150 cursor-pointer"
                        onClick={() => handleRouteClick(route)}
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center text-white shadow-sm flex-shrink-0",
                            route.color
                          )}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium  truncate">
                            {route.name}
                          </div>
                          <div className="text-[10px] text-gray-800">{timeAgo}</div>
                        </div>
                        <button
                          onClick={(e) => handleRemoveRoute(e, index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-500/20 rounded flex-shrink-0"
                        >
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
        )}

        {/* Custom Scrollbar Styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(51, 65, 85, 0.3);
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.5);
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.7);
          }
        `}</style>
      </div>
    </div>
  );
}

// Helper function to get time ago
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
