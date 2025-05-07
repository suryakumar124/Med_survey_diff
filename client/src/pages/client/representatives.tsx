import { MainLayout } from "@/components/layout/main-layout";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

// Define representative type
interface Representative {
  id: number;
  userId: number;
  clientId: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    username: string;
    status: string;
    profilePicture?: string;
  };
  doctorCount?: number;
}

// Add representative schema
const addRepresentativeSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().optional(),
});

type AddRepresentativeData = z.infer<typeof addRepresentativeSchema>;

export default function ClientRepresentatives() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch representatives
  const { data: representatives, isLoading } = useQuery<Representative[]>({
    queryKey: ["/api/representatives"],
  });

  // Add representative form
  const form = useForm<AddRepresentativeData>({
    resolver: zodResolver(addRepresentativeSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      phone: "",
    },
  });

  // Add representative mutation
  const addRepresentativeMutation = useMutation({
    mutationFn: async (data: AddRepresentativeData) => {
      const res = await apiRequest("POST", "/api/register", {
        ...data,
        role: "rep",
        clientId: user?.roleDetails?.id, // Assuming user has roleDetails with client id
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Representative added",
        description: "Representative has been added successfully",
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/representatives"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add representative",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddRepresentativeData) => {
    addRepresentativeMutation.mutate(data);
  };

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
    <MainLayout pageTitle="Representatives" pageDescription="Manage your sales representatives">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Sales Representatives</h2>
            <p className="text-sm text-gray-500">
              {representatives?.length || 0} {representatives?.length === 1 ? "representative" : "representatives"} in total
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Representative
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Representative</DialogTitle>
              <DialogDescription>
                Add a new sales representative to your team.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter representative's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Create a username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addRepresentativeMutation.isPending}>
                    {addRepresentativeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Representative"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {representatives && representatives.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Representative</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Doctors</TableHead>
                      <TableHead>Activation Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {representatives.map((rep) => (
                      <TableRow key={rep.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={rep.user?.profilePicture || ""} />
                              <AvatarFallback className="bg-primary-100 text-primary-800">
                                {rep.user?.name ? getInitials(rep.user.name) : "??"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{rep.user?.name}</div>
                              <div className="text-sm text-gray-500">{rep.user?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{rep.user ? getStatusBadge(rep.user.status) : "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-gray-700">
                            <Users className="h-4 w-4 mr-1 text-gray-400" />
                            {rep.doctorCount || 0} doctors
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div className="bg-primary h-2.5 rounded-full" style={{ width: "75%" }}></div>
                            </div>
                            <span className="text-sm">75%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No representatives found</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Add representatives to help onboard doctors
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
