"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
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
    const pathname = usePathname();
    
    // When pinned, adjust margin based on sidebar width
    // When unpinned, always use ml-16 (content doesn't move, sidebar overlays)
    // When pinned, sidebar is relative and takes space, so content needs margin to not go behind
    // On mobile, no margin needed as sidebar is hidden
    const marginClass = isPinned 
        ? (isExpanded ? "lg:ml-64" : "lg:ml-16")
        : "lg:ml-16";

    return (
        <main className={`overflow-y-auto overflow-x-hidden flex-1 ${marginClass} transition-all duration-300 h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-20 lg:pb-0`}>
            <Header />
            {/* <BreadcrumbNav /> */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                    className="w-full px-2 sm:px-4 md:px-6 lg:px-8"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </main>
    );
}
