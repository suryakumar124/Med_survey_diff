import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SurveyCard } from "@/components/survey/survey-card";

// Updated interface for the new response type
interface Survey {
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

interface DoctorSurveyResponse {
  id: number;
  doctorId: number;
  surveyId: number;
  completed: boolean;
  pointsEarned: number;
  startedAt: string;
  completedAt: string;
  survey: Survey;
  questionResponses: any[];
}

export default function DoctorCompletedSurveys() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch completed survey responses
  const { data: surveyResponses, isLoading } = useQuery<DoctorSurveyResponse[]>({
    queryKey: ["/api/doctors/current/responses"],
  });

  // Filter completed survey responses
  const completedSurveyResponses = surveyResponses?.filter(response => 
    response.completed === true
  ) || [];

  // Filter by search term
  const filteredSurveyResponses = completedSurveyResponses.filter(response => 
    response.survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (response.survey.description && response.survey.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort survey responses
  const sortedSurveyResponses = [...filteredSurveyResponses].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
    } else if (sortBy === "points-high") {
      return b.pointsEarned - a.pointsEarned;
    } else if (sortBy === "points-low") {
      return a.pointsEarned - b.pointsEarned;
    }
    return 0;
  });


  return (
    <MainLayout pageTitle="Completed Surveys" pageDescription="Surveys you have already completed">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filter Completed Surveys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search surveys..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Most Recent</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="points-high">Highest Points</SelectItem>
                      <SelectItem value="points-low">Lowest Points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {sortedSurveyResponses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {sortedSurveyResponses.map((response) => (
                <SurveyCard 
                  key={response.id}
                  survey={response.survey}
                  userRole="doctor"
                  completed={true}
                  pointsEarned={response.pointsEarned}
                  completedAt={response.completedAt}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed surveys found</h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? "No completed surveys match your search criteria." 
                      : "You haven't completed any surveys yet. Check out the Available Surveys section to get started."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </MainLayout>
  );
}