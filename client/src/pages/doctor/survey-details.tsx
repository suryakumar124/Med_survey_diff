// Modifications to client/src/pages/doctor/survey-details.tsx
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
import { Loader2, Award, Clock, FileText, CheckCircle, ArrowRightCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { SurveyTakingFlow } from "@/components/survey/survey-taking-flow";

export default function DoctorSurveyDetails() {
  const { id } = useParams();
  const surveyId = parseInt(id as string);
  const [activeTab, setActiveTab] = useState("details");
  const [questionResponses, setQuestionResponses] = useState<{[key: number]: any}>({});
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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
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
      const existingQuestionResponses: {[key: number]: any} = {};
      
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
      <MainLayout pageTitle="Survey Details" pageDescription="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (!survey) {
    return (
      <MainLayout pageTitle="Survey Not Found" pageDescription="The requested survey could not be found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Survey Not Found</h2>
          <p className="mb-6">The survey you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/doctor/available-surveys">
            <Button>Back to Available Surveys</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  const completed = isSurveyCompleted();
  
  return (
    <MainLayout 
      pageTitle={survey.title} 
      pageDescription="View survey details and take survey"
      backLink="/doctor/available-surveys"
      backLinkLabel="Back to Available Surveys"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl">{survey.title}</CardTitle>
                <CardDescription className="mt-1 max-w-2xl">
                  {survey.description || "No description provided."}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                {getStatusBadge(survey.status)}
                {completed && (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Points</p>
                  <p className="text-sm text-gray-500">{survey.points} points</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Estimated Time</p>
                  <p className="text-sm text-gray-500">{formatTime(survey.estimatedTime)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-gray-500">{formatDate(survey.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="questions" disabled={completed}>
              {completed ? "Completed" : "Questions"}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Survey Information</CardTitle>
                <CardDescription>Review survey details before taking it</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Title</h3>
                    <p className="mt-1">{survey.title}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Description</h3>
                    <p className="mt-1">{survey.description || "No description provided."}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Status</h3>
                    <div className="mt-1">{getStatusBadge(survey.status)}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {completed ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Survey Completed</span>
                  </div>
                ) : (
                  <Button 
                    onClick={handleTakeSurvey}
                    disabled={takeSurveyMutation.isPending}
                    className="space-x-2"
                  >
                    {takeSurveyMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Take Survey Now</span>
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-4">
            {completed ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Survey Completed</h3>
                  <p className="text-gray-500 mb-4">You have already completed this survey.</p>
                </CardContent>
              </Card>
            ) : questionsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : questions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500 mb-4">No questions in this survey yet.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {autoSaving && (
                  <div className="flex items-center justify-end text-sm text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    Saving progress...
                  </div>
                )}
                {lastSaved && !autoSaving && (
                  <div className="flex items-center justify-end text-sm text-gray-500">
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
      </div>
    </MainLayout>
  );
}