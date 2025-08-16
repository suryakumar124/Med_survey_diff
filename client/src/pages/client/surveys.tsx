import { MainLayout } from "@/components/layout/main-layout";
import { SurveyList } from "@/components/survey/survey-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useClient } from "@/hooks/use-client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";

// Create survey schema - will be dynamically validated based on user role
const createSurveySchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  points: z.number().min(1, { message: "Points must be at least 1" }),
  estimatedTime: z.number().min(1, { message: "Estimated time must be at least 1 minute" }),
  status: z.enum(["draft", "active"], { message: "Status is required" }),
  tags: z.array(z.string()).optional(),
  redemptionTypes: z.array(z.string()).min(1, { message: "At least one redemption type is required" }),
  clientId: z.number().optional(), // For admin users
});
type CreateSurveyData = z.infer<typeof createSurveySchema>;

export default function ClientSurveys() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const { client, isLoading: clientLoading } = useClient();
  
  // Fetch all clients for admin users
  const { data: allClients } = useQuery<Array<{id: number, name: string}>>({
    queryKey: ["/api/clients"],
    enabled: user?.role === "admin",
  });

  // Create survey form
  const form = useForm<CreateSurveyData>({
    resolver: zodResolver(createSurveySchema),
    defaultValues: {
      title: "",
      description: "",
      points: 100,
      estimatedTime: 10,
      status: "draft",
      tags: [],
      redemptionTypes: ["upi"],
    },
  });

  // Create survey mutation
  const createSurveyMutation = useMutation({
    mutationFn: async (data: CreateSurveyData) => {
      const res = await apiRequest("POST", "/api/surveys", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Survey created",
        description: "Your survey has been created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create survey",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateSurveyData) => {
    let clientId: number;
    
    if (user?.role === "admin") {
      // Admin users must select a client
      if (!data.clientId) {
        toast({
          title: "Error", 
          description: "Please select a client for this survey.",
          variant: "destructive"
        });
        return;
      }
      clientId = data.clientId;
    } else if (client) {
      // Client users use their own client ID
      clientId = client.id;
    } else {
      toast({
        title: "Error", 
        description: "Client information not available. Please try again.",
        variant: "destructive"
      });
      return;
    }

    createSurveyMutation.mutate({
      ...data,
      clientId,
      tags: data.tags || [],
      redemptionTypes: data.redemptionTypes || []
    });
  };

  return (
    <MainLayout pageTitle="Surveys" pageDescription="Create and manage your surveys">
      <div className="space-y-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hidden">Create Survey</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Survey</DialogTitle>
              <DialogDescription>
                Create a survey for doctors to complete and earn points.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter survey title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a description of your survey"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Explain what the survey is about and why doctors should take it.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {user?.role === "admin" && (
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client for this survey" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allClients?.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose which client this survey belongs to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Points doctors earn by completing this survey.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Time (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Approximate time to complete the survey.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter tags separated by commas (e.g., cardiology, diabetes, research)"
                            value={field.value?.join(", ") || ""}
                            onChange={(e) => {
                              const tags = e.target.value
                                .split(",")
                                .map(tag => tag.trim())
                                .filter(tag => tag.length > 0);
                              field.onChange(tags);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Help doctors find relevant surveys by adding descriptive tags.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="redemptionTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redemption Options</FormLabel>
                        <FormDescription>
                          Select how doctors can redeem points for this survey.
                        </FormDescription>
                        <div className="space-y-3">
                          {[
                            { value: "upi", label: "UPI Transfer" },
                            { value: "amazon", label: "Amazon Gift Card" },
                            { value: "paytm", label: "Paytm Wallet" },
                            { value: "bank", label: "Bank Transfer" }
                          ].map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={option.value}
                                checked={field.value?.includes(option.value) || false}
                                onCheckedChange={(checked) => {
                                  const currentTypes = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentTypes, option.value]);
                                  } else {
                                    field.onChange(currentTypes.filter(type => type !== option.value));
                                  }
                                }}
                              />
                              <label htmlFor={option.value} className="text-sm font-medium">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set as Draft to continue editing or Active to publish the survey.
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
                  <Button type="submit" disabled={createSurveyMutation.isPending}>
                    {createSurveyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Survey"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <SurveyList
          userRole="client"
          onCreateSurvey={() => setIsDialogOpen(true)}
        />
      </div>
    </MainLayout>
  );
}
