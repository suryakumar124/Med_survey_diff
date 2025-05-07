import { MainLayout } from "@/components/layout/main-layout";
import { DoctorList } from "@/components/doctors/doctor-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Upload, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Add doctor schema
const addDoctorSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().optional(),
  specialty: z.string().optional(),
});

// Import doctors schema
const importDoctorsSchema = z.object({
  csvData: z.string().min(1, { message: "CSV data is required" }),
});

type AddDoctorData = z.infer<typeof addDoctorSchema>;
type ImportDoctorsData = z.infer<typeof importDoctorsSchema>;

export default function ClientDoctors() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("add");

  // Add doctor form
  const addDoctorForm = useForm<AddDoctorData>({
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

  // Import doctors form
  const importDoctorsForm = useForm<ImportDoctorsData>({
    resolver: zodResolver(importDoctorsSchema),
    defaultValues: {
      csvData: "",
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
    onSuccess: () => {
      toast({
        title: "Doctor added",
        description: "Doctor has been added successfully",
      });
      setIsDialogOpen(false);
      addDoctorForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import doctors mutation
  const importDoctorsMutation = useMutation({
    mutationFn: async (data: ImportDoctorsData) => {
      // This would be an actual API call in a real application
      // For now, we'll just simulate a successful import
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, count: 5 };
    },
    onSuccess: () => {
      toast({
        title: "Doctors imported",
        description: "Doctors have been imported successfully",
      });
      setIsDialogOpen(false);
      importDoctorsForm.reset();
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

  const onAddDoctorSubmit = (data: AddDoctorData) => {
    addDoctorMutation.mutate(data);
  };

  const onImportDoctorsSubmit = (data: ImportDoctorsData) => {
    importDoctorsMutation.mutate(data);
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
    <MainLayout pageTitle="Doctors" pageDescription="Manage doctors on your platform">
      <div className="space-y-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hidden">Add Doctor</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Doctors</DialogTitle>
              <DialogDescription>
                Add doctors individually or import multiple doctors via CSV.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="add">Add Individual</TabsTrigger>
                <TabsTrigger value="import">Import CSV</TabsTrigger>
              </TabsList>
              
              <TabsContent value="add">
                <Form {...addDoctorForm}>
                  <form onSubmit={addDoctorForm.handleSubmit(onAddDoctorSubmit)} className="space-y-4">
                    <FormField
                      control={addDoctorForm.control}
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
                        control={addDoctorForm.control}
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
                        control={addDoctorForm.control}
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
                        control={addDoctorForm.control}
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
                        control={addDoctorForm.control}
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
                      control={addDoctorForm.control}
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
              </TabsContent>
              
              <TabsContent value="import">
                <Form {...importDoctorsForm}>
                  <form onSubmit={importDoctorsForm.handleSubmit(onImportDoctorsSubmit)} className="space-y-4">
                    <div className="flex items-center justify-end mb-2">
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
                      control={importDoctorsForm.control}
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

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={importDoctorsMutation.isPending}>
                        {importDoctorsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Import Doctors
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <DoctorList
          userRole="client"
          onAddDoctor={() => setIsDialogOpen(true)}
        />
      </div>
    </MainLayout>
  );
}
