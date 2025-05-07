import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Loader2, Camera, User, Mail, Phone, Stethoscope, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Profile update schema
const profileSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  specialty: z.string().optional(),
});

// Password update schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Confirm password is required" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function DoctorProfile() {
  const { user } = useAuth();

  // Profile update form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      specialty: user?.roleDetails?.specialty || "",
    },
  });

  // Password update form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PATCH", `/api/user`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const res = await apiRequest("POST", `/api/user/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    profileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    passwordMutation.mutate(data);
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) {
    return (
      <MainLayout pageTitle="My Profile" pageDescription="Manage your account settings">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">User information not available</h3>
              <p className="text-gray-500">
                Unable to retrieve your profile information at this time. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="My Profile" pageDescription="Manage your account settings">
      <div className="space-y-6">
        {/* Profile Overview Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.profilePicture} />
                  <AvatarFallback className="bg-primary-100 text-primary-800 text-xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                  <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">
                    Doctor
                  </Badge>
                  {user.roleDetails?.specialty && (
                    <Badge variant="outline">
                      {user.roleDetails.specialty}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="personal">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form id="profile-form" onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                              <Input className="pl-10" type="email" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                <Input className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Optional: Add your contact number
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="specialty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Specialty</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                <Input className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              E.g., Cardiology, Neurology, etc.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  form="profile-form" 
                  disabled={profileMutation.isPending}
                >
                  {profileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form id="password-form" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                              <Input className="pl-10" type="password" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                              <Input className="pl-10" type="password" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Password must be at least 6 characters long
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                              <Input className="pl-10" type="password" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  form="password-form" 
                  disabled={passwordMutation.isPending}
                >
                  {passwordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// Custom Badge component needed for profile display
function Badge({ 
  children, 
  className, 
  variant = "default"
}: { 
  children: React.ReactNode; 
  className?: string; 
  variant?: "default" | "outline"; 
}) {
  return (
    <span 
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        variant === "outline" 
          ? "border border-gray-300 text-gray-700" 
          : className || "bg-primary/10 text-primary"
      }`}
    >
      {children}
    </span>
  );
}
