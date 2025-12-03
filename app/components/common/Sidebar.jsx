"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AreaPic from "@/assets/home/Area.png";
import MateralPic from "@/assets/home/material.png";
import SalesmanPic from "@/assets/home/salesman.png";
import CustomerPic from "@/assets/home/customer.png";
import SupplierPic from "@/assets/home/supplier.png";
import SalesPic from "@/assets/home/sales.png";
import PurchasePic from "@/assets/home/purchase.png";
import AccountPic from "@/assets/home/account.png";
import ReportsPic from "@/assets/home/report.png";
import QuotationPic from "@/assets/home/quotation.png";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navigationItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      href: "/",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      gradient: "from-slate-500 to-gray-400",
      bgGradient: "from-slate-50 to-gray-50",
    },
    {
      id: "area",
      title: "Area",
      image: AreaPic,
      href: "/area",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      gradient: "from-blue-500 to-cyan-400",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      id: "product",
      title: "Product",
      image: MateralPic,
      href: "/product",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      gradient: "from-emerald-500 to-teal-400",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      id: "employee",
      title: "Employee",
      image: SalesmanPic,
      href: "/employee",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-400",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      id: "customer",
      title: "Customer",
      image: CustomerPic,
      href: "/customer",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
      gradient: "from-orange-500 to-red-400",
      bgGradient: "from-orange-50 to-red-50",
    },
    {
      id: "supplier",
      title: "Supplier",
      image: SupplierPic,
      href: "/supplier",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6"
          />
        </svg>
      ),
      gradient: "from-indigo-500 to-purple-400",
      bgGradient: "from-indigo-50 to-purple-50",
    },
    {
      id: "quotation",
      title: "Quotations",
      image: QuotationPic,
      href: "/quotation",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      gradient: "from-pink-500 to-rose-400",
      bgGradient: "from-pink-50 to-rose-50",
    },
    {
      id: "sales",
      title: "Sales",
      image: SalesPic,
      href: "/sales",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      gradient: "from-pink-500 to-rose-400",
      bgGradient: "from-pink-50 to-rose-50",
    },
    {
      id: "purchase",
      title: "Purchase",
      image: PurchasePic,
      href: "/purchase",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13a2 2 0 100 4 2 2 0 000-4zM9 13a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
      ),
      gradient: "from-pink-500 to-green-400",
      bgGradient: "from-pink-50 to-green-50",
    },
    {
      id: "account",
      title: "Account",
      image: AccountPic,
      href: "/account",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      gradient: "from-pink-500 to-green-400",
      bgGradient: "from-pink-50 to-green-50",
    },
    {
      id: "voucher",
      title: "Voucher",
      image: AccountPic,
      href: "/voucher",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M9 4L6 2L3 4V19C3 20.6569 4.34315 22 6 22H20C21.6569 22 23 20.6569 23 19V16H21V4L18 2L15 4L12 2L9 4ZM19 16H7V19C7 19.5523 6.55228 20 6 20C5.44772 20 5 19.5523 5 19V5.07037L6 4.4037L9 6.4037L12 4.4037L15 6.4037L18 4.4037L19 5.07037V16ZM20 20H8.82929C8.93985 19.6872 9 19.3506 9 19V18H21V19C21 19.5523 20.5523 20 20 20Z"></path>
        </svg>
      ),
      gradient: "from-yellow-500 to-blue-400",
      bgGradient: "from-yellow-50 to-blue-50",
    },
    {
      id: "reports",
      title: "Reports",
      image: ReportsPic,
      href: "/reports",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M9 4L6 2L3 4V19C3 20.6569 4.34315 22 6 22H20C21.6569 22 23 20.6569 23 19V16H21V4L18 2L15 4L12 2L9 4ZM19 16H7V19C7 19.5523 6.55228 20 6 20C5.44772 20 5 19.5523 5 19V5.07037L6 4.4037L9 6.4037L12 4.4037L15 6.4037L18 4.4037L19 5.07037V16ZM20 20H8.82929C8.93985 19.6872 9 19.3506 9 19V18H21V19C21 19.5523 20.5523 20 20 20Z"></path>
        </svg>
      ),
      gradient: "from-green-500 to-yellow-400",
      bgGradient: "from-green-50 to-yellow-50",
    },
  ];

  if (!mounted) return null;

  const isActive = (href) => {
    return pathname === href;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        z-50 h-screen bg-white/95 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl
        transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "w-16" : "w-72"}
        flex flex-col
      `}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between ${
            isCollapsed ? "p-2" : "p-4"
          } border-b border-slate-200/50`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Switch2itech
                </h2>
              </div>
            </div>
          )}

          {/* Toggle collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
          >
            <svg
              className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Close button for mobile */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
          >
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 overflow-y-auto ${
            isCollapsed ? "p-1" : "p-2"
          } space-y-1`}
        >
          {navigationItems.map((item) => {
            const active = isActive(item.href);

            return (
              <div key={item.id} className="group relative">
                {/* Active indicator */}
                {active && (
                  <div
                    className={`absolute left-0 z-10 top-0 bottom-0 w-1 bg-gradient-to-b ${item.gradient} rounded-r-full`}
                  />
                )}

                <Link
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                  className={`
                    relative flex items-center gap-3 ${
                      isCollapsed ? "px-2 py-3 justify-center" : "px-3 py-2"
                    } 
                    rounded-lg transition-all duration-300
                    ${
                      active
                        ? `bg-gradient-to-r ${item.bgGradient} border border-slate-200/50 shadow-sm`
                        : "hover:bg-slate-50 hover:shadow-sm"
                    }
                    group-hover:transform ${
                      isCollapsed
                        ? "group-hover:scale-110"
                        : "group-hover:translate-x-1"
                    }
                  `}
                  title={isCollapsed ? item.title : ""}
                >
                  {/* Icon Container */}
                  <div
                    className={`
                    relative flex items-center justify-center ${
                      isCollapsed ? "w-8 h-8" : "w-8 h-8"
                    } 
                    rounded-lg transition-all duration-300
                    ${
                      active
                        ? `bg-gradient-to-br ${item.bgGradient} shadow-sm`
                        : "bg-slate-100 group-hover:bg-slate-200"
                    }
                  `}
                  >
                    <div
                      className={`${
                        active ? `text-slate-700` : "text-slate-600"
                      }`}
                    >
                      {item.icon}
                    </div>
                  </div>

                  {/* Title - only show when not collapsed */}
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`
                        font-medium transition-colors duration-200 truncate
                        ${
                          active
                            ? "text-slate-900"
                            : "text-slate-700 group-hover:text-slate-900"
                        }
                      `}
                      >
                        {item.title}
                      </h3>
                    </div>
                  )}

                  {/* Active indicator dot */}
                  {active && !isCollapsed && (
                    <div
                      className={`w-2 h-2 bg-gradient-to-r ${item.gradient} rounded-full animate-pulse`}
                    />
                  )}

                  {/* Hover Effect */}
                  <div
                    className={`
                    absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 
                    transition-opacity duration-500 rounded-lg pointer-events-none
                  `}
                  />
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
