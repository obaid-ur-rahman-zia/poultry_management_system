"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function MobileListToggle({ title = "List", children }) {
    const [open, setOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const updateMatch = () => {
            const matches = window.matchMedia("(min-width: 768px)").matches;
            setIsDesktop(matches);
            setOpen(matches); // keep open on desktop, closed on mobile by default
        };

        updateMatch();
        window.addEventListener("resize", updateMatch);
        return () => window.removeEventListener("resize", updateMatch);
    }, []);

    const handleOpen = () => setOpen(true);

    return (
        <div className="space-y-3">
            {!isDesktop && (
                <div className="flex">
                    <Button variant="outline" size="sm" onClick={handleOpen}>
                        {`Show ${title}`}
                    </Button>
                </div>
            )}

            {isDesktop ? (
                <div className="w-full overflow-hidden">{children}</div>
            ) : (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent
                        side="bottom"
                        className="h-[100vh] max-h-screen p-3 pt-4 overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold">{title}</p>
                            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                                Close
                            </Button>
                        </div>
                        {children}
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
}

