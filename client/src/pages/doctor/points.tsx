import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Award, CreditCard, Wallet, CheckCircle, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Redemption } from "@shared/schema";
import { useState } from "react";
import { Link } from "wouter";

interface PointsInfo {
  totalPoints: number;
  redeemedPoints: number;
  availablePoints: number;
  redemptions: Redemption[];
}

// Extended survey response type
interface CompletedSurveyResponse {
  id: number;
  doctorId: number;
  surveyId: number;
  completed: boolean;
  pointsEarned: number;
  startedAt: string;
  completedAt: string;
  survey: {
    id: number;
    title: string;
    description: string;
    points: number;
    estimatedTime: number;
    redemptionOptions?: string[];
  };
  questionResponses: any[];
  canRedeem: boolean; // Whether this survey can be redeemed
  alreadyRedeemed: boolean; // Whether this survey has been redeemed
  redemption?: Redemption; // Associated redemption if exists
}

export default function DoctorPoints() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("completed-surveys");

  // Get the doctor ID from the user's role
  const { data: doctorInfo } = useQuery<{ id: number }>({
    queryKey: ["/api/doctors/current"],
    enabled: !!user && user.role === "doctor",
  });

  // Fetch points information
  const { data: pointsInfo, isLoading } = useQuery<PointsInfo>({
    queryKey: ["/api/doctors", doctorInfo?.id, "points"],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/${doctorInfo?.id}/points`);
      if (!res.ok) throw new Error("Failed to fetch points information");
      return res.json();
    },
    enabled: !!doctorInfo?.id,
  });

  // Fetch completed survey responses with redemption info
  const { data: completedSurveys, isLoading: surveysLoading } = useQuery<CompletedSurveyResponse[]>({
    queryKey: ["/api/doctors/current/completed-surveys-with-redemption"],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/current/completed-surveys-with-redemption`);
      if (!res.ok) throw new Error("Failed to fetch completed surveys");
      return res.json();
    },
  });

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Unknown date";
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return "Unknown date";
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hr${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
  };

  if (isLoading || surveysLoading) {
    return (
      <MainLayout pageTitle="My Points" pageDescription="Manage and redeem your earned points">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!pointsInfo) {
    return (
      <MainLayout pageTitle="My Points" pageDescription="Manage and redeem your earned points">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="py-8">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Points information not available</h3>
              <p className="text-gray-500">
                Unable to retrieve your points information at this time. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  // Filter surveys that can be redeemed and haven't been redeemed yet
  const redeemableSurveys = completedSurveys?.filter(survey => 
    survey.canRedeem && !survey.alreadyRedeemed
  ) || [];

  const redeemedSurveys = completedSurveys?.filter(survey => 
    survey.alreadyRedeemed
  ) || [];

  return (
    <MainLayout pageTitle="My Points" pageDescription="Manage and redeem your earned points">
      <div className="space-y-6">
        {/* Points Overview Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-primary-50 rounded-lg">
                <Award className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-2xl font-bold text-primary">{pointsInfo.totalPoints}</h3>
                <p className="text-sm text-gray-600">Total Points Earned</p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg">
                <CheckCircle className="h-10 w-10 text-green-600 mb-2" />
                <h3 className="text-2xl font-bold text-green-600">{redeemableSurveys.length}</h3>
                <p className="text-sm text-gray-600">Surveys Available for Redemption</p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                <CreditCard className="h-10 w-10 text-gray-600 mb-2" />
                <h3 className="text-2xl font-bold text-gray-600">{pointsInfo.redeemedPoints}</h3>
                <p className="text-sm text-gray-600">Points Already Redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        {/* <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-amber-100 rounded-full">
                <Award className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-800">New Redemption System</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You can now redeem rewards directly from completed surveys. Each survey has specific redemption options (UPI, Amazon Pay, etc.). 
                  Look for surveys with available redemption options below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Tabs for different sections */}
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="completed-surveys">Available Redemptions</TabsTrigger>
            <TabsTrigger value="redeemed-surveys">Redeemed Surveys</TabsTrigger>
            <TabsTrigger value="history">Redemption History</TabsTrigger>
          </TabsList>

          {/* Available Redemptions Tab */}
          <TabsContent value="completed-surveys">
            <Card>
              <CardHeader>
                <CardTitle>Surveys Available for Redemption</CardTitle>
                <CardDescription>Complete surveys that you can redeem rewards from</CardDescription>
              </CardHeader>
              <CardContent>
                {redeemableSurveys.length > 0 ? (
                  <div className="space-y-4">
                    {redeemableSurveys.map((survey) => (
                      <div key={survey.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-green-100 rounded-full">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">{survey.survey.title}</h3>
                              <p className="text-sm text-gray-500 mt-1 mb-3">
                                {survey.survey.description || "No description provided."}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-4 mb-3">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Award className="h-4 w-4 mr-1 text-amber-500" />
                                  <span>{survey.pointsEarned} points earned</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                  <span>Completed on {formatDate(survey.completedAt)}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <FileText className="h-4 w-4 mr-1 text-gray-500" />
                                  <span>{formatTime(survey.survey.estimatedTime)}</span>
                                </div>
                              </div>

                              {/* Redemption Options */}
                              {survey.survey.redemptionOptions && survey.survey.redemptionOptions.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-600 mb-2">Available redemption options:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {survey.survey.redemptionOptions.map((option) => (
                                      <Badge key={option} variant="outline" className="text-xs capitalize">
                                        {option === "upi" ? "UPI Transfer" : option === "amazon" ? "Amazon Pay" : option.replace('_', ' ')}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Ready for Redemption
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            <Link href={`/doctor/survey-redemption/${survey.surveyId}`}>
                              <Button className="space-x-2">
                                <Wallet className="h-4 w-4" />
                                <span>Redeem Rewards</span>
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys available for redemption</h3>
                    <p className="text-gray-500 mb-4">
                      Complete surveys with redemption options to earn rewards you can redeem.
                    </p>
                    <Link href="/doctor/available-surveys">
                      <Button variant="outline">
                        Browse Available Surveys
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redeemed Surveys Tab */}
          <TabsContent value="redeemed-surveys">
            <Card>
              <CardHeader>
                <CardTitle>Redeemed Surveys</CardTitle>
                <CardDescription>Surveys for which you have already redeemed rewards</CardDescription>
              </CardHeader>
              <CardContent>
                {redeemedSurveys.length > 0 ? (
                  <div className="space-y-4">
                    {redeemedSurveys.map((survey) => (
                      <div key={survey.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-blue-100 rounded-full">
                            <CreditCard className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{survey.survey.title}</h3>
                            <p className="text-sm text-gray-500 mt-1 mb-3">
                              {survey.survey.description || "No description provided."}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 mb-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <Award className="h-4 w-4 mr-1 text-amber-500" />
                                <span>{survey.pointsEarned} points earned</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                <span>Completed on {formatDate(survey.completedAt)}</span>
                              </div>
                              {survey.redemption && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <CreditCard className="h-4 w-4 mr-1 text-blue-500" />
                                  <span>Redeemed on {formatDate(survey.redemption.createdAt)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                Already Redeemed
                              </Badge>
                              {survey.redemption && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    survey.redemption.status === "completed"
                                      ? "border-green-300 text-green-700"
                                      : survey.redemption.status === "pending"
                                      ? "border-amber-300 text-amber-700"
                                      : "border-red-300 text-red-700"
                                  }`}
                                >
                                  {survey.redemption.status.charAt(0).toUpperCase() + survey.redemption.status.slice(1)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No redeemed surveys yet</h3>
                    <p className="text-gray-500">
                      Surveys you redeem rewards from will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redemption History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Redemption History</CardTitle>
                <CardDescription>Your complete redemption transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                {pointsInfo.redemptions && pointsInfo.redemptions.length > 0 ? (
                  <div className="space-y-4">
                    {pointsInfo.redemptions.map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-100 rounded-full">
                            {redemption.redemptionType === "amazon" ? (
                              <CreditCard className="h-5 w-5 text-amber-600" />
                            ) : (
                              <Wallet className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {redemption.redemptionType === "amazon" ? "Amazon Pay Balance" : "UPI Transfer"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {redemption.points} points • {formatDate(redemption.createdAt)}
                            </p>
                            {redemption.payoutId && (
                              <div className="text-xs mt-2">
                                <p>Payout ID: {redemption.payoutId}</p>
                                <p>Status: {redemption.payoutStatus || 'Unknown'}</p>
                                {redemption.processedAt && (
                                  <p>Processed: {formatDate(redemption.processedAt)}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            redemption.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : redemption.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-800"
                          }`}>
                            {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No redemptions yet</h3>
                    <p className="text-gray-500">
                      Your redemption history will appear here once you start redeeming survey rewards.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}