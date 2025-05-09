import { useState } from "react";
import { useParams, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Survey, SurveyQuestion } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Clock, Award, FileText, BarChart2, Users, PieChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

// Create question schema
const createQuestionSchema = z.object({
  questionText: z.string().min(1, { message: "Question text is required" }),
  questionType: z.enum(["text", "scale", "mcq"], { message: "Question type is required" }),
  // "ranking" type removed temporarily
  options: z.string().optional(),
  required: z.boolean().default(false),
});

type CreateQuestionData = z.infer<typeof createQuestionSchema>;

export default function SurveyDetails() {
  const { id } = useParams();
  const surveyId = parseInt(id as string);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
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
  
  // Fetch survey responses for analytics
  const { data: responses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ["/api/surveys", surveyId, "responses"],
    queryFn: async () => {
      const res = await fetch(`/api/surveys/${surveyId}/responses`);
      if (!res.ok) throw new Error("Failed to fetch responses");
      return res.json();
    },
    enabled: !!surveyId && !isNaN(surveyId) && activeTab === "analytics",
  });
  
  // Create question form
  const form = useForm<CreateQuestionData>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      questionText: "",
      questionType: "text",
      options: "",
      required: false,
    },
  });
  
  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: CreateQuestionData & { surveyId: number; orderIndex: number }) => {
      const res = await apiRequest("POST", `/api/surveys/${surveyId}/questions`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question created",
        description: "Your question has been added to the survey",
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", surveyId, "questions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create question",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CreateQuestionData) => {
    createQuestionMutation.mutate({
      ...data,
      surveyId,
      orderIndex: questions.length, // Add to the end of the list
    });
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
          <Link href="/client/surveys">
            <Button>Back to Surveys</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout 
      pageTitle={survey.title} 
      pageDescription="Manage survey details and questions"
      backLink="/client/surveys"
      backLinkLabel="Back to Surveys"
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Survey Information</CardTitle>
                <CardDescription>Review and update survey details</CardDescription>
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
                <Button variant="outline">Edit Survey</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Survey Questions</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Question</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Question</DialogTitle>
                    <DialogDescription>
                      Create a question for this survey.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="questionText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Text</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter your question" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="questionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select question type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="scale">Scale</SelectItem>
                                <SelectItem value="mcq">Multiple Choice</SelectItem>
                                {/* Ranking temporarily removed
                                <SelectItem value="ranking">Ranking</SelectItem> 
                                */}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The type of response for this question.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {(form.watch("questionType") === "mcq") && (
                        <FormField
                          control={form.control}
                          name="options"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Options</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter options, one per line"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter one option per line.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={form.control}
                        name="required"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="form-checkbox h-4 w-4 text-primary rounded"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Required</FormLabel>
                              <FormDescription>
                                Make this question mandatory for submission.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createQuestionMutation.isPending}>
                          {createQuestionMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add Question"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {questionsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : questions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500 mb-4">No questions added to this survey yet.</p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    variant="outline"
                    className="space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Your First Question</span>
                  </Button>
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
                      {question.questionType === "mcq" ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Options:</p>
                          <ul className="list-disc list-inside">
                            {question.options?.split("\n").map((option, i) => (
                              <li key={i} className="text-sm">{option}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">Delete</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Survey Analytics</h2>
            </div>
            
            {responsesLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overview card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Response Overview</CardTitle>
                    <CardDescription>Summary of survey responses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Users className="h-10 w-10 text-primary p-2 bg-primary/10 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Responses</p>
                        <p className="text-2xl font-bold">{responses.length.toString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <PieChart className="h-10 w-10 text-green-600 p-2 bg-green-100 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                        <p className="text-2xl font-bold">
                          {responses.length ? Math.round((responses.filter(r => r.completed).length / responses.length) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Question stats card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Question Performance</CardTitle>
                    <CardDescription>
                      Questions with highest and lowest response rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {questions.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        No questions available to analyze.
                      </div>
                    ) : responses.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        No responses received yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm font-medium">Response Distribution</p>
                        <Progress value={responses.length ? (responses.filter(r => r.completed).length / responses.length) * 100 : 0} className="h-2 w-full" />
                        <p className="text-xs text-gray-500 text-right">
                          {responses.filter(r => r.completed).length} completed out of {responses.length} total responses
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Response details */}
                {responses.length > 0 && questions.filter(q => q.questionType === "mcq").map(question => {
                  // Get all responses for this question
                  const questionResponses = responses.flatMap(response => 
                    response.questionResponses?.filter(qr => qr.questionId === question.id) || []
                  );
                  
                  // Calculate option statistics for MCQ questions
                  if (question.questionType === "mcq" && question.options) {
                    const options = question.options.split("\n");
                    const optionCounts = options.map(option => {
                      const count = questionResponses.filter(qr => qr.response === option).length;
                      const percentage = questionResponses.length > 0
                        ? Math.round((count / questionResponses.length) * 100)
                        : 0;
                      return { option, count, percentage };
                    });
                    
                    return (
                      <Card key={question.id} className="col-span-1 md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-lg">{question.questionText}</CardTitle>
                          <CardDescription>Response distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {optionCounts.map((option, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between">
                                  <p className="text-sm font-medium">{option.option}</p>
                                  <p className="text-sm text-gray-500">{option.count} ({option.percentage}%)</p>
                                </div>
                                <Progress value={option.percentage} className="h-2 w-full" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}