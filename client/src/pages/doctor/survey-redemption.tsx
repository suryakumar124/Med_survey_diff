import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Award, CreditCard, Wallet, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Validation schemas
const upiRedemptionSchema = z.object({
    redemptionType: z.literal("upi"),
    upiId: z.string().min(1, "UPI ID is required").regex(
        /^[\w.-]+@[\w.-]+$/,
        "Please enter a valid UPI ID (e.g., user@paytm, 9876543210@ybl)"
    ),
});

const amazonRedemptionSchema = z.object({
    redemptionType: z.literal("amazon"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long").regex(
        /^[+]?[\d\s-()]+$/,
        "Please enter a valid phone number"
    ),
});

const redemptionSchema = z.discriminatedUnion("redemptionType", [
    upiRedemptionSchema,
    amazonRedemptionSchema,
]);

type RedemptionFormData = z.infer<typeof redemptionSchema>;

interface SurveyResponse {
    id: number;
    doctorId: number;
    surveyId: number;
    completed: boolean;
    pointsEarned: number;
    startedAt: string;
    completedAt: string;
    survey: {
        id: number;
        title: string;
        description: string;
        points: number;
        estimatedTime: number;
        redemptionOptions: string[];
    };
    canRedeem: boolean;
    alreadyRedeemed: boolean;
    redemption?: any;
}

