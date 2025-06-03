import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    // Show auth flow instead of redirecting
    return <NewAuthPage />;
  }

  // Existing redirect logic for authenticated users
  useEffect(() => {
    if (user.role === "client") {
      setLocation("/client/dashboard");
    } else if (user.role === "rep") {
      setLocation("/rep/dashboard");
    } else if (user.role === "doctor") {
      setLocation("/doctor/dashboard");
    }
  }, [user, setLocation]);

  return null;
}
