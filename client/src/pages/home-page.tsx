import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect based on user role
    if (user) {
      if (user.role === "client") {
        setLocation("/client/dashboard");
      } else if (user.role === "rep") {
        setLocation("/rep/dashboard");
      } else if (user.role === "doctor") {
        setLocation("/doctor/dashboard");
      }
    }
  }, [user, setLocation]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Medical Survey Platform</h1>
        <p className="mb-6">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
