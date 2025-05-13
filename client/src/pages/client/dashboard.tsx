import { MainLayout } from "@/components/layout/main-layout";
import { StatisticsCards } from "@/components/analytics/statistics-cards";
import { RecentActivity } from "@/components/analytics/recent-activity";
import { SurveyCompletionChart } from "@/components/analytics/survey-completion-chart";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Survey, Doctor } from "@shared/schema";
import { Loader2, FileText, Plus } from "lucide-react";

export default function ClientDashboard() {
  // Fetch surveys
  const { data: surveys, isLoading: surveysLoading } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
  });

  // Fetch doctors
  const { data: doctors, isLoading: doctorsLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  // Mock data for the chart
  const completionChartData = [
    { name: "Jan", total: 40, completed: 30 },
    { name: "Feb", total: 52, completed: 42 },
    { name: "Mar", total: 61, completed: 50 },
    { name: "Apr", total: 45, completed: 35 },
    { name: "May", total: 48, completed: 40 },
    { name: "Jun", total: 58, completed: 48 },
    { name: "Jul", total: 70, completed: 53 },
  ];

  // Recent activity data
  const recentActivity = [
    {
      id: "1",
      type: "survey_completed",
      title: "Dr. Michael Chen completed Patient Demographics Survey",
      description: "Earned 150 points",
      timestamp: "2 hours ago",
      user: { name: "Dr. Michael Chen" }
    },
    {
      id: "2",
      type: "doctor_added",
      title: "Sarah Johnson onboarded Dr. John Smith",
      description: "New Cardiologist",
      timestamp: "5 hours ago",
      user: { name: "Sarah Johnson" }
    },
    {
      id: "3",
      type: "points_redeemed",
      title: "Dr. Michael Chen redeemed 500 points",
      description: "Amazon Gift Card",
      timestamp: "Yesterday",
      user: { name: "Dr. Michael Chen" }
    },
    {
      id: "4",
      type: "survey_created",
      title: "New survey published: Diabetes Management Practices",
      description: "Worth 200 points",
      timestamp: "2 days ago"
    },
    {
      id: "5",
      type: "survey_ending",
      title: "Cardiovascular Treatments Survey ending soon",
      description: "Expires in 3 days",
      timestamp: "Today"
    }
  ];

  const isLoading = surveysLoading || doctorsLoading;

  // Calculate statistics
  const totalSurveys = surveys?.length || 0;
  const activeSurveys = surveys?.filter(s => s.status === "active").length || 0;
  const registeredDoctors = doctors?.length || 0;
  const completedSurveys = surveys?.reduce((acc, survey) => acc + (survey.completedCount || 0), 0) || 0;
  const completionRate = totalSurveys > 0 ? Math.round((completedSurveys / totalSurveys) * 100) : 0;

  const stats = [
    {
      title: "Active Surveys",
      value: activeSurveys,
      change: 8,
      icon: "surveys"
    },
    {
      title: "Registered Doctors",
      value: registeredDoctors,
      change: 12,
      icon: "doctors"
    },
    {
      title: "Attempts Completed",
      value: completedSurveys,
      change: 5,
      icon: "completed"
    },
    {
      title: "Points Redeemed",
      value: "8,320",
      change: -3,
      icon: "points"
    }
  ];

  return (
    <MainLayout
      pageTitle="Client Dashboard"
      pageDescription="Analytics and overview of your platform activity"
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <StatisticsCards stats={stats} />

          {/* Main Content Sections */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
            {/* Survey Completion Chart */}
            <div className="col-span-1 lg:col-span-4">
              <SurveyCompletionChart data={completionChartData} />
            </div>

            {/* Recent Activity */}
            <div className="col-span-1 lg:col-span-3">
              <RecentActivity activities={recentActivity} />
            </div>
          </div>

          {/* Recent Surveys Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Surveys</CardTitle>
              <Link href="/client/surveys">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Survey
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {surveys && surveys.length > 0 ? (
                <div className="space-y-4">
                  {surveys.slice(0, 5).map((survey) => (
                    <div key={survey.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="p-2 bg-primary-100 rounded-full mr-4">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{survey.title}</h3>
                          <p className="text-sm text-gray-500">
                            {survey.responseCount || 0} responses • {survey.points} points
                          </p>
                        </div>
                      </div>
                      <Link href={`/client/surveys/${survey.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-gray-500">No surveys found. Create your first survey to get started.</p>
              )}
              {surveys && surveys.length > 5 && (
                <div className="mt-4 text-center">
                  <Link href="/client/surveys">
                    <Button variant="outline">View All Surveys</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
