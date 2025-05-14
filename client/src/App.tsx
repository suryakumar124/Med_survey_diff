import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";

// Client Pages
import ClientDashboard from "@/pages/client/dashboard";
import ClientSurveys from "@/pages/client/surveys";
import SurveyDetails from "@/pages/client/survey-details";
import ClientDoctors from "@/pages/client/doctors";
import DoctorDetails from "@/pages/client/doctor-details";
import ClientRepresentatives from "@/pages/client/representatives";
import ClientAnalytics from "@/pages/client/analytics";

// Rep Pages
import RepDashboard from "@/pages/rep/dashboard";
import RepDoctors from "@/pages/rep/doctors";
import RepOnboarding from "@/pages/rep/onboarding";

// Doctor Pages
import DoctorDashboard from "@/pages/doctor/dashboard";
import DoctorAvailableSurveys from "@/pages/doctor/available-surveys";
import DoctorSurveyDetails from "@/pages/doctor/survey-details";
import DoctorCompletedSurveys from "@/pages/doctor/completed-surveys";
import DoctorPoints from "@/pages/doctor/points";
import DoctorProfile from "@/pages/doctor/profile";
import RepresentativeDetails from "@/pages/client/representative-details";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />

      {/* Client Routes */}
      <ProtectedRoute path="/client/dashboard" component={ClientDashboard} />
      <ProtectedRoute path="/client/surveys" component={ClientSurveys} />
      <ProtectedRoute path="/client/surveys/:id" component={SurveyDetails} />
      <ProtectedRoute path="/client/doctors" component={ClientDoctors} />
      <ProtectedRoute path="/client/doctors/:id" component={DoctorDetails} />
      <ProtectedRoute path="/client/representatives" component={ClientRepresentatives} />
      <ProtectedRoute path="/client/analytics" component={ClientAnalytics} />
      <ProtectedRoute path="/client/representatives/:id" component={RepresentativeDetails} />

      {/* Representative Routes */}
      <ProtectedRoute path="/rep/dashboard" component={RepDashboard} />
      <ProtectedRoute path="/rep/doctors" component={RepDoctors} />
      <ProtectedRoute path="/rep/onboarding" component={RepOnboarding} />

      {/* Doctor Routes */}
      <ProtectedRoute path="/doctor/dashboard" component={DoctorDashboard} />
      <ProtectedRoute path="/doctor/available-surveys" component={DoctorAvailableSurveys} />
      <ProtectedRoute path="/doctor/available-surveys/:id" component={DoctorSurveyDetails} />
      <ProtectedRoute path="/doctor/completed-surveys" component={DoctorCompletedSurveys} />
      <ProtectedRoute path="/doctor/points" component={DoctorPoints} />
      <ProtectedRoute path="/doctor/profile" component={DoctorProfile} />
    

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
