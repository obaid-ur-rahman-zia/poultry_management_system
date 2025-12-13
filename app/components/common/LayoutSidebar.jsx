"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Context to share sidebar state with layout
const SidebarContext = createContext({
  isPinned: false,
  isExpanded: false,
});
import {
  LayoutDashboard,
  MapPin,
  Package,
  Users,
  UserCircle,
  Building2,
  TrendingUp,
  MessageSquareQuote,
  ShoppingCart,
  Wallet,
  Receipt,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Undo,
  Reply,
  Circle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Image from "next/image";
import { navigationItems } from "@/utils/links";
import MobileBottomNav from "./MobileBottomNav";

const Sidebar = ({ 
  isOpen, 
  toggleSidebar,
  isPinned,
  setIsPinned,
  isCollapsed,
  setIsCollapsed,
  isHovered,
  setIsHovered,
  handleMouseEnter,
  handleMouseLeave,
  isExpanded
}) => {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState({
    productOps: false,
    accountOps: false,
  });

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (!isPinned) {
      setIsCollapsed(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };


  const isActive = (href) => pathname === href;

  const SidebarLink = ({ item, isExpanded: expanded = isExpanded }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        onClick={() => {
          if (typeof window !== "undefined" && window.innerWidth < 1024) {
            toggleSidebar();
          }
        }}
        className={`
          relative flex items-center gap-3 ${
            expanded ? "px-2 py-2" : "px-2 py-2 justify-center"
          }
          rounded-md transition-all duration-200
          ${
            active
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }
          group-hover:translate-x-0.5
        `}
      >
        <Icon className="h-5 w-5 shrink-0" />

        {expanded && (
          <>
            <span className="flex-1 text-sm font-medium truncate">
              {item.title}
            </span>

            {active && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </>
        )}
      </Link>
    );

    if (!expanded) {
      return (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="group relative">{linkContent}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div className="group relative">{linkContent}</div>;
  };

  const GroupHeader = ({ item, sectionKey, isExpanded: expanded = isExpanded }) => {
    const Icon = item.icon;
    const sectionExpanded = expandedSections[sectionKey];

    const handleClick = () => {
      if (!expanded) {
        setIsCollapsed(false);
        setExpandedSections((prev) => ({
          ...prev,
          [sectionKey]: true,
        }));
      } else {
        toggleSection(sectionKey);
      }
    };

    const headerContent = (
      <button
        onClick={handleClick}
        className={`
          relative flex items-center gap-3 w-full ${
            expanded ? "px-2 py-2" : "px-2 py-2 justify-center"
          }
          rounded-md transition-all duration-200
          text-muted-foreground hover:bg-accent hover:text-accent-foreground
          group-hover:translate-x-0.5
        `}
      >
        <Icon className="h-5 w-5 shrink-0" />

        {expanded && (
          <>
            <span className="flex-1 text-sm font-medium truncate text-left">
              {item.title}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                sectionExpanded ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>
    );

    if (!expanded) {
      return (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="group relative">{headerContent}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div className="group relative">{headerContent}</div>;
  };

  return (
    <TooltipProvider>
      {/* Mobile Sidebar as Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={toggleSidebar}>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="px-4 py-4 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                  <Image
                    src={"/favicon.ico"}
                    height={200}
                    width={200}
                    className=""
                    alt="Logo"
                  />
                </div>
                <SheetTitle className="text-base font-bold">
                  Switch2itech
                </SheetTitle>
              </div>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {navigationItems.map((item) => {
                if (item.type === "single") {
                  return (
                    <SidebarLink
                      key={item.id}
                      item={item}
                      isExpanded={true}
                    />
                  );
                }

                if (item.type === "group") {
                  const sectionExpanded = expandedSections[item.id];
                  return (
                    <div key={item.id} className="space-y-1">
                      <GroupHeader item={item} sectionKey={item.id} isExpanded={true} />
                      {sectionExpanded && (
                        <div className="ml-4 space-y-1 border-l-2 border-border pl-2">
                          {item.children.map((child) => (
                            <SidebarLink
                              key={child.id}
                              item={child}
                              isExpanded={true}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          hidden lg:flex
          ${isPinned ? "lg:absolute" : "fixed"} top-0 left-0 h-screen 
          bg-primary border-r border-border shadow-lg
          transition-all duration-300 ease-in-out
          ${isExpanded ? "w-64" : "w-16"}
          ${!isPinned && isExpanded ? "z-50 shadow-2xl" : isPinned ? "z-10" : "z-50"}
          flex-col shrink-0
        `}
      >
        {/* Header */}
        <div
          className={`flex items-center ${
            isExpanded
              ? "justify-between px-4 py-4"
              : "justify-center px-2 py-4"
          } border-b border-border`}
        >
          {isExpanded && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                <Image
                  src={"/favicon.ico"}
                  height={200}
                  width={200}
                  className=""
                  alt="Logo"
                />
              </div>
              <h2 className="text-base font-bold text-background">
                Switch2itech
              </h2>
            </div>
          )}

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-1">
             {/* Pin/Unpin Button */}
             <Tooltip delayDuration={300}>
               <TooltipTrigger asChild>
                 <button
                   onClick={togglePin}
                   className={`h-8 w-8 items-center bg-accent justify-center rounded-md hover:bg-secondary hover:text-accent-foreground transition-colors flex ${
                     isPinned ? "bg-secondary text-accent-foreground" : ""
                   }`}
                 >
                   {isPinned ? (
                     <div className="relative h-4 w-4">
                       <Circle className="h-4 w-4 absolute" strokeWidth={2} />
                       <Circle className="h-2.5 w-2.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="currentColor" />
                     </div>
                   ) : (
                     <Circle className="h-4 w-4" strokeWidth={2} />
                   )}
                 </button>
               </TooltipTrigger>
               <TooltipContent side="right">
                 {isPinned ? "Unpin sidebar" : "Pin sidebar"}
               </TooltipContent>
             </Tooltip>

            {/* Collapse/Expand Button - Only show when pinned */}
            {/* {isPinned && (
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleCollapse}
                    className="h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                </TooltipContent>
              </Tooltip>
            )} */}
          </div>

          {/* Mobile Close */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 overflow-y-auto ${
            isExpanded ? "px-3 py-3" : "px-2 py-3"
          } space-y-1`}
        >
          {navigationItems.map((item) => {
            if (item.type === "single") {
              return <SidebarLink key={item.id} item={item} />;
            }

            if (item.type === "group") {
              const sectionExpanded = expandedSections[item.id];
              return (
                <div key={item.id} className="space-y-1">
                  <GroupHeader item={item} sectionKey={item.id} />
                  {isExpanded && sectionExpanded && (
                    <div className="ml-4 space-y-1 border-l-2 border-border pl-2">
                      {item.children.map((child) => (
                        <SidebarLink key={child.id} item={child} />
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
};

const LayoutSidebar = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (!isPinned) {
      setIsCollapsed(false);
    }
  };

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsHovered(true);
      setIsCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsHovered(false);
      setIsCollapsed(true);
    }
  };

  const isExpanded = isPinned || isHovered || !isCollapsed;

  return (
    <SidebarContext.Provider value={{ isPinned, isExpanded }}>
      <div className="h-screen w-full overflow-hidden relative flex bg-white">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-50 h-10 w-10 flex items-center justify-center bg-card rounded-lg shadow-lg border border-border hover:bg-accent transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Sidebar - Desktop as aside, Mobile as Sheet */}
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar}
          isPinned={isPinned}
          setIsPinned={setIsPinned}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          isExpanded={isExpanded}
        />

        {/* Content Area with mobile padding for bottom nav */}
        <div className="flex-1 lg:pb-0 pb-16">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
export default LayoutSidebar;
