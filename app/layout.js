import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SessionProviderWrapper from "@/providers/session-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Poultry Management System",
  description: "Poultry Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        cz-shortcut-listen="false"
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        <SessionProviderWrapper>
          {/* <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > */}

            {children}
            {/* <ToastContainer position="top-right" autoClose={3000} /> */}
            
            <Toaster position="top-right" />
          {/* </ThemeProvider> */}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
