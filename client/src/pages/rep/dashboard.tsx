import { MainLayout } from "@/components/layout/main-layout";
import { StatisticsCards } from "@/components/analytics/statistics-cards";
import { RecentActivity } from "@/components/analytics/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";
import { Doctor, User } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface DoctorWithUser extends Doctor {
  user: User;
}

export default function RepDashboard() {
  // Fetch doctors under this rep
  const { data: doctors, isLoading } = useQuery<DoctorWithUser[]>({
    queryKey: ["/api/doctors"],
  });

  const activeDoctors = doctors?.filter(doctor => doctor.user.status === "active") || [];
  const pendingDoctors = doctors?.filter(doctor => doctor.user.status === "pending") || [];
  const inactiveDoctors = doctors?.filter(doctor => doctor.user.status === "inactive") || [];

  // Recent activity data
  const recentActivity = [
    {
      id: "1",
      type: "doctor_added",
      title: "You onboarded Dr. Emily Wilson",
      description: "New Neurologist",
      timestamp: "2 hours ago",
      user: { name: "Dr. Emily Wilson" }
    },
    {
      id: "2",
      type: "survey_completed",
      title: "Dr. Michael Chen completed Patient Demographics Survey",
      description: "Earned 150 points",
      timestamp: "Yesterday",
      user: { name: "Dr. Michael Chen" }
    },
    {
      id: "3",
      type: "points_redeemed",
      title: "Dr. Michael Chen redeemed 500 points",
      description: "Amazon Gift Card",
      timestamp: "3 days ago",
      user: { name: "Dr. Michael Chen" }
    },
    {
      id: "4",
      type: "survey_ending",
      title: "Cardiovascular Treatments Survey ending soon",
      description: "Remind your doctors to complete it",
      timestamp: "Today"
    }
  ];

  // Stats data
  const stats = [
    {
      title: "Total Doctors",
      value: doctors?.length || 0,
      icon: "doctors"
    },
    {
      title: "Active Doctors",
      value: activeDoctors.length,
      change: 8,
      icon: "doctors"
    },
    {
      title: "Pending Activations",
      value: pendingDoctors.length,
      change: -2,
      icon: "doctors"
    }
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-400">Pending</Badge>;
      case "inactive":
        return <Badge variant="outline" className="text-gray-500">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayout pageTitle="Representative Dashboard" pageDescription="Manage and track your assigned doctors">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <StatisticsCards stats={stats} />

          {/* Main Content Sections */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Doctor Management</CardTitle>
                  <Link href="/rep/onboarding">
                    {/* <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Doctor
                    </Button> */}
                  </Link>
                </CardHeader>
                <CardContent>
                  {doctors && doctors.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Surveys</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {doctors.slice(0, 5).map((doctor) => (
                          <TableRow key={doctor.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={doctor.user.profilePicture || ""} />
                                  <AvatarFallback className="bg-primary-100 text-primary-800">
                                    {getInitials(doctor.user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{doctor.user.name}</div>
                                  <div className="text-xs text-gray-500">{doctor.specialty || "—"}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(doctor.user.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                <div className="text-xs text-gray-500">5/8 completed</div>
                                <Progress value={62.5} className="h-2" />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/rep/doctors/${doctor.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Add doctors to get started with onboarding
                      </p>
                      <Link href="/rep/onboarding">
                        <Button>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Doctor
                        </Button>
                      </Link>
                    </div>
                  )}
                  {doctors && doctors.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link href="/rep/doctors">
                        <Button variant="outline">View All Doctors</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="md:col-span-1">
              {/* <RecentActivity activities={recentActivity} /> */}
            </div>
          </div>

          {/* Pending Activations */}
          {pendingDoctors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Activations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingDoctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-medium">{doctor.user.name}</p>
                          <p className="text-sm text-gray-600">{doctor.user.email}</p>
                        </div>
                      </div>
                      <Link href={`/rep/doctors/${doctor.id}`}>
                        <Button size="sm">Send a reminder</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </MainLayout>
  );
}
