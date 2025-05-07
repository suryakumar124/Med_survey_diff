import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Survey, DoctorSurveyResponse } from "@shared/schema";
import { Loader2, Search, CheckCircle, Clock, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface CompletedSurvey extends Survey {
  completedAt?: string;
  pointsEarned?: number;
}

export default function DoctorCompletedSurveys() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch completed surveys
  const { data: surveys, isLoading } = useQuery<CompletedSurvey[]>({
    queryKey: ["/api/surveys"],
  });

  // Filter completed surveys
  const completedSurveys = surveys?.filter(survey => 
    survey.completedCount && survey.completedCount > 0
  ) || [];

  // Filter by search term
  const filteredSurveys = completedSurveys.filter(survey => 
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (survey.description && survey.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort surveys
  const sortedSurveys = [...filteredSurveys].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.completedAt || a.createdAt).getTime() - new Date(b.completedAt || b.createdAt).getTime();
    } else if (sortBy === "points-high") {
      return (b.pointsEarned || b.points) - (a.pointsEarned || a.points);
    } else if (sortBy === "points-low") {
      return (a.pointsEarned || a.points) - (b.pointsEarned || b.points);
    }
    return 0;
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return "Unknown date";
    }
  };

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
          
          {sortedSurveys.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {sortedSurveys.map((survey) => (
                <Card key={survey.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-green-100 rounded-full">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{survey.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                            {survey.description || "No description provided."}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <Award className="h-4 w-4 mr-1 text-amber-500" />
                              <span>{survey.pointsEarned || survey.points} points earned</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1 text-gray-500" />
                              <span>Completed on {formatDate(survey.completedAt || survey.updatedAt)}</span>
                            </div>
                            <Badge variant="outline" className="text-green-600">
                              Completed
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
