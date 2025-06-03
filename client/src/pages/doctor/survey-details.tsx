import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Survey, SurveyQuestion } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Award, Clock, FileText, CheckCircle, ArrowRightCircle, Users, Download, ArrowLeft, Star } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { SurveyTakingFlow } from "@/components/survey/survey-taking-flow";

export default function DoctorSurveyDetails() {
  const { id } = useParams();
  const surveyId = parseInt(id as string);
  const [activeTab, setActiveTab] = useState("details");
  const [questionResponses, setQuestionResponses] = useState<{ [key: number]: any }>({});
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { user } = useAuth();

  // Fetch survey details
  const { data: survey, isLoading: surveyLoading } = useQuery<Survey>({
    queryKey: ["/api/surveys", surveyId],
    queryFn: async () => {
      const res = await fetch(`/api/surveys/${surveyId}`);
      if (!res.ok) throw new Error("Failed to fetch survey");
      return res.json();
    },
    enabled: !!surveyId && !isNaN(surveyId),
  });

  // Fetch survey questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery<SurveyQuestion[]>({
    queryKey: ["/api/surveys", surveyId, "questions"],
    queryFn: async () => {
      const res = await fetch(`/api/surveys/${surveyId}/questions`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
    enabled: !!surveyId && !isNaN(surveyId),
  });

  // Fetch existing doctor responses (partial and complete)
  const { data: existingResponses, isLoading: responsesLoading } = useQuery({
    queryKey: ["/api/doctors/current/responses"],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/current/responses`);
      if (!res.ok) throw new Error("Failed to fetch existing responses");
      return res.json();
    },
    enabled: !!surveyId && !isNaN(surveyId),
  });

  // Auto-save mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (responses: any[]) => {
      const res = await apiRequest("POST", `/api/surveys/${surveyId}/partial-responses`, {
        responses
      });
      return await res.json();
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setAutoSaving(false);
    },
    onError: () => {
      setAutoSaving(false);
    }
  });

  // Take survey mutation
  const takeSurveyMutation = useMutation({
    mutationFn: async (responses: any[]) => {
      const res = await apiRequest("POST", `/api/surveys/${surveyId}/responses`, {
        responses
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Survey completed",
        description: "Your responses have been submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors", "points"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit survey",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle saving progress
  const handleSaveProgress = (responses: any[]) => {
    setAutoSaving(true);

    // Convert responses to the format expected by the API
    const formattedResponses = responses.map(r => ({
      questionId: r.questionId,
      response: JSON.stringify(r.response)
    }));

    if (formattedResponses.length > 0) {
      saveProgressMutation.mutate(formattedResponses);
    } else {
      setAutoSaving(false);
    }
  };

  // Handle survey submission
  const handleSubmitSurvey = (responses: any[]) => {
    // Convert responses to the format expected by the API
    const formattedResponses = responses.map(r => ({
      questionId: r.questionId,
      data: r.response
    }));

    takeSurveyMutation.mutate(formattedResponses);
  };

  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Format minutes to a readable time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hr${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
  };

  // Status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-gray-800">Draft</Badge>;
      case "closed":
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleTakeSurvey = () => {
    // Switch to questions tab if user clicked "Take Survey Now" from details tab
    setActiveTab("questions");
  };

  const handleDownloadReport = () => {
    // Handle report download
    console.log("Downloading report...");
    toast({
      title: "Download started",
      description: "Your report is being prepared for download.",
    });
  };

  // Check if the survey has already been completed
  const isSurveyCompleted = () => {
    if (!existingResponses || responsesLoading) return false;

    return existingResponses.some((response: any) =>
      response.surveyId === surveyId && response.completed
    );
  };

  // Load partial responses when the component mounts
  useEffect(() => {
    if (!existingResponses || responsesLoading) return;

    // Find existing response for this survey
    const surveyResponse = existingResponses.find((response: any) =>
      response.surveyId === surveyId && !response.completed
    );

    if (surveyResponse) {
      // Load existing question responses
      const existingQuestionResponses: { [key: number]: any } = {};

      surveyResponse.questionResponses.forEach((qr: any) => {
        if (qr.responseData) {
          try {
            // Try to parse JSON if it's stored as a string
            const parsedResponse = typeof qr.responseData === 'string'
              ? JSON.parse(qr.responseData)
              : qr.responseData;

            existingQuestionResponses[qr.questionId] = parsedResponse;
          } catch (e) {
            // If parsing fails, use the raw response data
            existingQuestionResponses[qr.questionId] = qr.responseData;
          }
        }
      });

      if (Object.keys(existingQuestionResponses).length > 0) {
        setQuestionResponses(existingQuestionResponses);

        // Show a toast notification if there are saved responses
        toast({
          title: "Saved responses loaded",
          description: "Your previous progress has been restored.",
        });
      }
    }
  }, [existingResponses, responsesLoading, surveyId]);

  if (surveyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md mx-4 border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Survey Not Found</h2>
            <p className="mb-6 text-slate-600">The survey you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/doctor/available-surveys">
              <Button className="bg-teal-500 hover:bg-teal-600">Back to Available Surveys</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completed = isSurveyCompleted();

  // Mock data for participant count - in real app, this would come from survey API
  const participantCount = survey.responseCount || 90;
  const mockTags = survey.tags || ["Cardiology", "Treatment", "Research", "Clinical"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/doctor/available-surveys">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-semibold text-lg text-slate-900 truncate max-w-[200px] md:max-w-none">
                  {survey.title}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusBadge(survey.status)}
                  {completed && (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs px-2 py-1">
                      Completed
                    </Badge>
                  )}
                  <div className="flex items-center text-sm text-slate-600">
                    <Star className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="font-medium">{survey.points}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Users className="h-4 w-4 text-teal-600" />
              <span className="font-semibold text-teal-600 text-lg">{participantCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {mockTags.map((tag, index) => (
            <Badge 
              key={index}
              variant="secondary"
              className="bg-teal-100 text-teal-700 hover:bg-teal-200 text-sm px-3 py-1 rounded-full"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Survey Image Placeholder */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <div className="bg-gradient-to-br from-slate-200 to-slate-300 h-48 md:h-64 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 border border-white/30">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-600 text-sm text-center font-medium">Survey Preview</p>
            </div>
          </div>
        </Card>

        {/* Tabs for Survey Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
            <TabsTrigger value="details" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">Details</TabsTrigger>
            <TabsTrigger 
              value="questions" 
              disabled={completed}
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700"
            >
              {completed ? "Completed" : "Questions"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Information Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Information about survey/interview/focus group/webinar will have last date mentioned too
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {survey.description || "A comprehensive survey designed to gather insights and feedback from medical professionals."}
                  </p>
                  <div className="mt-4 inline-flex items-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 text-amber-500 mr-1" />
                      <span>{survey.points} points</span>
                    </div>
                    <div className="flex items-center">
                      <span>•</span>
                    </div>
                    <div>
                      <span>~{formatTime(survey.estimatedTime)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rewards Available */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-700 font-medium">Rewards available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: "💳", label: "UPI Transfer", color: "bg-blue-50 border-blue-200" },
                    { icon: "🛍️", label: "Amazon Pay", color: "bg-orange-50 border-orange-200" },
                    { icon: "🎁", label: "Gift Cards", color: "bg-green-50 border-green-200" },
                    { icon: "💰", label: "Cash Rewards", color: "bg-purple-50 border-purple-200" }
                  ].map((reward, index) => (
                    <div 
                      key={index}
                      className={`${reward.color} border rounded-lg p-4 text-center transition-all hover:shadow-sm`}
                    >
                      <div className="text-2xl mb-2">{reward.icon}</div>
                      <p className="text-xs font-medium text-slate-700">{reward.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Report Download */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <Download className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">Download report when survey completed</h4>
                      <p className="text-sm text-slate-600">Get detailed survey insights</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadReport}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    disabled={!completed}
                  >
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-6">
            {completed ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Survey Completed</h3>
                  <p className="text-slate-500 mb-4">You have already completed this survey.</p>
                </CardContent>
              </Card>
            ) : questionsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
              </div>
            ) : questions.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-slate-500 mb-4">No questions in this survey yet.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {autoSaving && (
                  <div className="flex items-center justify-end text-sm text-slate-500">
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    Saving progress...
                  </div>
                )}
                {lastSaved && !autoSaving && (
                  <div className="flex items-center justify-end text-sm text-slate-500">
                    Last saved: {format(lastSaved, "HH:mm:ss")}
                  </div>
                )}
                <SurveyTakingFlow
                  questions={questions}
                  onSave={handleSaveProgress}
                  onSubmit={handleSubmitSurvey}
                  initialResponses={questionResponses}
                />
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Take Survey Button - Only show on details tab and if not completed */}
        {activeTab === "details" && !completed && (
          <div className="sticky bottom-4 z-10">
            <Button
              onClick={handleTakeSurvey}
              disabled={takeSurveyMutation.isPending}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-4 text-lg rounded-xl shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              size="lg"
            >
              {takeSurveyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading Survey...
                </>
              ) : (
                "Take survey"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}