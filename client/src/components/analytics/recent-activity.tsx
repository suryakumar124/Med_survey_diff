import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle, UserPlus, Award, FileText, Clock } from "lucide-react";

interface Activity {
  id: string;
  type: 'survey_completed' | 'doctor_added' | 'points_redeemed' | 'survey_created' | 'survey_ending';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'survey_completed':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </span>
        );
      case 'doctor_added':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <UserPlus className="w-5 h-5 text-blue-600" />
          </span>
        );
      case 'points_redeemed':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 bg-accent-100 rounded-full">
            <Award className="w-5 h-5 text-accent-500" />
          </span>
        );
      case 'survey_created':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
            <FileText className="w-5 h-5 text-purple-600" />
          </span>
        );
      case 'survey_ending':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full">
            <Clock className="w-5 h-5 text-amber-600" />
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
            <FileText className="w-5 h-5 text-gray-600" />
          </span>
        );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions and events in your account</CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto max-h-[350px]">
        <ul className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <li key={activity.id} className="px-6 py-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {activity.timestamp}
                  </p>
                </div>
                {activity.user && (
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback className="bg-primary-100 text-primary-800 text-xs">
                        {getInitials(activity.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="px-6 py-4 bg-gray-50">
        <div className="w-full text-center">
          <Button variant="link" className="text-primary-600">
            View all activity
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
