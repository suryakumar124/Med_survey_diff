import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Survey } from "@shared/schema";
import { Loader2, Search, FileText, Clock, Award, Filter } from "lucide-react";
import { Link } from "wouter";
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

export default function DoctorAvailableSurveys() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch available surveys
  const { data: surveys, isLoading } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
  });

  // Filter active surveys that haven't been completed
  const availableSurveys = surveys?.filter(survey => 
    survey.status === "active" && (!survey.completedCount || survey.completedCount === 0)
  ) || [];

  // Filter by search term
  const filteredSurveys = availableSurveys.filter(survey => 
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (survey.description && survey.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort surveys
  const sortedSurveys = [...filteredSurveys].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
                <Card key={survey.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-primary-100 rounded-full">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{survey.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                            {survey.description || "No description provided."}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <Award className="h-4 w-4 mr-1 text-amber-500" />
                              <span>{survey.points} points</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1 text-gray-500" />
                              <span>~{survey.estimatedTime} min</span>
                            </div>
                            <Badge variant="outline" className="text-green-600">
                              Available
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 md:ml-4">
                        <Link href={`/doctor/available-surveys/${survey.id}`}>
                          <Button>
                            Take Survey
                          </Button>
                        </Link>
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
