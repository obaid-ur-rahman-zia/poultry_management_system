"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronRight } from "lucide-react";

const routeNames = {
  area: "Area Management",
  product: "Product Management",
  employee: "Employee Management",
  customer: "Customer Management",
  supplier: "Supplier Management",
  sales: "Sales Management",
  purchase: "Purchase Management",
  account: "Accounts",
  voucher: "Voucher Management",
  quotation: "Quotation Management",
  reports: "Reports",
  trading: "Trading",
  "unit-income": "Unit Income",
  "unit-expense": "Unit Expense",
  "self-transactions": "Self Transactions",
  "opposite-transactions": "Opposite Transactions",
  "floc-management": "Floc Management",
  "quick-access": "Quick Access",
};

export default function BreadcrumbNav() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);

    // Home is always the first item
    const breadcrumbs = [
      {
        label: "Dashboard",
        href: "/",
        icon: <Home className="h-4 w-4" />,
      },
    ];

    // Add subsequent paths
    let currentPath = "";
    paths.forEach((path) => {
      currentPath += `/${path}`;
      breadcrumbs.push({
        label: routeNames[path] || path.charAt(0).toUpperCase() + path.slice(1),
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Show simple breadcrumb on home page
  if (breadcrumbs.length === 1) {
    return (
      <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Dashboard</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    );
  }

  return (
    <div className="bg-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 overflow-x-auto">
      <Breadcrumb>
        <BreadcrumbList className="min-w-max">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem className="flex-shrink-0">
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                      {index === 0 && crumb.icon && (
                        <span className="flex-shrink-0">{crumb.icon}</span>
                      )}
                      <span className="truncate max-w-[150px] sm:max-w-none">
                        {crumb.label}
                      </span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={crumb.href}
                        className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base hover:text-primary transition-colors"
                      >
                        {index === 0 && crumb.icon && (
                          <span className="flex-shrink-0">{crumb.icon}</span>
                        )}
                        <span className="truncate max-w-[120px] sm:max-w-none">
                          {crumb.label}
                        </span>
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator className="flex-shrink-0">
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