export default function SurveyRedemption() {
    const { surveyId } = useParams();
    const [, setLocation] = useLocation();
    const [selectedRedemptionType, setSelectedRedemptionType] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch survey response details
    const { data: surveyResponse, isLoading } = useQuery<SurveyResponse>({
        queryKey: [`/api/doctors/current/survey-response/${surveyId}`],
        queryFn: async () => {
            const res = await fetch(`/api/doctors/current/survey-response/${surveyId}`);
            if (!res.ok) throw new Error("Failed to fetch survey response");
            return res.json();
        },
        enabled: !!surveyId,
    });

    // Form setup
    const form = useForm<RedemptionFormData>({
        resolver: zodResolver(redemptionSchema),
        defaultValues: {
            redemptionType: "upi" as const,
        },
    });

    // Redemption mutation
    const redemptionMutation = useMutation({
        mutationFn: async (data: RedemptionFormData) => {
            let redemptionDetails: string;

            if (data.redemptionType === "upi") {
                redemptionDetails = data.upiId;
            } else {
                redemptionDetails = data.phoneNumber;
            }

            const res = await apiRequest("POST", `/api/surveys/${surveyId}/redeem`, {
                redemptionType: data.redemptionType,
                redemptionDetails: redemptionDetails,
            });
            return await res.json();
        },
        onSuccess: () => {
            toast({
                title: "Redemption request submitted",
                description: "Your redemption request has been submitted and will be processed within 24-48 hours.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/doctors/current/completed-surveys-with-redemption"] });
            queryClient.invalidateQueries({ queryKey: ["/api/doctors", "points"] });
            setLocation("/doctor/points");
        },
        onError: (error: any) => {
            toast({
                title: "Redemption failed",
                description: error.message || "Failed to submit redemption request",
                variant: "destructive",
            });
        },
    });

    const onSubmit = async (data: RedemptionFormData) => {
        setIsProcessing(true);
        try {
            await redemptionMutation.mutateAsync(data);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch (e) {
            return "Unknown date";
        }
    };

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hr${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
    };

    if (isLoading) {
        return (
            <MainLayout pageTitle="Redeem Survey Rewards" pageDescription="Processing...">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    if (!surveyResponse) {
        return (
            <MainLayout pageTitle="Survey Not Found" pageDescription="The requested survey could not be found">
                <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">Survey Response Not Found</h2>
                    <p className="mb-6">The survey response you're looking for doesn't exist or hasn't been completed yet.</p>
                    <Button onClick={() => setLocation("/doctor/points")} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Points
                    </Button>
                </div>
            </MainLayout>
        );
    }

    if (surveyResponse.alreadyRedeemed) {
        return (
            <MainLayout pageTitle="Already Redeemed" pageDescription="This survey has already been redeemed">
                <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">Already Redeemed</h2>
                    <p className="mb-6">You have already redeemed rewards for this survey.</p>
                    <Button onClick={() => setLocation("/doctor/points")} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Points
                    </Button>
                </div>
            </MainLayout>
        );
    }

    if (!surveyResponse.canRedeem || !surveyResponse.survey.redemptionOptions?.length) {
        return (
            <MainLayout pageTitle="Redemption Not Available" pageDescription="This survey doesn't support redemption">
                <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">Redemption Not Available</h2>
                    <p className="mb-6">This survey doesn't have any redemption options available.</p>
                    <Button onClick={() => setLocation("/doctor/points")} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Points
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout
            pageTitle="Redeem Survey Rewards"
            pageDescription="Redeem your earned rewards"
            backLink="/doctor/points"
            backLinkLabel="Back to Points"
        >
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Survey Information Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2">
                            <Award className="h-5 w-5 text-primary" />
                            <span>Survey Completed</span>
                        </CardTitle>
                        <CardDescription>Review your completed survey details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-lg">{surveyResponse.survey.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {surveyResponse.survey.description || "No description provided."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Award className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-amber-600">{surveyResponse.pointsEarned}</p>
                                    <p className="text-xs text-gray-500">Points Earned</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    </div>
                                    <p className="text-sm font-medium">Completed</p>
                                    <p className="text-xs text-gray-500">{formatDate(surveyResponse.completedAt)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">{formatTime(surveyResponse.survey.estimatedTime)}</p>
                                    <p className="text-xs text-gray-500">Duration</p>
                                </div>
                                <div className="text-center">
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                        Ready to Redeem
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Redemption Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Wallet className="h-5 w-5 text-primary" />
                            <span>Choose Redemption Method</span>
                        </CardTitle>
                        <CardDescription>
                            Select how you'd like to receive your {surveyResponse.pointsEarned} points (₹{surveyResponse.pointsEarned})
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Redemption Type Selection */}
                                <FormField
                                    control={form.control}
                                    name="redemptionType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Redemption Method</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    value={field.value}
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        setSelectedRedemptionType(value);
                                                        // Clear form when changing redemption type
                                                        if (value === "upi") {
                                                            form.setValue("phoneNumber", "");
                                                        } else {
                                                            form.setValue("upiId", "");
                                                        }
                                                    }}
                                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                >
                                                    {surveyResponse.survey.redemptionOptions.includes("upi") && (
                                                        <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                                                            <RadioGroupItem value="upi" id="upi" />
                                                            <Label htmlFor="upi" className="flex items-center space-x-3 cursor-pointer flex-1">
                                                                <Wallet className="h-5 w-5 text-green-600" />
                                                                <div>
                                                                    <p className="font-medium">UPI Transfer</p>
                                                                    <p className="text-sm text-gray-500">Direct transfer to your UPI ID</p>
                                                                </div>
                                                            </Label>
                                                        </div>
                                                    )}

                                                    {surveyResponse.survey.redemptionOptions.includes("amazon") && (
                                                        <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                                                            <RadioGroupItem value="amazon" id="amazon" />
                                                            <Label htmlFor="amazon" className="flex items-center space-x-3 cursor-pointer flex-1">
                                                                <CreditCard className="h-5 w-5 text-amber-600" />
                                                                <div>
                                                                    <p className="font-medium">Amazon Pay Balance</p>
                                                                    <p className="text-sm text-gray-500">Add to your Amazon Pay wallet</p>
                                                                </div>
                                                            </Label>
                                                        </div>
                                                    )}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Separator />

                                {/* UPI Details */}
                                {(form.watch("redemptionType") === "upi" || selectedRedemptionType === "upi") && (

                                    <FormField
                                        control={form.control}
                                        name="upiId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>UPI ID</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="yourname@paytm or 9876543210@ybl"
                                                        {...field}
                                                        className="font-mono"
                                                    />
                                                </FormControl>
                                                <p className="text-sm text-gray-500">
                                                    Enter your UPI ID (e.g., yourname@paytm, 9876543210@ybl, etc.)
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Amazon Pay Details */}
                                {(form.watch("redemptionType") === "amazon" || selectedRedemptionType === "amazon") && (
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="9876543210"
                                                        {...field}
                                                        type="tel"
                                                    />
                                                </FormControl>
                                                <p className="text-sm text-gray-500">
                                                    Enter the phone number linked to your Amazon account
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Important Notice */}
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Important:</strong> Processing typically takes 24-48 hours.
                                        Please ensure your payment details are correct as they cannot be changed once submitted.
                                        You will receive ₹{surveyResponse.pointsEarned} in your selected payment method.
                                    </AlertDescription>
                                </Alert>

                                {/* Submit Button */}
                                <div className="flex justify-end space-x-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setLocation("/doctor/points")}
                                        disabled={isProcessing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isProcessing || redemptionMutation.isPending}
                                        className="min-w-[120px]"
                                    >
                                        {isProcessing || redemptionMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Redeem ₹{surveyResponse.pointsEarned}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}