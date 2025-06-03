import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Check, Bell, BellOff } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { toast } from "@/hooks/use-toast";

// Schemas
const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const passwordSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

const registerSchema = z.object({
  name: z.string().min(1, { message: "Full name is required" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().optional(),
  specialty: z.string().optional(),
});

// Main Auth Flow Controller
export default function NewAuthPage() {
  const [step, setStep] = useState('welcome');
  const [authType, setAuthType] = useState(null);
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState(null);
  
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "client") {
        setLocation("/client/dashboard");
      } else if (user.role === "rep") {
        setLocation("/rep/dashboard");
      } else if (user.role === "doctor") {
        setLocation("/doctor/dashboard");
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  const handleEmailSubmit = async (emailValue) => {
    setEmail(emailValue);
    
    if (authType === 'login') {
      setStep('password');
    } else {
      setStep('register');
    }
  };

  const handlePasswordSubmit = (password) => {
    loginMutation.mutate({ 
      username: email,
      password 
    });
  };

  const handleRegistrationSubmit = (data) => {
    setUserData(data);
    registerMutation.mutate(data, {
      onSuccess: () => {
        setStep('consent');
      }
    });
  };

  const handleNotificationConsent = (allowNotifications) => {
    toast({
      title: "Welcome!",
      description: "Your account is ready. Redirecting to dashboard...",
    });
  };

  if (user) {
    return null;
  }

  // Step 1: Welcome/Landing Page
  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center space-y-8 max-w-2xl mx-auto px-6">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="transform scale-150">
                <Logo />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                Medical Survey Platform
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Complete surveys, earn points, and redeem rewards. Join thousands of healthcare professionals making a difference.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-12">
              <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Complete Surveys</h3>
                <p className="text-sm text-gray-600">Participate in medical research surveys</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Earn Points</h3>
                <p className="text-sm text-gray-600">Get rewarded for your participation</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Redeem Rewards</h3>
                <p className="text-sm text-gray-600">Convert points to cash or gift cards</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => setStep('choice')}
            size="lg"
            className="px-12 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Get Started
          </Button>
          
          <p className="text-sm text-gray-500 mt-6">
            Join over 10,000+ healthcare professionals already earning rewards
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Choose Login or Register
  if (step === 'choice') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome to Medical Survey Platform
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Choose how you'd like to continue
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Button
                onClick={() => {
                  setAuthType('login');
                  setStep('email');
                }}
                variant="default"
                size="lg"
                className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
              >
                I have an account - Sign In
              </Button>
              
              <Button
                onClick={() => {
                  setAuthType('register');
                  setStep('email');
                }}
                variant="outline"
                size="lg"
                className="w-full py-4 text-lg font-semibold border-2 hover:bg-gray-50"
              >
                I'm new here - Create Account
              </Button>
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <Button
              onClick={() => setStep('welcome')}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3a: Email Input
  if (step === 'email') {
    const EmailForm = () => {
      const form = useForm({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
      });

      const handleSubmit = (values) => {
        handleEmailSubmit(values.email);
      };

      return (
        <Form {...form}>
          <div onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="doctor@example.com"
                      className="py-3 px-4 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              className="w-full py-3 text-base font-semibold"
            >
              Continue
            </Button>
          </div>
        </Form>
      );
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {authType === 'login' ? 'Sign In' : 'Create Account'}
              </CardTitle>
              <p className="text-gray-600">
                Enter your email address to continue
              </p>
            </CardHeader>
            
            <CardContent>
              <EmailForm />
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <Button
              onClick={() => setStep('choice')}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3b: Password Input (Login)
  if (step === 'password') {
    const PasswordForm = () => {
      const form = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: "" },
      });

      const handleSubmit = (values) => {
        handlePasswordSubmit(values.password);
      };

      return (
        <Form {...form}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      className="py-3 px-4 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              className="w-full py-3 text-base font-semibold"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </Form>
      );
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome back
              </CardTitle>
              <p className="text-gray-600">
                Signing in as <span className="font-medium text-gray-900">{email}</span>
              </p>
            </CardHeader>
            
            <CardContent>
              <PasswordForm />
              
              <div className="text-center mt-4">
                <Button variant="link" className="text-sm text-gray-600">
                  Forgot your password?
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <Button
              onClick={() => setStep('email')}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
              disabled={loginMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Registration Form
  if (step === 'register') {
    const RegisterForm = () => {
      const form = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
          name: "",
          username: "",
          password: "",
          phone: "",
          specialty: "",
        },
      });

      const handleSubmit = (values) => {
        handleRegistrationSubmit({
          ...values,
          email,
          role: "doctor",
        });
      };

      return (
        <Form {...form}>
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dr. John Smith"
                      className="py-3 px-4 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="drjohnsmith"
                        className="py-3 px-4 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Min. 6 characters"
                        className="py-3 px-4 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        className="py-3 px-4 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Specialty</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cardiology"
                        className="py-3 px-4 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              className="w-full py-3 text-base font-semibold"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </Form>
      );
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
        <div className="w-full max-w-lg">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Create Your Account
              </CardTitle>
              <p className="text-gray-600">
                Creating account for <span className="font-medium text-gray-900">{email}</span>
              </p>
            </CardHeader>
            
            <CardContent>
              <RegisterForm />
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <Button
              onClick={() => setStep('email')}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
              disabled={registerMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Notification Consent
  if (step === 'consent') {
    const [allowNotifications, setAllowNotifications] = useState(null);

    const handleContinue = () => {
      if (allowNotifications !== null) {
        handleNotificationConsent(allowNotifications);
      }
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome, {userData?.name || 'Doctor'}!
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Your account has been created successfully
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Stay Updated with Notifications
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Get notified about new surveys, point updates, and important announcements. You can change this setting anytime.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => setAllowNotifications(true)}
                  variant={allowNotifications === true ? "default" : "outline"}
                  className="w-full py-4 text-left justify-start"
                >
                  <Bell className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Yes, send me notifications</div>
                    <div className="text-sm opacity-70">Stay informed about new opportunities</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => setAllowNotifications(false)}
                  variant={allowNotifications === false ? "default" : "outline"}
                  className="w-full py-4 text-left justify-start"
                >
                  <BellOff className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">No, I'll check manually</div>
                    <div className="text-sm opacity-70">I prefer to check for updates myself</div>
                  </div>
                </Button>
              </div>
              
              <Button
                onClick={handleContinue}
                disabled={allowNotifications === null}
                className="w-full py-3 text-base font-semibold"
              >
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
          
          <p className="text-center text-xs text-gray-500 mt-4 px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  return null;
}