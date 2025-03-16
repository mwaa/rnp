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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { ArrowRight, ArrowLeft, HelpCircle, Loader2, X } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { projectFormSchema } from "@/lib/types/form";
import { saveProject } from "@/actions/projects";


export default function ProjectRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [idlMethods, setIdlMethods] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      methodSignatures: [],
      methodSettings: [],
      escrowAmount: 1,
    },
    mode: "onChange",
  });

  const handleIdlUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const idl = JSON.parse(e.target?.result as string);
          const methods = idl.instructions.map((i: any) => i.name);
          setIdlMethods(methods);
          form.setValue("idlFile", file);
          form.trigger("idlFile");
        } catch (error) {
          toast.error("Error", {
            description: "Invalid IDL file"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const initializeMethodSettings = (methods: string[]) => {
    const settings = methods.map(method => ({
      methodName: method,
      strategy: "short_term" as const,
      referralReward: 0.0001,
      enableVolumeBoost: false,
      enableTimeBoost: false,
    }));
    form.setValue("methodSettings", settings);
  };

  const validateCurrentStep = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger(["idlFile", "methodSignatures"]);
      if (isValid) {
        const methods = form.getValues("methodSignatures");
        initializeMethodSettings(methods);
      }
      return isValid;
    }
    
    if (currentStep === 2) {
      return form.trigger("methodSettings");
    }
    
    if (currentStep === 3) {
      return form.trigger("escrowAmount");
    }

    return false;
  };

  const onSubmit = async (values: z.infer<typeof projectFormSchema>) => {
    if (currentStep < 3) {
      const isValid = await validateCurrentStep();
      if (isValid) {
        setCurrentStep(prev => prev + 1);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement project registration logic
      console.log(values);
      // Call the server action to register the project
      const success = await saveProject(values);
      if (success) {
        toast.success("Success", {
          description: "Project registered successfully",
        });
      } else {
        throw new Error("Failed to register project");
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to register project",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === currentStep
                ? "bg-primary text-primary-foreground"
                : step < currentStep
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-1 ${
                step < currentStep ? "bg-primary/20" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => {

    return (
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="projectName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter project name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="idlFile"
          render={() => (
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
              <div className="space-y-2">
                <Select
                  onValueChange={(value) => {
                    if (!field.value.includes(value)) {
                      const newMethods = [...field.value, value];
                      field.onChange(newMethods);
                      form.trigger("methodSignatures");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select methods" />
                  </SelectTrigger>
                  <SelectContent>
                    {idlMethods
                      .filter(method => !field.value.includes(method))
                      .map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-2">
                  {field.value.map((method) => (
                    <Badge
                      key={method}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {method}
                      <button
                        type="button"
                        onClick={() => {
                          const newMethods = field.value.filter((m) => m !== method);
                          field.onChange(newMethods);
                          form.trigger("methodSignatures");
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };

  const renderStep2 = () => {
    const selectedMethods = form.watch("methodSignatures");
    
    return (
      <div className="space-y-8">
        {selectedMethods.map((methodName, index) => (
          <div key={methodName} className="space-y-6 border-b pb-6 last:border-0">
            <h3 className="text-lg font-semibold">{methodName}</h3>
            
            <FormField
              control={form.control}
              name={`methodSettings.${index}.strategy`}
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

            <FormField
              control={form.control}
              name={`methodSettings.${index}.referralReward`}
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
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground mr-2">
                        SOL
                      </span>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="0.01"
                        className="pl-14"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(value);
                          form.trigger(`methodSettings.${index}.referralReward`);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch(`methodSettings.${index}.strategy`) === "long_term" && (
              <FormField
                control={form.control}
                name={`methodSettings.${index}.dripDays`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                          form.trigger(`methodSettings.${index}.dripDays`);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && form.watch(`methodSettings.${index}.referralReward`) && (
                      <FormDescription>
                        Distribution rate: {(form.watch(`methodSettings.${index}.referralReward`) / (field.value * 24)).toFixed(4)} tokens per hour
                      </FormDescription>
                    )}
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Volume Boost Settings</h4>
                <FormField
                  control={form.control}
                  name={`methodSettings.${index}.enableVolumeBoost`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Enable</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch(`methodSettings.${index}.enableVolumeBoost`) && (
                <>
                  <FormField
                    control={form.control}
                    name={`methodSettings.${index}.volumeThreshold`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Threshold Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(value);
                              form.trigger(`methodSettings.${index}.volumeThreshold`);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`methodSettings.${index}.volumeBonus`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Reward (SOL)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(value);
                              form.trigger(`methodSettings.${index}.volumeBonus`);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Time Boost Settings</h4>
                <FormField
                  control={form.control}
                  name={`methodSettings.${index}.enableTimeBoost`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Enable</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch(`methodSettings.${index}.enableTimeBoost`) && (
                <>
                  <FormField
                    control={form.control}
                    name={`methodSettings.${index}.timeTarget`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Referral Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(value);
                              form.trigger(`methodSettings.${index}.timeTarget`);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`methodSettings.${index}.timeWindow`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Window (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(value);
                              form.trigger(`methodSettings.${index}.timeWindow`);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`methodSettings.${index}.timeBonus`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bonus Reward (SOL)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(value);
                              form.trigger(`methodSettings.${index}.timeBonus`);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStep3 = () => {
    const methodSettings = form.watch("methodSettings");
    const escrowAmount = form.watch("escrowAmount");
    
    const calculateTotalRewards = () => {
      return methodSettings.reduce((total, method) => {
        const baseReward = method.strategy === "short_term" 
          ? (method.referralReward || 0)
          : 0;
        const volumeBoost = method.enableVolumeBoost ? (method.volumeBonus || 0) : 0;
        const timeBoost = method.enableTimeBoost ? (method.timeBonus || 0) : 0;
        return total + baseReward + volumeBoost + timeBoost;
      }, 0);
    };

    return (
      <div className="space-y-6">
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
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    field.onChange(value);
                    form.trigger("escrowAmount");
                  }}
                />
              </FormControl>
              <FormDescription>
                This amount will be used to fund rewards for your referral program
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-medium">Summary</h4>
          <p className="text-sm text-muted-foreground">
            Total potential rewards per referral: {calculateTotalRewards()} SOL
          </p>
          <p className="text-sm text-muted-foreground">
            Escrow amount: {escrowAmount} SOL
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
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
            {renderStepIndicator()}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                <div className="flex justify-between pt-6">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="ml-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : currentStep < 3 ? (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      "Register Project"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}