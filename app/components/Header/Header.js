"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    Search,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Sun,
    Moon,
    Monitor,
    User,
    Calendar as CalendarIcon,
    MessageSquare,
    Grid3x3,
    Ticket,
    Headphones,
    Gift,
    ExternalLink,
    Filter,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
// import LanguageSwitcher from "@/components/LanguageSwitcher";

import { useTheme } from "next-themes";
import Image from "next/image";
import { SITE } from "@/lib/constants";
import { signOut, useSession } from "next-auth/react";
import { User as NextAuthUser } from "next-auth";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import BreadcrumbNav from "../breadCrumb/breadCrumb";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";


const Header = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [notifications] = useState(3); // Mock notification count
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [supportOpen, setSupportOpen] = useState(false);
    const [referOpen, setReferOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // useEffect(() => {
    //     setMounted(true);
    //     // Mark as initialized after first render
    // }, []);

    const cycleTheme = () => {
        if (theme === "light") {
            setTheme("dark");
        } else if (theme === "dark") {
            setTheme("system");
        } else {
            setTheme("light");
        }
    };

    const getThemeIcon = () => {
        if (!mounted) return <Sun className="w-5 h-5" />;

        if (theme === "light") {
            return <Sun className="w-5 h-5" />;
        } else if (theme === "dark") {
            return <Moon className="w-5 h-5" />;
        } else {
            return <Monitor className="w-5 h-5" />;
        }
    };

    const router = useRouter()

    const { data: session } = useSession();

    const user = session?.user; // user

    // Refer & Save form state
    const [referForm, setReferForm] = useState({
        name: "",
        email: "",
        phone: "",
        dealershipName: "",
    });

    const handleReferSubmit = () => {
        // Handle refer form submission
        console.log("Refer form submitted:", referForm);
        // Add your API call here
        setReferOpen(false);
        setReferForm({ name: "", email: "", phone: "", dealershipName: "" });
    };

    const handleCalendarNavigation = (direction) => {
        if (direction === "prev") {
            setCurrentMonth(subMonths(currentMonth, 1));
        } else if (direction === "next") {
            setCurrentMonth(addMonths(currentMonth, 1));
        } else if (direction === "today") {
            const today = new Date();
            setCurrentMonth(today);
            setSelectedDate(today);
        }
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const dateRange = `${format(monthStart, "MMM dd, yyyy")} - ${format(monthEnd, "MMM dd, yyyy")}`;

    return (
        <header className="sticky top-0 z-20 w-full bg-card border-b border-muted">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                {/* Left Section - Logo & Navigation */}
                <div className="flex items-center gap-4 md:gap-6">
                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 ">
                            <SheetHeader>
                                {/* <SheetTitle>Menu</SheetTitle> */}
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                                            <Image
                                                src={SITE.LOGO}
                                                alt="Logo"
                                                width={20}
                                                height={20}
                                                className="object-contain"
                                            />
                                        </div>
                                        <span className="font-bold text-base bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                            {SITE.COMPANY.NAME}
                                        </span>
                                    </div>
                                </div>
                            </SheetHeader>
                            {/* <nav className="flex flex-col gap-3 mt-6">
                                    <Button variant="ghost" className="justify-start">
                                    Dashboard
                                    </Button>
                                    <Button variant="ghost" className="justify-start">
                                    Projects
                                    </Button>
                                    <Button variant="ghost" className="justify-start">
                                    Team
                                    </Button>
                                    <Button variant="ghost" className="justify-start">
                                    Reports
                                    </Button>
                                </nav> */}
                            <SheetFooter>
                                <TooltipProvider>
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={cycleTheme}
                                                    className="h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors"
                                                >
                                                    {getThemeIcon()}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Toggle Theme</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TooltipProvider>
                                <div className="px-4">

                                    {/* <LanguageSwitcher /> */}
                                </div>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                    <div className="hidden md:block">
                        <BreadcrumbNav />
                    </div>

                    {/* Left Side Icons */}
                    <TooltipProvider>
                        <div className="hidden md:flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 hover:bg-accent"
                                        onClick={() => setCalendarOpen(true)}
                                    >
                                        <CalendarIcon className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Calendar</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => router.push("/messages")} variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent">
                                        <MessageSquare className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Messages</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => router.push("/quick-access")} variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent">
                                        <Grid3x3 className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Quick Access</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 hover:bg-accent"
                                        onClick={() => router.push("/voucher")}
                                    >
                                        <Ticket className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Vouchers</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                    {/* Logo */}
                    {/* <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="text-lg font-bold">S</span>
                            </div>
                            <span className="hidden font-bold text-lg md:inline-block">
                            Switch2itech
                            </span>
                        </div> */}

                    {/* Desktop Navigation */}
                    {/* <nav className="hidden md:flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                            Dashboard
                            </Button>
                            <Button variant="ghost" size="sm">
                            Projects
                            </Button>
                            <Button variant="ghost" size="sm">
                            Team
                            </Button>
                            <Button variant="ghost" size="sm">
                            Reports
                            </Button>
                        </nav> */}
                </div>

                {/* Right Section - Action Items & Profile */}
                <TooltipProvider>
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Customer Support */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="hidden lg:flex h-9 gap-2 px-3 hover:bg-accent"
                                    onClick={() => setSupportOpen(true)}
                                >
                                    <Headphones className="h-4 w-4" />
                                    {/* <span className="text-sm font-semibold">CUSTOMER SUPPORT</span> */}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Customer Support</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Refer & Save */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="hidden lg:flex h-9 gap-2 px-3 hover:bg-accent"
                                    onClick={() => setReferOpen(true)}
                                >
                                    <Gift className="h-4 w-4" />
                                    {/* <span className="text-sm font-semibold">REFER & SAVE</span> */}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refer & Save</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Visit Website */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="hidden lg:flex h-9 gap-2 px-3 hover:bg-accent"
                                    onClick={() => window.open("https://switch2itech.cloud", "_blank")}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    {/* <span className="text-sm font-semibold">VISIT WEBSITE</span> */}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Visit Website</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* User Profile */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-9 gap-2 px-2 hover:bg-accent"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'YOU'}`}
                                            alt="User"
                                        />
                                        <AvatarFallback>YOU</AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start text-sm">
                                        <span className="font-semibold leading-none">{user?.name || ""}</span>
                                        <span className="text-xs text-muted-foreground leading-none mt-1">
                                            {user?.email}
                                        </span>
                                    </div>
                                    <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-medium">{user?.name}
                                            <span className="text-[8px] bg-muted p-2 py-1 ml-3 rounded-xl text-foreground font-normal">
                                                {user?.role}
                                            </span>
                                        </span>
                                        <span className="text-xs text-muted-foreground font-normal">
                                            {user?.email}
                                        </span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </TooltipProvider>
            </div>

            {/* Mobile Search Bar */}
            {isSearchOpen && (
                <div className="md:hidden border-t border-border/40 p-3 bg-background">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="pl-9 w-full"
                            autoFocus
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setIsSearchOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Calendar Dialog */}
            <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Calendar</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Calendar Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="gap-2">
                                            {format(currentMonth, "MMMM")}
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {Array.from({ length: 12 }, (_, i) => {
                                            const month = new Date(2024, i, 1);
                                            return (
                                                <DropdownMenuItem
                                                    key={i}
                                                    onClick={() => setCurrentMonth(month)}
                                                >
                                                    {format(month, "MMMM")}
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCalendarNavigation("prev")}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCalendarNavigation("next")}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleCalendarNavigation("today")}
                                    className="bg-teal-500 text-white hover:bg-teal-600"
                                >
                                    Today
                                </Button>
                                <span className="text-sm text-muted-foreground">{dateRange}</span>
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                        {/* Calendar Component */}
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            className="rounded-md border"
                            captionLayout="dropdown"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Customer Support Dialog */}
            <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Support</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-3 text-muted-foreground italic">
                            <p>
                                The Switch2itech Help Center will support you as you learn about and use Switch2itech Software.
                                We have documentation and videos to answer your questions.
                            </p>
                            <p>Can&apos;t find the answers you&apos;re looking for?</p>
                            <p>
                                Please submit a support ticket & our support agent will be in touch with in one business day.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="flex flex-col items-center gap-3 h-auto py-6 hover:bg-accent"
                            >
                                <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center">
                                    <Headphones className="h-8 w-8 text-white" />
                                </div>
                                <span className="font-semibold text-sm">CONTACT SUPPORT</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex flex-col items-center gap-3 h-auto py-6 hover:bg-accent border-blue-500"
                            >
                                <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                                    <Headphones className="h-8 w-8 text-white" />
                                </div>
                                <span className="font-semibold text-sm text-blue-500">KNOWLEDGE BASE</span>
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="default" onClick={() => setSupportOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Refer & Save Dialog */}
            <Dialog open={referOpen} onOpenChange={setReferOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Refer & Save</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground italic">
                            Tell your friends about Switch2itech and receive $10 off your monthly bill for each referral that signs up.
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="refer-name">CONTACT FULL NAME</Label>
                                <Input
                                    id="refer-name"
                                    placeholder="Name"
                                    value={referForm.name}
                                    onChange={(e) => setReferForm({ ...referForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="refer-email">EMAIL</Label>
                                <Input
                                    id="refer-email"
                                    type="email"
                                    placeholder="Email"
                                    value={referForm.email}
                                    onChange={(e) => setReferForm({ ...referForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="refer-phone">PHONE</Label>
                                <Input
                                    id="refer-phone"
                                    type="tel"
                                    placeholder="Phone"
                                    value={referForm.phone}
                                    onChange={(e) => setReferForm({ ...referForm, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="refer-dealership">DEALERSHIP NAME</Label>
                                <Input
                                    id="refer-dealership"
                                    placeholder="Dealership Name"
                                    value={referForm.dealershipName}
                                    onChange={(e) => setReferForm({ ...referForm, dealershipName: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setReferOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={handleReferSubmit} className="bg-blue-500 hover:bg-blue-600">
                            Refer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </header>
    );
};

export default Header;