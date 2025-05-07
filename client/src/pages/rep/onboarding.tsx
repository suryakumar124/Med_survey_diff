import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Loader2, Download, Upload, QrCode } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

// Individual onboarding schema
const individualSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().optional(),
  specialty: z.string().optional(),
});

// Batch onboarding schema
const batchSchema = z.object({
  csvData: z.string().min(1, { message: "CSV data is required" }),
});

// OTP activation schema
const otpSchema = z.object({
  doctorEmail: z.string().email({ message: "Invalid email address" }),
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
});

type IndividualFormData = z.infer<typeof individualSchema>;
type BatchFormData = z.infer<typeof batchSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export default function RepOnboarding() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("individual");

  // Individual onboarding form
  const individualForm = useForm<IndividualFormData>({
    resolver: zodResolver(individualSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      phone: "",
      specialty: "",
    },
  });

  // Batch onboarding form
  const batchForm = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      csvData: "",
    },
  });

  // OTP activation form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      doctorEmail: "",
      otp: "",
    },
  });

  // Individual onboarding mutation
  const individualMutation = useMutation({
    mutationFn: async (data: IndividualFormData) => {
      const res = await apiRequest("POST", "/api/register", {
        ...data,
        role: "doctor",
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Doctor added",
        description: "Doctor has been added successfully. An invitation email has been sent.",
      });
      individualForm.reset();
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

  // Batch onboarding mutation
  const batchMutation = useMutation({
    mutationFn: async (data: BatchFormData) => {
      // This would be an actual API call in a real application
      // For now, we'll just simulate a successful import
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, count: 5 };
    },
    onSuccess: () => {
      toast({
        title: "Doctors imported",
        description: "Doctors have been imported successfully. Invitation emails have been sent.",
      });
      batchForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to import doctors",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // OTP activation mutation
  const otpMutation = useMutation({
    mutationFn: async (data: OtpFormData) => {
      // This would be an actual API call in a real application
      // For now, we'll just simulate a successful activation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Doctor activated",
        description: "Doctor account has been activated successfully.",
      });
      otpForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to activate doctor",
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

  const onIndividualSubmit = (data: IndividualFormData) => {
    individualMutation.mutate(data);
  };

  const onBatchSubmit = (data: BatchFormData) => {
    batchMutation.mutate(data);
  };

  const onOtpSubmit = (data: OtpFormData) => {
    otpMutation.mutate(data);
  };

  const assignDoctorToRep = (doctorId: number) => {
    assignDoctorMutation.mutate(doctorId);
  };

  const downloadSampleCSV = () => {
    const csvContent = "name,email,phone,specialty\nJohn Doe,john@example.com,1234567890,Cardiology\nJane Smith,jane@example.com,0987654321,Neurology";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "sample_doctors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout pageTitle="Doctor Onboarding" pageDescription="Add new doctors to the platform">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Doctor Onboarding</CardTitle>
            <CardDescription>
              Choose how you want to onboard doctors to the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="individual">Individual</TabsTrigger>
                <TabsTrigger value="batch">Batch Import</TabsTrigger>
                <TabsTrigger value="otp">OTP Activation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="individual">
                <Form {...individualForm}>
                  <form onSubmit={individualForm.handleSubmit(onIndividualSubmit)} className="space-y-4">
                    <FormField
                      control={individualForm.control}
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
                        control={individualForm.control}
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
                        control={individualForm.control}
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
                        control={individualForm.control}
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
                        control={individualForm.control}
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
                      control={individualForm.control}
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

                    <Button type="submit" className="w-full" disabled={individualMutation.isPending}>
                      {individualMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding Doctor...
                        </>
                      ) : (
                        "Add Doctor & Send Invitation"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="batch">
                <Form {...batchForm}>
                  <form onSubmit={batchForm.handleSubmit(onBatchSubmit)} className="space-y-4">
                    <div className="flex justify-end mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadSampleCSV}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Sample CSV
                      </Button>
                    </div>
                    
                    <FormField
                      control={batchForm.control}
                      name="csvData"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CSV Data</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paste CSV data here: name,email,phone,specialty"
                              className="min-h-[200px] font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Format: name,email,phone,specialty (one doctor per line)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={batchMutation.isPending}>
                      {batchMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing Doctors...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Import Doctors & Send Invitations
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="otp">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Use this method when you're meeting a doctor in person. Generate an OTP and have them activate their account immediately.
                  </p>
                </div>
                
                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                    <FormField
                      control={otpForm.control}
                      name="doctorEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doctor's Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter doctor's email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                      <QrCode className="h-32 w-32 mx-auto mb-4 text-gray-600" />
                      <p className="text-sm text-gray-600 mb-4">
                        Scan this QR code or enter the OTP below to complete activation
                      </p>
                      <div className="text-2xl font-bold tracking-widest text-primary">
                        123456
                      </div>
                    </div>

                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enter OTP</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter 6-digit OTP code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={otpMutation.isPending}>
                      {otpMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Activating...
                        </>
                      ) : (
                        "Activate Doctor Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-gray-500">
              All doctors will be automatically assigned to your account once onboarded.
            </p>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
