import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Award, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react";

interface Statistic {
  title: string;
  value: string | number;
  change?: number;
  icon: 'surveys' | 'doctors' | 'completed' | 'points';
}

interface StatisticsCardsProps {
  stats: Statistic[];
}

export function StatisticsCards({ stats }: StatisticsCardsProps) {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'surveys':
        return <FileText className="h-6 w-6 text-white" />;
      case 'doctors':
        return <Users className="h-6 w-6 text-white" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-white" />;
      case 'points':
        return <Award className="h-6 w-6 text-white" />;
      default:
        return <FileText className="h-6 w-6 text-white" />;
    }
  };

  const getIconBgColor = (iconType: string) => {
    switch (iconType) {
      case 'surveys':
        return 'bg-primary';
      case 'doctors':
        return 'bg-secondary-600';
      case 'completed':
        return 'bg-accent-500';
      case 'points':
        return 'bg-info';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-md ${getIconBgColor(stat.icon)}`}>
                {getIcon(stat.icon)}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.title}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    {/* {stat.change !== undefined && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change >= 0 ? (
                          <TrendingUp className="self-center shrink-0 h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="self-center shrink-0 h-5 w-5 text-red-500" />
                        )}
                        <span className="sr-only">{stat.change >= 0 ? 'Increased by' : 'Decreased by'}</span>
                        {Math.abs(stat.change)}%
                      </div>
                    )} */}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
