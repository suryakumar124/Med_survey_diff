import { MainLayout } from "@/components/layout/main-layout";
import { StatisticsCards } from "@/components/analytics/statistics-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, FileText, CheckCircle, ArrowRight } from "lucide-react";
import { Survey } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export default function DoctorDashboard() {
  const { user } = useAuth();

  // Fetch available surveys
  const { data: surveys, isLoading: surveysLoading } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
  });

  // Fetch points information
  const { data: pointsInfo, isLoading: pointsLoading } = useQuery<{
    totalPoints: number;
    redeemedPoints: number;
    availablePoints: number;
  }>({
    queryKey: ["/api/doctors", user?.roleDetails?.id, "points"],
    enabled: !!user?.roleDetails?.id,
  });

  const isLoading = surveysLoading || pointsLoading;

  // Filter available and completed surveys
  const availableSurveys = surveys?.filter(survey => 
    survey.status === "active" && (!survey.completedCount || survey.completedCount === 0)
  ) || [];
  
  const completedSurveys = surveys?.filter(survey => 
    survey.completedCount && survey.completedCount > 0
  ) || [];

  // Stats data
  const stats = [
    {
      title: "Total Points",
      value: pointsInfo?.totalPoints || 0,
      icon: "points"
    },
    {
      title: "Available Points",
      value: pointsInfo?.availablePoints || 0,
      icon: "points"
    },
    {
      title: "Redeemed Points",
      value: pointsInfo?.redeemedPoints || 0,
      icon: "points"
    }
  ];

  return (
    <MainLayout pageTitle="Dashboard" pageDescription={`Welcome back, ${user?.name}`}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <StatisticsCards stats={stats} />

          {/* Main Content Sections */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Available Surveys */}
            <Card>
              <CardHeader>
                <CardTitle>Available Surveys</CardTitle>
                <CardDescription>Surveys available for you to complete</CardDescription>
              </CardHeader>
              <CardContent>
                {availableSurveys.length > 0 ? (
                  <div className="space-y-4">
                    {availableSurveys.slice(0, 3).map((survey) => (
                      <div key={survey.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center">
                          <div className="p-2 bg-primary-100 rounded-full mr-4">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{survey.title}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{survey.points} points</span>
                              <span>•</span>
                              <span>~{survey.estimatedTime} min</span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/doctor/available-surveys/${survey.id}`}>
                          <Button variant="outline" size="sm">
                            Take Survey
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No surveys available at the moment.
                  </div>
                )}
              </CardContent>
              {availableSurveys.length > 3 && (
                <CardFooter className="flex justify-center pt-2 pb-4">
                  <Link href="/doctor/available-surveys">
                    <Button variant="ghost">
                      View all available surveys
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              )}
            </Card>

            {/* Completed Surveys */}
            <Card>
              <CardHeader>
                <CardTitle>Completed Surveys</CardTitle>
                <CardDescription>Surveys you have already completed</CardDescription>
              </CardHeader>
              <CardContent>
                {completedSurveys.length > 0 ? (
                  <div className="space-y-4">
                    {completedSurveys.slice(0, 3).map((survey) => (
                      <div key={survey.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 rounded-full mr-4">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{survey.title}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{survey.points} points earned</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600">Completed</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    You haven't completed any surveys yet.
                  </div>
                )}
              </CardContent>
              {completedSurveys.length > 3 && (
                <CardFooter className="flex justify-center pt-2 pb-4">
                  <Link href="/doctor/completed-surveys">
                    <Button variant="ghost">
                      View all completed surveys
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              )}
            </Card>
          </div>

          {/* Points Redemption Card */}
          <Card>
            <CardHeader>
              <CardTitle>Points Redemption</CardTitle>
              <CardDescription>Redeem your earned points for rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {pointsInfo?.availablePoints || 0}
                </div>
                <p className="text-gray-600 mb-4">Points available for redemption</p>
                <Link href="/doctor/points">
                  <Button>
                    Redeem Points
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
