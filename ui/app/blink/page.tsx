"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";
import { blinkFormSchema } from "@/lib/types/form";
import { createBlink } from "@/actions/blinks";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/actions/projects";

export default function CreateBlink() {
  const { isPending, error, data: listedProjects = [] } = useQuery({
    queryKey: ["getProjects"],
    queryFn: () => {
        return getProjects();
    }
  });

  const { connected } = useWallet();
  const [referralCode, setReferralCode] = useState("");
  const [estimatedRewards, setEstimatedRewards] = useState({
    referrer: 0,
    referee: 0,
  });
  const [availableMethodSignatures, setAvailableMethodSignatures] = useState<string[]>([]);

  const form = useForm<z.infer<typeof blinkFormSchema>>({
    resolver: zodResolver(blinkFormSchema),
    defaultValues: {
      rewardShare: 50,
    },
  });

  // Watch for changes to the project field
  const selectedProjectId = form.watch("project");

  // Update available methods when project selection changes
  useEffect(() => {
    if (selectedProjectId) {
      // Find the selected project in mock data
      const selectedProject = listedProjects.find(
        (project) => project.program_id === selectedProjectId
      );
      
      if (selectedProject) {
        // Update available method signatures
        setAvailableMethodSignatures(selectedProject.method_signatures);
        
        // Reset method signature selection when project changes
        form.setValue("methodSignature", "");
      } else {
        setAvailableMethodSignatures([]);
      }
    } else {
      setAvailableMethodSignatures([]);
    }
  }, [selectedProjectId, form]);

  const onSubmit = async (values: z.infer<typeof blinkFormSchema>) => {
    try {
      // TODO: more robust implementation
      const refCode = "ref" + Math.random().toString(36).substring(2, 8);
      setReferralCode(refCode);
      
      // Calculate estimated rewards based on the reward share
      const totalReward = 1.0; // Example total reward
      const refereeShare = (values.rewardShare / 100) * totalReward;
      const referrerShare = totalReward - refereeShare;
      
      setEstimatedRewards({
        referrer: parseFloat(referrerShare.toFixed(4)),
        referee: parseFloat(refereeShare.toFixed(4)),
      });

      // TODO:: save to database
      const success = createBlink({
        refCode,
        programId: values.project,
        methodSignature: values.methodSignature,
      });

      if (!success) {
        throw new Error("Failed to create blink");
      }
      
      toast.success("Success", {
        description: "Blink created successfully",
      });
    } catch (error) {
      console.error("Error creating blink:", error);
      toast.error("Error", {
        description: "Failed to create blink",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied", {
      description: "Copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/" className="inline-flex items-center text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create Blink</CardTitle>
          </CardHeader>
          <CardContent>
            {connected ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="project"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Project</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {listedProjects.map((project) => (
                              <SelectItem key={project.program_id} value={project.program_id}>
                                {project.project_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="methodSignature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method Signature</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={availableMethodSignatures.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                availableMethodSignatures.length === 0
                                  ? "Select a project first"
                                  : "Select a method"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableMethodSignatures.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rewardShare"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referee Reward Share (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!selectedProjectId || !form.watch("methodSignature")}
                  >
                    Generate Blink
                  </Button>
                </form>
              </Form>
            ) : (
              <p className="text-center text-muted-foreground">
                Please connect your wallet to create a blink
              </p>
            )}

            {referralCode && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold">Generated Blink</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                    <code className="text-sm">{referralCode}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(referralCode)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="text-sm font-medium">Estimated Rewards</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Referrer</p>
                        <p className="text-lg font-semibold">
                          {estimatedRewards.referrer} SOL
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Referee</p>
                        <p className="text-lg font-semibold">
                          {estimatedRewards.referee} SOL
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Blink URL</h4>
                    <div className="flex items-center justify-between bg-background p-3 rounded-lg">
                      <code className="text-sm break-all">
                        https://example.com/ref/{referralCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            `https://example.com/ref/${referralCode}`
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}