import { Survey, SurveyWithTags } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Award, Users, ArrowRight, Bookmark } from "lucide-react";
import { Link } from "wouter";

// Extended survey type with analytics data
interface ExtendedSurvey extends Survey {
  responseCount?: number;
  completedCount?: number;
  completionRate?: number;
}

interface SurveyCardProps {
  survey: SurveyWithTags | ExtendedSurvey;
  userRole: string;
  partialResponse?: boolean;
}

export function SurveyCard({ survey, userRole, partialResponse = false }: SurveyCardProps) {
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

  // Format minutes to a readable time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hr${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
  };

  // Get the appropriate link based on user role
  const getSurveyLink = () => {
    if (userRole === "client") {
      return `/client/surveys/${survey.id}`;
    } else if (userRole === "doctor") {
      return `/doctor/available-surveys/${survey.id}`;
    } else if (userRole === "rep") {
      return `/rep/surveys/${survey.id}`;
    }
    return "#";
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="bg-white border-b p-4 flex flex-row justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary-100 rounded-full">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900 mb-1">{survey.title}</h3>
              {partialResponse && (
                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                  <Bookmark className="h-3 w-3 mr-1" />
                  In Progress
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {getStatusBadge(survey.status)}
              <span>•</span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(survey.estimatedTime)}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Award className="h-4 w-4 mr-1" />
                {survey.points} points
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-sm text-gray-600 mb-4 line-clamp-2">
          {survey.description || "No description provided."}
        </div>
        {/* Tags */}
        {('tags' in survey) && survey.tags && survey.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {survey.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Redemption Options for doctors */}
        { ('redemptionOptions' in survey) && survey.redemptionOptions && survey.redemptionOptions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">Redemption options:</p>
            <div className="flex flex-wrap gap-1">
              {survey.redemptionOptions.map((option, index) => (
                <Badge key={index} variant="outline" className="text-xs capitalize">
                  {option.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            {('responseCount' in survey && survey.responseCount !== undefined) ? (
              <span>{survey.responseCount} responses</span>
            ) : (
              <span>0 responses</span>
            )}
          </div>

          <div className="mt-2 sm:mt-0">
            <Link href={getSurveyLink()}>
              <Button
                variant={partialResponse ? "default" : "outline"}
                className="space-x-2"
              >
                <span>
                  {userRole === "doctor"
                    ? partialResponse ? "Resume Survey" : "Take Survey"
                    : "View Details"
                  }
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
