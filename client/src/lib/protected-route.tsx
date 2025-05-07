import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if the user is trying to access the right section based on their role
  if (
    (path.startsWith("/client") && user.role !== "client") ||
    (path.startsWith("/rep") && user.role !== "rep") ||
    (path.startsWith("/doctor") && user.role !== "doctor")
  ) {
    const redirectPath = 
      user.role === "client" ? "/client/dashboard" : 
      user.role === "rep" ? "/rep/dashboard" :
      user.role === "doctor" ? "/doctor/dashboard" : "/";
      
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
