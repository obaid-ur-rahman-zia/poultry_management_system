"use client";

import LayoutSidebar, { useSidebar } from "@/app/components/common/LayoutSidebar";
import BreadcrumbNav from "@/app/components/breadCrumb/breadCrumb";
import Header from "../components/Header/Header";
import RouteTracker from "@/app/components/common/RouteTracker";

export default function InterfaceLayout({ children }) {
    return (
        <LayoutSidebar>
            <RouteTracker />
            <ContentArea>{children}</ContentArea>
        </LayoutSidebar>
    );
}

const ContentArea = ({ children }) => {
    const { isPinned, isExpanded } = useSidebar();
    
    // When pinned, adjust margin based on sidebar width
    // When unpinned, always use ml-16 (content doesn't move, sidebar overlays)
    // When pinned, sidebar is relative and takes space, so content needs margin to not go behind
    const marginClass = isPinned 
        ? (isExpanded ? "ml-64" : "ml-16")
        : "ml-16";

    return (
        <main className={`overflow-y-auto flex-1 ${marginClass} transition-all duration-300 h-screen`}>
            <Header />
            {/* <BreadcrumbNav /> */}
            {children}
        </main>
    );
}
