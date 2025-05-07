import { MainLayout } from "@/components/layout/main-layout";
import { DoctorList } from "@/components/doctors/doctor-list";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Add doctor schema
const addDoctorSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().optional(),
  specialty: z.string().optional(),
});

type AddDoctorData = z.infer<typeof addDoctorSchema>;

export default function RepDoctors() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Add doctor form
  const form = useForm<AddDoctorData>({
    resolver: zodResolver(addDoctorSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      phone: "",
      specialty: "",
    },
  });

  // Add doctor mutation
  const addDoctorMutation = useMutation({
    mutationFn: async (data: AddDoctorData) => {
      const res = await apiRequest("POST", "/api/register", {
        ...data,
        role: "doctor",
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Doctor added",
        description: "Doctor has been added successfully",
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      
      // Now assign the doctor to this rep
      if (user?.roleDetails?.id) {
        assignDoctorToRep(data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign doctor to rep mutation
  const assignDoctorMutation = useMutation({
    mutationFn: async (doctorId: number) => {
      const res = await apiRequest("POST", `/api/representatives/${user?.roleDetails?.id}/doctors`, {
        doctorId
      });
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddDoctorData) => {
    addDoctorMutation.mutate(data);
  };

  const assignDoctorToRep = (doctorId: number) => {
    assignDoctorMutation.mutate(doctorId);
  };

  return (
    <MainLayout pageTitle="My Doctors" pageDescription="Manage and monitor the doctors assigned to you">
      <div className="space-y-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Doctor</DialogTitle>
              <DialogDescription>
                Add a new doctor to the platform and assign them to your account.
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
                        <Input placeholder="Enter doctor's full name" {...field} />
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

                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. Cardiology, Neurology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addDoctorMutation.isPending}>
                    {addDoctorMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Doctor"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <DoctorList
          userRole="rep"
          onAddDoctor={() => setIsDialogOpen(true)}
        />
      </div>
    </MainLayout>
  );
}
