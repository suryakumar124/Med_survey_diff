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

// Create survey schema
const createSurveySchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  points: z.number().min(1, { message: "Points must be at least 1" }),
  estimatedTime: z.number().min(1, { message: "Estimated time must be at least 1 minute" }),
  status: z.enum(["draft", "active"], { message: "Status is required" }),
});

type CreateSurveyData = z.infer<typeof createSurveySchema>;

export default function ClientSurveys() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { client, isLoading: clientLoading } = useClient();

  // Create survey form
  const form = useForm<CreateSurveyData>({
    resolver: zodResolver(createSurveySchema),
    defaultValues: {
      title: "",
      description: "",
      points: 100,
      estimatedTime: 10,
      status: "draft",
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
    if (client) {
      createSurveyMutation.mutate({
        ...data,
        clientId: client.id
      });
    } else {
      toast({
        title: "Error", 
        description: "Client information not available. Please try again.",
        variant: "destructive"
      });
    }
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
