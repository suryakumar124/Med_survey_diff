import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Award, ArrowRight, CreditCard, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Redemption } from "@shared/schema";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

// Redemption form schema
const redemptionSchema = z.object({
  points: z.number().min(100, { message: "Minimum redemption is 100 points" }),
  redemptionType: z.enum(["upi", "amazon"], { message: "Please select a redemption method" }),
  redemptionDetails: z.string().min(1, { message: "Redemption details are required" }),
});

type RedemptionFormData = z.infer<typeof redemptionSchema>;

interface PointsInfo {
  totalPoints: number;
  redeemedPoints: number;
  availablePoints: number;
  redemptions: Redemption[];
}

export default function DoctorPoints() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Get the doctor ID from the user's role
  const { data: doctorInfo } = useQuery<{ id: number }>({
    queryKey: ["/api/doctors/current"],
    enabled: !!user && user.role === "doctor",
  });

  // Fetch points information
  const { data: pointsInfo, isLoading } = useQuery<PointsInfo>({
    queryKey: ["/api/doctors", doctorInfo?.id, "points"],
    enabled: !!doctorInfo?.id,
  });

  // Redemption form
  const form = useForm<RedemptionFormData>({
    resolver: zodResolver(redemptionSchema),
    defaultValues: {
      points: 100,
      redemptionType: "amazon",
      redemptionDetails: "",
    },
  });

  // Watch the points value to validate against available points
  const watchedPoints = form.watch("points");
  const watchedRedemptionType = form.watch("redemptionType");

  // Points redemption mutation
  const redeemMutation = useMutation({
    mutationFn: async (data: RedemptionFormData) => {
      const res = await apiRequest(
        "POST", 
        `/api/doctors/${user?.roleDetails?.id}/redeem`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Redemption successful",
        description: "Your points have been successfully redeemed.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/doctors", user?.roleDetails?.id, "points"] });
      setActiveTab("history");
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RedemptionFormData) => {
    if (!pointsInfo) return;
    
    // Validate against available points
    if (data.points > pointsInfo.availablePoints) {
      toast({
        title: "Insufficient points",
        description: `You only have ${pointsInfo.availablePoints} points available.`,
        variant: "destructive",
      });
      return;
    }
    
    redeemMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return "Unknown date";
    }
  };

  // Get the redemption type placeholder text
  const getRedemptionDetailsPlaceholder = (type: string) => {
    if (type === "upi") {
      return "Enter your UPI ID (e.g., name@bank)";
    } else if (type === "amazon") {
      return "Enter your email address for Amazon gift card";
    }
    return "Enter redemption details";
  };

  if (isLoading) {
    return (
      <MainLayout pageTitle="My Points" pageDescription="Manage and redeem your earned points">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!pointsInfo) {
    return (
      <MainLayout pageTitle="My Points" pageDescription="Manage and redeem your earned points">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="py-8">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Points information not available</h3>
              <p className="text-gray-500">
                Unable to retrieve your points information at this time. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="My Points" pageDescription="Manage and redeem your earned points">
      <div className="space-y-6">
        {/* Points Overview Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-primary-50 rounded-lg">
                <Award className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-2xl font-bold text-primary">{pointsInfo.totalPoints}</h3>
                <p className="text-sm text-gray-600">Total Points Earned</p>
              </div>
              
              <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg">
                <Wallet className="h-10 w-10 text-green-600 mb-2" />
                <h3 className="text-2xl font-bold text-green-600">{pointsInfo.availablePoints}</h3>
                <p className="text-sm text-gray-600">Available Points</p>
              </div>
              
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                <CreditCard className="h-10 w-10 text-gray-600 mb-2" />
                <h3 className="text-2xl font-bold text-gray-600">{pointsInfo.redeemedPoints}</h3>
                <p className="text-sm text-gray-600">Redeemed Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Points Overview</TabsTrigger>
            <TabsTrigger value="redeem">Redeem Points</TabsTrigger>
            <TabsTrigger value="history">Redemption History</TabsTrigger>
          </TabsList>
          
          {/* Points Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Points Summary</CardTitle>
                <CardDescription>Overview of your points activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Points Usage</span>
                      <span className="text-sm text-gray-500">
                        {pointsInfo.redeemedPoints} / {pointsInfo.totalPoints} redeemed
                      </span>
                    </div>
                    <Progress value={(pointsInfo.redeemedPoints / pointsInfo.totalPoints) * 100} className="h-2" />
                  </div>
                  
                  <div className="rounded-lg border overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="text-sm font-medium">Points Breakdown</h3>
                    </div>
                    <div className="divide-y">
                      <div className="flex justify-between px-4 py-3">
                        <span className="text-sm">Total Points Earned</span>
                        <span className="text-sm font-medium">{pointsInfo.totalPoints}</span>
                      </div>
                      <div className="flex justify-between px-4 py-3">
                        <span className="text-sm">Points Redeemed</span>
                        <span className="text-sm font-medium">{pointsInfo.redeemedPoints}</span>
                      </div>
                      <div className="flex justify-between px-4 py-3 bg-green-50">
                        <span className="text-sm font-medium">Available Balance</span>
                        <span className="text-sm font-medium text-green-600">{pointsInfo.availablePoints}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setActiveTab("redeem")} 
                  disabled={pointsInfo.availablePoints < 100}
                  className="w-full"
                >
                  {pointsInfo.availablePoints < 100 
                    ? "Earn more points to redeem" 
                    : "Redeem Points"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Redeem Points Tab */}
          <TabsContent value="redeem">
            <Card>
              <CardHeader>
                <CardTitle>Redeem Your Points</CardTitle>
                <CardDescription>
                  You have {pointsInfo.availablePoints} points available to redeem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points to Redeem</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter points amount" 
                              min={100}
                              max={pointsInfo.availablePoints}
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum redemption: 100 points. You have {pointsInfo.availablePoints} points available.
                          </FormDescription>
                          <FormMessage />
                          {watchedPoints > pointsInfo.availablePoints && (
                            <p className="text-sm font-medium text-destructive">
                              You don't have enough points available.
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="redemptionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Redemption Method</FormLabel>
                          <div className="grid grid-cols-2 gap-4">
                            <div 
                              className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer ${
                                field.value === "amazon" ? "border-primary bg-primary-50" : "border-gray-200"
                              }`}
                              onClick={() => field.onChange("amazon")}
                            >
                              <div className="p-2 bg-amber-100 rounded-full mb-2">
                                <CreditCard className="h-6 w-6 text-amber-600" />
                              </div>
                              <span className="text-sm font-medium">Amazon Gift Card</span>
                            </div>
                            <div 
                              className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer ${
                                field.value === "upi" ? "border-primary bg-primary-50" : "border-gray-200"
                              }`}
                              onClick={() => field.onChange("upi")}
                            >
                              <div className="p-2 bg-green-100 rounded-full mb-2">
                                <Wallet className="h-6 w-6 text-green-600" />
                              </div>
                              <span className="text-sm font-medium">UPI Transfer</span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="redemptionDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {watchedRedemptionType === "upi" ? "UPI ID" : "Email Address"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={getRedemptionDetailsPlaceholder(watchedRedemptionType)} 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            {watchedRedemptionType === "upi" 
                              ? "Enter your UPI ID where you want to receive the money" 
                              : "Enter the email address where you want to receive the Amazon gift card"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={redeemMutation.isPending || watchedPoints > pointsInfo.availablePoints}
                    >
                      {redeemMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Redeem Points"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Redemption History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Redemption History</CardTitle>
                <CardDescription>Your previous point redemptions</CardDescription>
              </CardHeader>
              <CardContent>
                {pointsInfo.redemptions && pointsInfo.redemptions.length > 0 ? (
                  <div className="space-y-4">
                    {pointsInfo.redemptions.map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-100 rounded-full">
                            {redemption.redemptionType === "amazon" ? (
                              <CreditCard className="h-5 w-5 text-amber-600" />
                            ) : (
                              <Wallet className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {redemption.redemptionType === "amazon" ? "Amazon Gift Card" : "UPI Transfer"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {redemption.points} points • {formatDate(redemption.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            redemption.status === "completed" 
                              ? "bg-green-100 text-green-800" 
                              : redemption.status === "pending" 
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No redemptions yet</h3>
                    <p className="text-gray-500">
                      You haven't redeemed any points yet. Go to the Redeem Points tab to get started.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
