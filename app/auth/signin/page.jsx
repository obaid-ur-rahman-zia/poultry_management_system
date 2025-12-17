"use client";
import React, { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
// import LoadingPage from "@/components/common/Loading";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if(result.ok) {
        toast.success("Sign in successful!");
        // toast.success("Redirecting....");
      }

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else if (result?.ok) {
        await getSession();
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/20 to-primary/30 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-primary/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center relative z-10">
        {/* Left side - Illustration */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 lg:space-y-8 p-4 lg:p-8">
          <div className="space-y-3 lg:space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary">
              Welcome Back!
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground">
              Sign in to access your secure dashboard and manage your account
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-6">
            <div className="flex items-start gap-4 group">
              <div className="p-3 rounded-lg bg-muted  transition-transform">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Secure Authentication</h3>
                <p className="text-sm text-muted-foreground">Your data is protected with industry-standard encryption</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="p-3 rounded-lg bg-muted  transition-transform">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Access your account instantly with optimized performance</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="p-3 rounded-lg bg-muted  transition-transform">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Premium Experience</h3>
                <p className="text-sm text-muted-foreground">Enjoy a seamless and intuitive user interface</p>
              </div>
            </div>
          </div>

          {/* Decorative illustration */}
          {/* <div className="relative mt-8">
            <div className="aspect-square max-w-md mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
              <svg viewBox="0 0 200 200" className="relative z-10" xmlns="http://www.w3.org/2000/svg">
                <path fill="url(#gradient1)" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.8C64.8,56.4,53.8,69,39.8,76.4C25.8,83.8,8.8,86,-7.8,83.8C-24.4,81.6,-40.5,75,-54.1,65.4C-67.7,55.8,-78.8,43.2,-84.4,28.2C-90,13.2,-90.1,-4.2,-85.3,-20C-80.5,-35.8,-70.8,-50,-58.4,-59.4C-46,-68.8,-31,-73.4,-16.3,-76.8C-1.6,-80.2,12.8,-82.4,26.7,-80.4C40.6,-78.4,54,-72.2,44.7,-76.4Z" transform="translate(100 100)" />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 0.8}} />
                    <stop offset="100%" style={{stopColor: '#9333ea', stopOpacity: 0.8}} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div> */}
        </div>

        {/* Right side - Sign in form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
            <CardHeader className="space-y-1 pb-4 sm:pb-6 px-4 sm:px-6">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary rounded-full blur-lg opacity-50"></div>
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-center">
                Sign In
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Secure Login
                  </span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Protected by industry-standard encryption
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}