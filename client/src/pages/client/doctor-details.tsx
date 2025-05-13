import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, Award, Calendar, FileText } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Doctor, User, DoctorSurveyResponse, Survey } from "@shared/schema";

// Define the types for API responses
interface DoctorWithUser extends Doctor {
  user: User;
}

interface SurveyResponse extends DoctorSurveyResponse {
  survey: Survey;
  questionResponses: Array<{
    id: number;
    questionId: number;
    doctorSurveyResponseId: number;
    response: string;
    question?: {
      questionText: string;
      questionType: string;
      options?: string;
    };
  }>;
}

export default function DoctorDetails() {
  const { id } = useParams();
  const doctorId = parseInt(id as string);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch doctor details
  const { data: doctor, isLoading: doctorLoading } = useQuery<DoctorWithUser>({
    queryKey: ["/api/doctors", doctorId],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/${doctorId}`);
      if (!res.ok) throw new Error("Failed to fetch doctor details");
      return res.json();
    },
    enabled: !!doctorId && !isNaN(doctorId),
  });

  // Fetch doctor's survey responses
  const { data: responses = [], isLoading: responsesLoading } = useQuery<SurveyResponse[]>({
    queryKey: ["/api/doctors", doctorId, "responses"],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/${doctorId}/responses`);
      if (!res.ok) throw new Error("Failed to fetch doctor responses");
      return res.json();
    },
    enabled: !!doctorId && !isNaN(doctorId),
  });

  if (doctorLoading) {
    return (
      <MainLayout pageTitle="Doctor Details" pageDescription="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!doctor) {
    return (
      <MainLayout pageTitle="Doctor Not Found" pageDescription="The requested doctor could not be found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Doctor Not Found</h2>
          <p className="mb-6">The doctor you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/client/doctors">
            <Button>Back to Doctors</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Initialials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-400">Pending</Badge>;
      case "inactive":
        return <Badge variant="outline" className="text-gray-500">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Format time ago
  const timeAgo = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Completed surveys
  const completedSurveys = responses.filter(r => r.completed);
  const completionRate = responses.length ? Math.round((completedSurveys.length / responses.length) * 100) : 0;

  return (
    <MainLayout 
      pageTitle={`${doctor.user.name}`} 
      pageDescription="Doctor profile and survey responses"
      backLink="/client/doctors"
      backLinkLabel="Back to Doctors"
    >
      <div className="space-y-6">
        {/* Doctor profile card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={doctor.user.profilePicture || ""} />
                  <AvatarFallback className="bg-primary-100 text-primary-800 text-xl">
                    {getInitials(doctor.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{doctor.user.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    {doctor.specialty || "No specialty provided"}
                    <div className="ml-4">{getStatusBadge(doctor.user.status)}</div>
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" className="space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Button>
                <Button variant="outline" className="space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Call</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Total Points</p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">{doctor.totalPoints}</span> points earned
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-gray-500">{formatDate(doctor.user.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Surveys Completed</p>
                  <p className="text-sm text-gray-500">
                    {completedSurveys.length} of {responses.length} ({completionRate}%)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
            <TabsTrigger value="points">Points History</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Information</CardTitle>
                <CardDescription>Personal and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Name</h3>
                  <p className="mt-1">{doctor.user.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Email</h3>
                  <p className="mt-1">{doctor.user.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Phone</h3>
                  <p className="mt-1">{doctor.user.phone || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Specialty</h3>
                  <p className="mt-1">{doctor.specialty || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <div className="mt-1">{getStatusBadge(doctor.user.status)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Username</h3>
                  <p className="mt-1">{doctor.user.username}</p>
                </div>
              </CardContent>
            </Card>

            {/* Points summary card */}
            <Card>
              <CardHeader>
                <CardTitle>Points Summary</CardTitle>
                <CardDescription>Overview of points earned and redeemed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Points Earned</p>
                    <p className="text-2xl font-bold">{doctor.totalPoints}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Available Points</p>
                    <p className="text-2xl font-bold">{doctor.totalPoints - doctor.redeemedPoints}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Redeemed Points</p>
                    <p className="text-2xl font-bold">{doctor.redeemedPoints}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Available</span>
                    <span className="text-sm">Redeemed</span>
                  </div>
                  <Progress 
                    value={doctor.totalPoints > 0 ? (doctor.totalPoints - doctor.redeemedPoints) / doctor.totalPoints * 100 : 0} 
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Surveys tab */}
          <TabsContent value="surveys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Survey Responses</CardTitle>
                <CardDescription>All surveys assigned to this doctor</CardDescription>
              </CardHeader>
              <CardContent>
                {responsesLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : responses.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No surveys have been assigned to this doctor yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Survey</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responses.map((response) => (
                          <TableRow key={response.id}>
                            <TableCell className="font-medium">
                              {response.survey?.title || "Unknown Survey"}
                            </TableCell>
                            <TableCell>
                              {response.completed ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-400">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {response.completedAt ? timeAgo(response.completedAt) : "Not completed"}
                            </TableCell>
                            <TableCell>{response.survey?.points || 0} points</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setActiveTab("responses")}
                                data-response-id={response.id}
                              >
                                View Responses
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Survey response details for each completed survey */}
            {responses.filter(r => r.completed).map((response) => (
              <Card key={response.id}>
                <CardHeader>
                  <CardTitle>{response.survey?.title || "Survey Response"}</CardTitle>
                  <CardDescription>
                    Completed {response.completedAt ? timeAgo(response.completedAt) : "N/A"} • 
                    Earned {response.survey?.points || 0} points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {response.questionResponses?.map((qr) => (
                      <div key={qr.id} className="border-b pb-4 last:border-0">
                        <h4 className="font-medium mb-2">{qr.question?.questionText || `Question ${qr.questionId}`}</h4>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-gray-800">{qr.responseData}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Points History tab */}
          <TabsContent value="points" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Points History</CardTitle>
                <CardDescription>History of points earned and redeemed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Total Balance</p>
                      <p className="text-2xl font-bold">{doctor.totalPoints - doctor.redeemedPoints} points</p>
                    </div>
                    <Button variant="outline">Export History</Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Show survey completions as points earned */}
                        {responses.filter(r => r.completed).map((response) => (
                          <TableRow key={`earn-${response.id}`}>
                            <TableCell>
                              <div className="font-medium">Completed Survey</div>
                              <div className="text-sm text-gray-500">{response.survey?.title}</div>
                            </TableCell>
                            <TableCell>{formatDate(response.completedAt)}</TableCell>
                            <TableCell className="text-green-600">+{response.survey?.points || 0}</TableCell>
                            <TableCell>--</TableCell>
                          </TableRow>
                        ))}
                        
                        {/* If there are no completed surveys */}
                        {responses.filter(r => r.completed).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                              No points history available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}