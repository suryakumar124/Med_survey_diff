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
import { Award, Clock, FileText } from "lucide-react";

// Extended survey type with analytics data from API
interface ExtendedSurvey extends Survey {
  responseCount?: number;
  completedCount?: number;
  completionRate?: number;
  tags?: string[];
  redemptionOptions?: string[];
}

export default function DoctorAvailableSurveys() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch available surveys
  const { data: surveys, isLoading: surveysLoading } = useQuery<ExtendedSurvey[]>({
    queryKey: ["/api/surveys"],
  });

  // Fetch all available tags
  const { data: allTags = [], isLoading: tagsLoading } = useQuery<string[]>({
    queryKey: ["/api/surveys/tags/all"],
    queryFn: async () => {
      const response = await fetch('/api/surveys/tags/all');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    },
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
  const availableSurveys = surveys || [];

  // Apply all filters
  let filteredSurveys = availableSurveys;

  // Filter by search term
  if (searchTerm.trim() !== "") {
    filteredSurveys = filteredSurveys.filter(survey =>
      survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.description && survey.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (survey.tags && survey.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }

  // Filter by selected tags
  if (selectedTags.length > 0) {
    filteredSurveys = filteredSurveys.filter(survey => 
      survey.tags && survey.tags.some(tag => 
        selectedTags.some(selectedTag => 
          tag.toLowerCase().includes(selectedTag.toLowerCase())
        )
      )
    );
  }

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

  // Tag handling functions
  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
    setSortBy("newest");
  };

  const isLoading = surveysLoading || responsesLoading;
  const hasActiveFilters = searchTerm.trim() !== "" || selectedTags.length > 0;

  return (
    <MainLayout pageTitle="Available Surveys" pageDescription="Surveys available for you to complete">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tags Filter Section */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Filter by Tags</h3>
              <div className="flex items-center space-x-2">
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllTags}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear tags
                  </Button>
                )}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </div>
            
            {tagsLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse h-6 bg-gray-200 rounded w-16"></div>
                <div className="animate-pulse h-6 bg-gray-200 rounded w-20"></div>
                <div className="animate-pulse h-6 bg-gray-200 rounded w-14"></div>
              </div>
            ) : allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                    className={`cursor-pointer transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-secondary/80"
                    }`}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <span className="ml-1 text-xs">×</span>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tags available</p>
            )}
          </div>

          {/* Search and Sort Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filter Surveys</span>
                {hasActiveFilters && (
                  <Badge variant="outline" className="text-xs">
                    {filteredSurveys.length} of {availableSurveys.length} surveys
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search surveys by title, description, or tags..."
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

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Active filters:</span>
                    {searchTerm.trim() !== "" && (
                      <Badge variant="outline" className="text-xs">
                        Search: "{searchTerm}"
                        <button
                          onClick={() => setSearchTerm("")}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {selectedTags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        Tag: {tag}
                        <button
                          onClick={() => handleTagClick(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Survey Results */}
          {sortedSurveys.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Available Surveys ({sortedSurveys.length})
                </h2>
              </div>
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
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="py-8">
                  <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys found</h3>
                  <p className="text-gray-500 mb-4">
                    {hasActiveFilters
                      ? "No surveys match your current filters. Try adjusting your search criteria or tags."
                      : "There are no available surveys at the moment. Check back later."}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear all filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </MainLayout>
  );
}