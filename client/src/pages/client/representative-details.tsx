import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Mail, Phone, Users } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Doctor, User } from "@shared/schema";
import { format } from "date-fns";

interface Representative {
    id: number;
    userId: number;
    clientId: number;
    createdAt: string;
    updatedAt: string;
    user?: User;
    doctorCount?: number;
}

interface DoctorWithUser extends Doctor {
    user: User;
}

export default function RepresentativeDetails() {
    const { id } = useParams();
    const repId = parseInt(id as string);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

    // Fetch representative details
    const { data: representative, isLoading: repLoading } = useQuery<Representative>({
        queryKey: ["/api/representatives", repId],
        queryFn: async () => {
            const res = await fetch(`/api/representatives/${repId}`);
            if (!res.ok) throw new Error("Failed to fetch representative details");
            return res.json();
        },
        enabled: !!repId && !isNaN(repId),
    });

    const { data: assignedDoctors = [], isLoading: doctorsLoading } = useQuery<DoctorWithUser[]>({
        queryKey: ["/api/representatives", repId, "doctors"],
        queryFn: async () => {
            const res = await fetch(`/api/representatives/${repId}/doctors`);
            if (!res.ok) throw new Error("Failed to fetch assigned doctors");
            return res.json();
        },
        enabled: !!repId && !isNaN(repId),
    });

    // Fetch all doctors for the client that aren't assigned to this rep
    // Fetch all doctors for the client that aren't assigned to this rep
    const { data: availableDoctors = [], isLoading: availableDoctorsLoading } = useQuery<DoctorWithUser[]>({
        queryKey: ["/api/client/doctors/available", repId],
        queryFn: async () => {
            const res = await fetch(`/api/doctors`);
            if (!res.ok) throw new Error("Failed to fetch doctors");
            const allDoctors = await res.json();

            // Filter out doctors that are already assigned to this rep
            const assignedDoctorIds = new Set(assignedDoctors.map(d => d.id));
            return allDoctors.filter((doctor: DoctorWithUser) => !assignedDoctorIds.has(doctor.id));
        },
        enabled: !!repId && !isNaN(repId) && !doctorsLoading,
    });

    // Assign doctor to rep mutation
    const assignDoctorMutation = useMutation({
        mutationFn: async (doctorId: number) => {
            const res = await apiRequest("POST", `/api/representatives/${repId}/doctors`, {
                doctorId
            });
            return await res.json();
        },
        onSuccess: () => {
            toast({
                title: "Doctor assigned",
                description: "Doctor has been assigned to the representative successfully",
            });
            setIsAssignDialogOpen(false);
            setSelectedDoctorId("");

            // Invalidate both queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ["/api/representatives", repId, "doctors"] });
            queryClient.invalidateQueries({ queryKey: ["/api/client/doc tors/available", repId] });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to assign doctor",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleAssignDoctor = () => {
        if (!selectedDoctorId) {
            toast({
                title: "No doctor selected",
                description: "Please select a doctor to assign",
                variant: "destructive",
            });
            return;
        }

        assignDoctorMutation.mutate(parseInt(selectedDoctorId));
    };

    const getInitials = (name: string) => {
        if (!name) return "??";
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

    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return "N/A";
        return format(new Date(dateString), "MMM d, yyyy");
    };

    if (repLoading) {
        return (
            <MainLayout pageTitle="Representative Details" pageDescription="Loading...">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    if (!representative) {
        return (
            <MainLayout pageTitle="Representative Not Found" pageDescription="The requested representative could not be found">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">Representative Not Found</h2>
                    <p className="mb-6">The representative you're looking for doesn't exist or you don't have permission to view it.</p>
                    <Link href="/client/representatives">
                        <Button>Back to Representatives</Button>
                    </Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout
            pageTitle={representative.user?.name || "Representative"}
            pageDescription="Representative profile and assigned doctors"
            backLink="/client/representatives"
            backLinkLabel="Back to Representatives"
        >
            <div className="space-y-6">
                {/* Representative profile card */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={representative.user?.profilePicture || ""} />
                                    <AvatarFallback className="bg-primary-100 text-primary-800 text-xl">
                                        {getInitials(representative.user?.name || "")}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-2xl">{representative.user?.name || "Unknown"}</CardTitle>
                                    <CardDescription className="flex items-center mt-1">
                                        Sales Representative
                                        {representative.user && <div className="ml-4">{getStatusBadge(representative.user.status)}</div>}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <Button variant="outline" className="space-x-2">
                                    <Mail className="h-4 w-4" />
                                    <span>Email</span>
                                </Button>
                                <Button variant="outline" className="space-x-2">
                                    <Phone className="h-4 w-4" />
                                    <span>Call</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center space-x-3">
                                <Users className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">Assigned Doctors</p>
                                    <p className="text-sm text-gray-500">
                                        {representative.doctorCount || assignedDoctors.length} doctors
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Mail className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <p className="text-sm text-gray-500">{representative.user?.email || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Phone className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">Phone</p>
                                    <p className="text-sm text-gray-500">{representative.user?.phone || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assigned Doctors */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Assigned Doctors</CardTitle>
                            <CardDescription>Doctors assigned to this representative</CardDescription>
                        </div>
                        <Button onClick={() => setIsAssignDialogOpen(true)}>
                            Assign Doctor
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {doctorsLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : assignedDoctors.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                No doctors assigned to this representative yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[250px]">Doctor</TableHead>
                                            <TableHead>Specialty</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assignedDoctors.map((doctor) => (
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
                                                    <Link href={`/client/doctors/${doctor.id}`}>
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
                        )}
                    </CardContent>
                </Card>

                {/* Add Additional Info Cards as needed */}

                {/* Assign Doctor Dialog */}
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Assign Doctor</DialogTitle>
                            <DialogDescription>
                                Assign a doctor to this representative
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Select
                                value={selectedDoctorId}
                                onValueChange={setSelectedDoctorId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a doctor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableDoctorsLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    ) : availableDoctors.length === 0 ? (
                                        <div className="p-2 text-center text-sm text-gray-500">
                                            No available doctors found
                                        </div>
                                    ) : (
                                        availableDoctors.map((doctor) => (
                                            <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                {doctor.user.name} {doctor.specialty ? `(${doctor.specialty})` : ""}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAssignDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAssignDoctor}
                                disabled={!selectedDoctorId || assignDoctorMutation.isPending}
                            >
                                {assignDoctorMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    "Assign Doctor"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}