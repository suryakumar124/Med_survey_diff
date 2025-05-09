import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Survey } from "@shared/schema";
import { Loader2, Search, Filter } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { SurveyCard } from "@/components/survey/survey-card";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Extended survey type with analytics data from API
interface ExtendedSurvey extends Survey {
  responseCount?: number;
  completedCount?: number;
  completionRate?: number;
}

export default function DoctorAvailableSurveys() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch available surveys
  const { data: surveys, isLoading: surveysLoading } = useQuery<ExtendedSurvey[]>({
    queryKey: ["/api/surveys"],
  });
  
  // Fetch doctor's responses to determine partial responses
  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ["/api/doctors/current/responses"],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/current/responses`);
      if (!res.ok) throw new Error("Failed to fetch responses");
      return res.json();
    },
  });

  // Filter surveys that haven't been completed (including both active and draft)
  const availableSurveys = surveys?.filter(survey => 
    (survey.status === "active" || survey.status === "draft") && 
    (!survey.completedCount || survey.completedCount === 0)
  ) || [];

  // Filter by search term
  const filteredSurveys = availableSurveys.filter(survey => 
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (survey.description && survey.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper function to safely get date 
  const getDateValue = (dateValue: Date | string | null): number => {
    if (!dateValue) return 0;
    return new Date(dateValue).getTime();
  };

  // Sort surveys
  const sortedSurveys = [...filteredSurveys].sort((a, b) => {
    if (sortBy === "newest") {
      return getDateValue(b.createdAt) - getDateValue(a.createdAt);
    } else if (sortBy === "oldest") {
      return getDateValue(a.createdAt) - getDateValue(b.createdAt);
    } else if (sortBy === "points-high") {
      return b.points - a.points;
    } else if (sortBy === "points-low") {
      return a.points - b.points;
    } else if (sortBy === "time-short") {
      return a.estimatedTime - b.estimatedTime;
    } else if (sortBy === "time-long") {
      return b.estimatedTime - a.estimatedTime;
    }
    return 0;
  });

  // Check if a survey has a partial response
  const hasPartialResponse = (surveyId: number) => {
    if (!responses) return false;
    return responses.some((response: any) => 
      response.surveyId === surveyId && !response.completed
    );
  };
  
  const isLoading = surveysLoading || responsesLoading;
  
  return (
    <MainLayout pageTitle="Available Surveys" pageDescription="Surveys available for you to complete">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filter Surveys</CardTitle>
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
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="points-high">Highest Points</SelectItem>
                      <SelectItem value="points-low">Lowest Points</SelectItem>
                      <SelectItem value="time-short">Shortest Time</SelectItem>
                      <SelectItem value="time-long">Longest Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {sortedSurveys.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {sortedSurveys.map((survey) => (
                <SurveyCard 
                  key={survey.id}
                  survey={survey}
                  userRole="doctor"
                  partialResponse={hasPartialResponse(survey.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="py-8">
                  <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys found</h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? "No surveys match your search criteria. Try adjusting your filters." 
                      : "There are no available surveys at the moment. Check back later."}
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
