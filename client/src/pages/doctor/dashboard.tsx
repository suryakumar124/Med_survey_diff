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

// Interface for the survey object within responses
interface SurveyData {
  id: number;
  clientId: number;
  title: string;
  description: string;
  points: number;
  estimatedTime: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for doctor survey responses
interface DoctorSurveyResponse {
  id: number;
  doctorId: number;
  surveyId: number;
  completed: boolean;
  pointsEarned: number;
  startedAt: string;
  completedAt: string;
  survey: SurveyData;
  questionResponses: any[];
}

export default function DoctorDashboard() {
  const { user } = useAuth();

  // Fetch available surveys
  const { data: availableSurveys, isLoading: surveysLoading } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
  });

  // Fetch completed survey responses
  const { data: surveyResponses, isLoading: responsesLoading } = useQuery<DoctorSurveyResponse[]>({
    queryKey: ["/api/doctors/current/responses"],
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

  const isLoading = surveysLoading || pointsLoading || responsesLoading;

  // Filter available surveys - excluding ones that are already completed
  const activeAvailableSurveys = availableSurveys?.filter(survey => 
    survey.status === "active" && 
    !surveyResponses?.some(response => response.surveyId === survey.id && response.completed)
  ) || [];
  
  // Filter completed survey responses
  const completedSurveyResponses = surveyResponses?.filter(response => 
    response.completed === true
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
                {activeAvailableSurveys.length > 0 ? (
                  <div className="space-y-4">
                    {activeAvailableSurveys.slice(0, 3).map((survey) => (
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
              {activeAvailableSurveys.length > 3 && (
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
                {completedSurveyResponses.length > 0 ? (
                  <div className="space-y-4">
                    {completedSurveyResponses.slice(0, 3).map((response) => (
                      <div key={response.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 rounded-full mr-4">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{response.survey.title}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{response.pointsEarned} points earned</span>
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
              {completedSurveyResponses.length > 3 && (
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