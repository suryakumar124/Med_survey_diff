import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatisticsCards } from "@/components/analytics/statistics-cards";
import { SurveyCompletionChart } from "@/components/analytics/survey-completion-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Survey, Doctor } from "@shared/schema";

export default function ClientAnalytics() {
  // Fetch surveys
  const { data: surveys, isLoading: surveysLoading } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
  });

  // Fetch doctors
  const { data: doctors, isLoading: doctorsLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const isLoading = surveysLoading || doctorsLoading;

  // Mock data for charts
  const completionChartData = [
    { name: "Jan", total: 40, completed: 30 },
    { name: "Feb", total: 52, completed: 42 },
    { name: "Mar", total: 61, completed: 50 },
    { name: "Apr", total: 45, completed: 35 },
    { name: "May", total: 48, completed: 40 },
    { name: "Jun", total: 58, completed: 48 },
    { name: "Jul", total: 70, completed: 53 },
  ];

  const doctorEngagementData = [
    { name: "Week 1", activeUsers: 32 },
    { name: "Week 2", activeUsers: 40 },
    { name: "Week 3", activeUsers: 45 },
    { name: "Week 4", activeUsers: 48 },
    { name: "Week 5", activeUsers: 52 },
    { name: "Week 6", activeUsers: 58 },
    { name: "Week 7", activeUsers: 62 },
    { name: "Week 8", activeUsers: 70 },
  ];

  const specialtyDistributionData = [
    { name: "Cardiology", value: 20 },
    { name: "Neurology", value: 15 },
    { name: "Oncology", value: 12 },
    { name: "Pediatrics", value: 18 },
    { name: "General", value: 25 },
    { name: "Other", value: 10 },
  ];

  const pointsRedemptionData = [
    { name: "Jan", upi: 2400, amazon: 1800 },
    { name: "Feb", upi: 1600, amazon: 2800 },
    { name: "Mar", upi: 3200, amazon: 2000 },
    { name: "Apr", upi: 2800, amazon: 2400 },
    { name: "May", upi: 1800, amazon: 2900 },
    { name: "Jun", upi: 2400, amazon: 3100 },
    { name: "Jul", upi: 3000, amazon: 2500 },
  ];

  // Colors for charts
  const COLORS = ['#2196F3', '#00BCD4', '#FF9800', '#F44336', '#4CAF50', '#9C27B0'];

  // Calculate statistics
  const totalSurveys = surveys?.length || 0;
  const activeSurveys = surveys?.filter(s => s.status === "active").length || 0;
  const registeredDoctors = doctors?.length || 0;
  const completedSurveys = surveys?.reduce((acc, survey) => acc + (survey.completedCount || 0), 0) || 0;
  const completionRate = totalSurveys > 0 ? Math.round((completedSurveys / totalSurveys) * 100) : 0;

  const stats = [
    {
      title: "Active Surveys",
      value: activeSurveys,
      change: 8,
      icon: "surveys"
    },
    {
      title: "Registered Doctors",
      value: registeredDoctors,
      change: 12,
      icon: "doctors"
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      change: 5,
      icon: "completed"
    },
    {
      title: "Points Redeemed",
      value: "8,320",
      change: 15,
      icon: "points"
    }
  ];

  return (
    <MainLayout pageTitle="Analytics" pageDescription="Insights and statistics about your platform activity">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <StatisticsCards stats={stats} />

          {/* Tabs for different analytics views */}
          <Tabs defaultValue="surveys">
            <TabsList className="mb-6">
              <TabsTrigger value="surveys">Survey Analytics</TabsTrigger>
              <TabsTrigger value="doctors">Doctor Analytics</TabsTrigger>
              <TabsTrigger value="points">Points & Redemptions</TabsTrigger>
            </TabsList>
            
            {/* Survey Analytics Tab */}
            <TabsContent value="surveys">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Survey Completion Chart */}
                <SurveyCompletionChart data={completionChartData} />
                
                {/* Survey by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Surveys by Status</CardTitle>
                    <CardDescription>Distribution of surveys by their current status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Active', value: activeSurveys },
                              { name: 'Draft', value: surveys?.filter(s => s.status === "draft").length || 0 },
                              { name: 'Closed', value: surveys?.filter(s => s.status === "closed").length || 0 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {specialtyDistributionData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Doctor Analytics Tab */}
            <TabsContent value="doctors">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Doctor Engagement Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Doctor Engagement</CardTitle>
                    <CardDescription>Weekly active doctor count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={doctorEngagementData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="activeUsers" name="Active Doctors" stroke="#2196F3" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Doctor Specialty Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Doctor Specialties</CardTitle>
                    <CardDescription>Distribution of doctors by medical specialty</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={specialtyDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {specialtyDistributionData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Points & Redemptions Tab */}
            <TabsContent value="points">
              <div className="grid grid-cols-1 gap-6">
                {/* Points Redemption Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Points Redemption Trend</CardTitle>
                    <CardDescription>Monthly trend of points redeemed by type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={pointsRedemptionData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="upi" name="UPI Transfer" stackId="1" stroke="#2196F3" fill="#2196F3" />
                          <Area type="monotone" dataKey="amazon" name="Amazon Gift Card" stackId="1" stroke="#FF9800" fill="#FF9800" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </MainLayout>
  );
}
