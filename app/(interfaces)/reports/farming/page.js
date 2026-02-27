"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Receipt,
  TrendingUp,
  LineChart,
  Sparkles,
  LayoutGrid,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const reportCategories = [
  {
    id: "expense-reports",
    title: "Unit Expense Reports",
    href: "/reports/expenseReports",
    icon: Receipt,
  },
  {
    id: "income-reports",
    title: "Unit Income Reports",
    href: "/reports/incomeReports",
    icon: TrendingUp,
  },
  {
    id: "trade-reports",
    title: "Trading Reports",
    href: "/reports/tradeReports",
    icon: LineChart,
  },
];

const colorMap = {
  "expense-reports": "bg-rose-500",
  "income-reports": "bg-emerald-500",
  "trade-reports": "bg-orange-500",
};

export default function FarmingReportsPage() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const calculatePetalPosition = (index, total) => {
    if (total === 0) return { x: 0, y: 0, angle: 0 };
    let startAngle = -Math.PI / 2; // Top
    if (total === 2) startAngle = Math.PI; // L/R
    const angle = (2 * Math.PI * index) / total + startAngle;
    const radius = 220;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y, angle };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10 px-4 flex flex-col items-center overflow-x-hidden">
      <div className="max-w-5xl w-full mx-auto mb-5 flex items-center justify-center relative">
        <Link href="/reports" className="absolute left-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shadow-sm bg-white hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-500" />
            Farming Reports
          </h1>
          <p className="text-gray-500 text-sm">
            Select a category to view reports
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-4xl h-[600px] flex items-center justify-center mx-auto ">
        {/* Center circle */}
        <div
          className="absolute z-10 flex items-center justify-center bg-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100"
          style={{ width: "120px", height: "120px" }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/10 animate-pulse" />
          <div className="text-center text-blue-600 relative z-10">
            <LayoutGrid className="w-10 h-10 mx-auto mb-1" />
            <div className="text-xs font-bold uppercase tracking-wider">
              Farming
            </div>
          </div>
        </div>

        {/* Lines */}
        {reportCategories.map((category, index) => {
          const position = calculatePetalPosition(
            index,
            reportCategories.length,
          );
          const isHovered = hoveredIndex === index;
          return (
            <svg
              key={`line-${category.id}`}
              className="absolute pointer-events-none z-0 overflow-visible"
              style={{ left: "50%", top: "50%" }}
            >
              <line
                x1="0"
                y1="0"
                x2={position.x}
                y2={position.y}
                stroke={isHovered ? "#94a3b8" : "#cbd5e1"}
                strokeWidth={isHovered ? "4" : "2"}
                strokeDasharray="6,6"
                className="transition-all duration-300"
              />
            </svg>
          );
        })}

        {/* Petal segments */}
        {reportCategories.map((category, index) => {
          const position = calculatePetalPosition(
            index,
            reportCategories.length,
          );
          const isHovered = hoveredIndex === index;
          const Icon = category.icon;
          const colorClass = colorMap[category.id] || "bg-blue-500";

          return (
            <div
              key={category.id}
              className="absolute z-20 transition-all duration-500 ease-out"
              style={{
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${isHovered ? 1.1 : 1})`,
                left: "50%",
                top: "50%",
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Link href={category.href}>
                <div
                  className={cn(
                    "relative w-48 h-32 rounded-2xl shadow-xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center group overflow-hidden",
                    colorClass,
                    isHovered ? "shadow-2xl ring-4 ring-white/50" : "",
                  )}
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />

                  <div className="relative z-10 mb-2">
                    <Icon className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                  </div>

                  <div className="relative z-10 text-center px-3">
                    <div className="text-white font-bold text-sm mb-1 leading-tight drop-shadow-md">
                      {category.title}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl animate-ping opacity-15 bg-white",
                    )}
                    style={{
                      clipPath:
                        "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    }}
                  />
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
