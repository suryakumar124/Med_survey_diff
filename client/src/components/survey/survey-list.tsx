import { Survey } from "@shared/schema";
import { SurveyCard } from "@/components/survey/survey-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SurveyListProps {
  userRole: string;
  onCreateSurvey?: () => void;
}

export function SurveyList({ userRole, onCreateSurvey }: SurveyListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: surveys, isLoading } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
  });

  const { data: allTags = [], isLoading: tagsLoading } = useQuery<string[]>({
    queryKey: ["/api/surveys/tags/all"],
    queryFn: async () => {
      const response = await fetch('/api/surveys/tags/all');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!surveys || surveys.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys found</h3>
        <p className="text-sm text-gray-500 mb-6">
          {userRole === "client"
            ? "Create your first survey to get started"
            : "No surveys available at the moment"}
        </p>
        {userRole === "client" && onCreateSurvey && (
          <Button onClick={onCreateSurvey}>Create Survey</Button>
        )}
      </div>
    );
  }

  let filteredSurveys = surveys || [];

  // Apply status filter
  if (statusFilter !== "all") {
    filteredSurveys = filteredSurveys.filter(survey => survey.status === statusFilter);
  }

  // Apply tag filter
  if (selectedTags.length > 0) {
    filteredSurveys = filteredSurveys.filter(survey =>
      survey.tags && survey.tags.some(tag =>
        selectedTags.some(selectedTag =>
          tag.toLowerCase().includes(selectedTag.toLowerCase())
        )
      )
    );
  }

  // Sort surveys
  const sortedSurveys = [...filteredSurveys].sort((a, b) => {
    if (sortBy === "createdAt") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "points") {
      return b.points - a.points;
    }
    return 0;
  });


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

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4 justify-between">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
          <div className="space-y-1">
            <label htmlFor="status" className="text-sm font-medium text-gray-700">
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {/* Tags Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Filter by Tags</h3>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllTags}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </Button>
                )}
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
                      className={`cursor-pointer transition-colors ${selectedTags.includes(tag)
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

            {/* Status and Sort Filters */}
            <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4 justify-between">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                <div className="space-y-1">
                  <label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                    Sort By
                  </label>
                  <Select
                    value={sortBy}
                    onValueChange={setSortBy}
                  >
                    <SelectTrigger id="sort" className="w-full">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="points">Points</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {userRole === "client" && onCreateSurvey && (
                <div className="flex items-end">
                  <Button onClick={onCreateSurvey} className="w-full md:w-auto">
                    Create Survey
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">
              Sort By
            </label>
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger id="sort" className="w-full">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="points">Points</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {userRole === "client" && onCreateSurvey && (
          <div className="flex items-end">
            <Button onClick={onCreateSurvey} className="w-full md:w-auto">
              Create Survey
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedSurveys.map((survey) => (
          <SurveyCard key={survey.id} survey={survey} userRole={userRole} />
        ))}
      </div>
    </div>
  );
}
