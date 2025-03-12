"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

const formSchema = z.object({
  idlFile: z.any(),
  methodSignatures: z.array(z.string()).min(1, "Select at least one method"),
  escrowAmount: z.number().min(0.1, "Minimum 0.1 SOL required"),
  strategy: z.enum(["short_term", "long_term"]),
  referralReward: z.number().min(0.01, "Minimum reward amount is 0.01").optional(),
  duration: z.number().optional(),
  dripAmount: z.number().optional(),
  baseReward: z.number().min(0.01, "Minimum reward amount is 0.01"),
  volumeThreshold: z.number().min(1, "Minimum threshold is 1"),
  volumeBonus: z.number().min(0.01, "Minimum bonus amount is 0.01"),
  timeTarget: z.number().min(1, "Minimum target is 1"),
  timeWindow: z.number().min(1, "Minimum window is 1 minute"),
  timeBonus: z.number().min(0.01, "Minimum bonus amount is 0.01"),
}).refine((data) => {
  if (data.strategy === "short_term") {
    return data.referralReward !== undefined && data.referralReward > 0;
  }
  return true;
}, {
  message: "Referral reward amount is required for short-term strategy",
  path: ["referralReward"],
});

export default function ProjectRegistration() {
  const [idlMethods, setIdlMethods] = useState<string[]>([]);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      strategy: "short_term",
      escrowAmount: 1,
      referralReward: 0.1,
      baseReward: 0.1,
      volumeThreshold: 10,
      volumeBonus: 0.05,
      timeTarget: 5,
      timeWindow: 60,
      timeBonus: 0.1,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // TODO: Implement project registration logic
      console.log(values);
      toast({
        title: "Success",
        description: "Project registered successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register project",
        variant: "destructive",
      });
    }
  };

  const handleIdlUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const idl = JSON.parse(e.target?.result as string);
          // Extract method signatures from IDL
          const methods = idl.instructions.map((i: any) => i.name);
          setIdlMethods(methods);
        } catch (error) {
          toast({
            title: "Error",
            description: "Invalid IDL file",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const strategy = form.watch("strategy");

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/" className="inline-flex items-center text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Project Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="idlFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IDL File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".json"
                          onChange={handleIdlUpload}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload your program&apos;s IDL file
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="methodSignatures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rewardable Methods</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange([...field.value, value])
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select methods" />
                        </SelectTrigger>
                        <SelectContent>
                          {idlMethods.map((method) => (
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
                  name="escrowAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escrow Amount (SOL)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Strategy</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="short_term" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Short Term
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="long_term" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Long Term
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {strategy === "short_term" && (
                  <FormField
                    control={form.control}
                    name="referralReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Referral Reward Amount
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Fixed amount awarded for each successful referral</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="50.00"
                              className="pl-7"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value))
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {strategy === "long_term" && (
                  <>
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
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

                    <FormField
                      control={form.control}
                      name="dripAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Drip Amount (SOL)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Volume Boost Settings</h3>
                  <FormField
                    control={form.control}
                    name="volumeThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Threshold Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
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

                  <FormField
                    control={form.control}
                    name="volumeBonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Reward (SOL)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Time Boost Settings</h3>
                  <FormField
                    control={form.control}
                    name="timeTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Referral Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
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

                  <FormField
                    control={form.control}
                    name="timeWindow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Window (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
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

                  <FormField
                    control={form.control}
                    name="timeBonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bonus Reward (SOL)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Register Project
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}