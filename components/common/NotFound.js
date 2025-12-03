"use client"

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Home, Search, ArrowLeft, Hammer, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const NotFoundPage = () => {
  const numberRef = useRef(null);
  const crusherRef = useRef(null);
  const floatingRef = useRef([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Animate 404 number
    if (numberRef.current) {
      gsap.fromTo(
        numberRef.current.children,
        {
          y: -100,
          opacity: 0,
          rotateX: -90,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1,
          stagger: 0.2,
          ease: "bounce.out",
        }
      );
    }

    // Animate crusher icon
    if (crusherRef.current) {
      gsap.to(crusherRef.current, {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: "none",
      });

      gsap.to(crusherRef.current, {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    // Floating particles animation
    floatingRef.current.forEach((el, index) => {
      if (el) {
        gsap.to(el, {
          y: "random(-50, 50)",
          x: "random(-50, 50)",
          rotation: "random(-180, 180)",
          duration: "random(3, 6)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.2,
        });
      }
    });
  }, []);

  const handleSearch = () => {
    if (searchQuery) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            floatingRef.current[i] = el;
          }}
          className="absolute w-4 h-4 bg-primary/10 rounded-full blur-sm"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}

      <div className="max-w-4xl w-full space-y-8 relative z-10">
        {/* 404 with Crusher Icon */}
        <div className="text-center space-y-8">
          <div
            ref={numberRef}
            className="flex items-center justify-center gap-4 text-9xl md:text-[12rem] font-bold"
          >
            <span className="text-primary">4</span>
            <div ref={crusherRef} className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-primary/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border-2 border-primary/20">
                <Hammer className="w-16 h-16 md:w-20 md:h-20 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-destructive rounded-full flex items-center justify-center animate-pulse">
                <AlertCircle className="w-5 h-5 text-destructive-foreground" />
              </div>
            </div>
            <span className="text-primary">4</span>
          </div>

          {/* Main Message */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Page Not Found
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Looks like this page got crushed! The page you&apos;re looking for
              doesn&apos;t exist or has been moved.
            </p>
          </div>
        </div>

        {/* Error Code */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Error Code:{" "}
            <span className="font-mono font-semibold">404_PAGE_NOT_FOUND</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            If you believe this is a mistake, please contact support.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out 0.5s backwards;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
