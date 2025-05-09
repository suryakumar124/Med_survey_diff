import { useState } from "react";
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

export default function DoctorSurveyDetails() {
  const { id } = useParams();
  const surveyId = parseInt(id as string);
  const [activeTab, setActiveTab] = useState("details");
  const [questionResponses, setQuestionResponses] = useState<{[key: number]: any}>({});
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
    // Collect responses only if we're in the questions tab
    if (activeTab !== "questions") {
      // Switch to questions tab if user clicked "Take Survey Now" from details tab
      setActiveTab("questions");
      return;
    }
    
    // Validate and collect responses
    const requiredQuestions = questions.filter(q => q.required);
    const missingRequired = requiredQuestions.filter(q => !questionResponses[q.id]);
    
    if (missingRequired.length > 0) {
      toast({
        title: "Missing required answers",
        description: `Please answer all required questions before submitting.`,
        variant: "destructive"
      });
      return;
    }
    
    // Format responses for API
    const responses = questions.map(question => ({
      questionId: question.id,
      response: questionResponses[question.id] || null
    })).filter(r => r.response !== null);
    
    // Don't submit if no responses
    if (responses.length === 0) {
      toast({
        title: "No answers provided",
        description: "Please answer at least one question before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    takeSurveyMutation.mutate(responses);
  };
  
  // Handle response changes for different question types
  const handleTextResponse = (questionId: number, value: string) => {
    setQuestionResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleMcqResponse = (questionId: number, option: string) => {
    setQuestionResponses(prev => ({
      ...prev,
      [questionId]: option
    }));
  };
  
  const handleScaleResponse = (questionId: number, value: number) => {
    setQuestionResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
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
            <TabsTrigger value="questions">Questions</TabsTrigger>
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
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Survey Questions</h2>
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
                    <ArrowRightCircle className="h-4 w-4" />
                    <span>Submit Answers</span>
                  </>
                )}
              </Button>
            </div>
            
            {questionsLoading ? (
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
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {question.questionType.charAt(0).toUpperCase() + question.questionType.slice(1)}
                          </Badge>
                          <CardTitle className="text-lg">
                            {index + 1}. {question.questionText}
                          </CardTitle>
                        </div>
                        <div>
                          {question.required && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Required</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {question.questionType === "mcq" || question.questionType === "ranking" ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Options:</p>
                          <div className="space-y-2 mt-3">
                            {question.options?.split("\n").map((option, i) => (
                              <div key={i} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`option-${question.id}-${i}`}
                                  name={`question-${question.id}`}
                                  checked={questionResponses[question.id] === option}
                                  onChange={() => handleMcqResponse(question.id, option)}
                                  className="h-4 w-4 text-primary focus:ring-primary"
                                />
                                <label htmlFor={`option-${question.id}-${i}`} className="text-sm">
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : question.questionType === "text" ? (
                        <div className="mt-2">
                          <textarea 
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Enter your answer here"
                            rows={3}
                            value={questionResponses[question.id] || ''}
                            onChange={(e) => handleTextResponse(question.id, e.target.value)}
                          />
                        </div>
                      ) : question.questionType === "scale" ? (
                        <div className="mt-2 flex items-center space-x-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleScaleResponse(question.id, num)}
                              className={`w-8 h-8 rounded-full border
                                ${questionResponses[question.id] === num 
                                  ? 'bg-primary text-white border-primary' 
                                  : 'border-gray-300 hover:bg-primary/10 hover:text-primary'}
                                focus:outline-none focus:ring-2 focus:ring-primary`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}