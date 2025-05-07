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

interface SurveyListProps {
  userRole: string;
  onCreateSurvey?: () => void;
}

export function SurveyList({ userRole, onCreateSurvey }: SurveyListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");

  const { data: surveys, isLoading } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
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

  // Filter surveys based on status
  const filteredSurveys = statusFilter === "all" 
    ? surveys 
    : surveys.filter(survey => survey.status === statusFilter);

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4 justify-between">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
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

      <div className="grid grid-cols-1 gap-6">
        {sortedSurveys.map((survey) => (
          <SurveyCard key={survey.id} survey={survey} userRole={userRole} />
        ))}
      </div>
    </div>
  );
}
