import { Doctor, User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

interface DoctorWithUser extends Doctor {
  user: User;
}

interface DoctorListProps {
  userRole: string;
  onAddDoctor?: () => void;
}

export function DoctorList({ userRole, onAddDoctor }: DoctorListProps) {
  const { data: doctors, isLoading } = useQuery<DoctorWithUser[]>({
    queryKey: ["/api/doctors"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
        <p className="text-sm text-gray-500 mb-6">
          {userRole === "client" || userRole === "rep"
            ? "Add doctors to get started"
            : "No doctors available"
        }
        </p>
        {(userRole === "client" || userRole === "rep") && onAddDoctor && (
          <Button onClick={onAddDoctor}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
        )}
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get the appropriate link based on user role
  const getDoctorLink = (doctorId: number) => {
    if (userRole === "client") {
      return `/client/doctors/${doctorId}`;
    } else if (userRole === "rep") {
      return `/rep/doctors/${doctorId}`;
    }
    return "#";
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Doctors</h2>
          <p className="text-sm text-gray-500">
            {doctors.length} {doctors.length === 1 ? "doctor" : "doctors"} in total
          </p>
        </div>
        {(userRole === "client" || userRole === "rep") && onAddDoctor && (
          <Button onClick={onAddDoctor}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
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
                        <div className="text-sm text-gray-500">{doctor.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{doctor.specialty || "—"}</TableCell>
                  <TableCell>{getStatusBadge(doctor.user.status)}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{doctor.totalPoints}</span>
                    <span className="text-gray-500 ml-1">({doctor.totalPoints - doctor.redeemedPoints} available)</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={getDoctorLink(doctor.id)}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
