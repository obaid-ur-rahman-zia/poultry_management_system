"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLine,
  Grid3x2,
  Wallet,
  Package,
  Building2,
  Scale,
  FileText,
  ShoppingCart,
  Users,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { navigationItems } from "@/utils/links";

const MobileBottomNav = () => {
  const pathname = usePathname();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [groupSheetOpen, setGroupSheetOpen] = useState(null);

  // Get single items (non-group items) for main navbar
  const singleItems = navigationItems.filter((item) => item.type === "single");
  
  // Get group items for "More" sheet
  const groupItems = navigationItems.filter((item) => item.type === "group");

  // Show first 4 single items in bottom nav, rest in "More" sheet
  const mainNavItems = singleItems.slice(0, 4);
  const moreNavItems = singleItems.slice(4);

  const isActive = (href) => pathname === href;

  const NavItem = ({ item, onClick }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`
          relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg
          transition-colors min-w-[60px]
          ${active
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }
        `}
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs font-medium truncate w-full text-center">
          {item.title}
        </span>
        {active && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-primary" />
        )}
      </Link>
    );
  };

  const GroupSheet = ({ groupItem, isOpen, onOpenChange }) => {
    if (!groupItem) return null;

    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <groupItem.icon className="h-5 w-5" />
              {groupItem.title}
            </SheetTitle>
            <SheetDescription>
              Select an option from {groupItem.title}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {groupItem.children.map((child) => {
              const active = isActive(child.href);
              const Icon = child.icon;
              return (
                <Link
                  key={child.id}
                  href={child.href}
                  onClick={() => onOpenChange(false)}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg transition-colors
                    ${active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{child.title}</span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
          {/* Main Navigation Items */}
          {mainNavItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              onClick={() => {
                // Close any open sheets when navigating
                setMoreSheetOpen(false);
                setGroupSheetOpen(null);
              }}
            />
          ))}

          {/* More Button - Opens sheet with remaining items and groups */}
          <button
            onClick={() => setMoreSheetOpen(true)}
            className={`
              flex flex-col items-center justify-center gap-1 p-2 rounded-lg
              transition-colors min-w-[60px]
              ${moreSheetOpen
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }
            `}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Options Sheet */}
      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>More Options</SheetTitle>
            <SheetDescription>
              Browse all available options and groups
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 overflow-y-auto pb-20">
            {/* Remaining Single Items */}
            {moreNavItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
                  Quick Access
                </h3>
                <div className="space-y-1">
                  {moreNavItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMoreSheetOpen(false)}
                        className={`
                          flex items-center gap-3 p-4 rounded-lg transition-colors
                          ${active
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                          }
                        `}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Group Items */}
            {groupItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
                  Groups
                </h3>
                <div className="space-y-1">
                  {groupItems.map((groupItem) => {
                    const Icon = groupItem.icon;
                    return (
                      <button
                        key={groupItem.id}
                        onClick={() => {
                          setMoreSheetOpen(false);
                          setGroupSheetOpen(groupItem.id);
                        }}
                        className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{groupItem.title}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Group Options Sheets */}
      {groupItems.map((groupItem) => (
        <GroupSheet
          key={groupItem.id}
          groupItem={groupItem}
          isOpen={groupSheetOpen === groupItem.id}
          onOpenChange={(open) => setGroupSheetOpen(open ? groupItem.id : null)}
        />
      ))}
    </>
  );
};

export default MobileBottomNav;

