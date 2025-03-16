"use client";

import { useState } from "react";
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

const formSchema = z.object({
  project: z.string().min(1, "Please select a project"),
  methodSignature: z.string().min(1, "Please select a method"),
  rewardShare: z.number().min(0).max(80, "Maximum share is 80%"),
});

// Mock data - replace with actual data from your backend
const mockProjects = [
  { id: "1", name: "Project A" },
  { id: "2", name: "Project B" },
];

const mockMethods = [
  { id: "1", name: "initialize" },
  { id: "2", name: "deposit" },
];

export default function CreateBlink() {
  const { connected } = useWallet();
  const [referralCode, setReferralCode] = useState("");
  const [estimatedRewards, setEstimatedRewards] = useState({
    referrer: 0,
    referee: 0,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rewardShare: 50,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // TODO: Implement blink creation logic
      const mockCode = "REF" + Math.random().toString(36).substring(2, 8);
      setReferralCode(mockCode);
      setEstimatedRewards({
        referrer: 0.5,
        referee: 0.5,
      });
      toast.success("Success",{
        description: "Blink created successfully",
      });
    } catch (error) {
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
                            {mockProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
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
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name}
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

                  <Button type="submit" className="w-full">
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