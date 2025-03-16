import * as z from "zod";

export const projectFormSchema = z.object({
    projectName: z.string().nonempty("Project name is required"),
    idlFile: z.any(),
    methodSignatures: z.array(z.string()).min(1, "Select at least one method"),
    methodSettings: z.array(z.object({
      methodName: z.string(),
      strategy: z.enum(["short_term", "long_term"]),
      referralReward: z.number().min(0.0001, "Minimum reward amount is 0.0001"),
      dripDays: z.number().min(1, "Minimum 1 day required").optional(),
      enableVolumeBoost: z.boolean().default(false),
      volumeThreshold: z.number().min(1, "Minimum threshold is 1").optional(),
      volumeBonus: z.number().min(0.0001, "Minimum bonus amount is 0.0001").optional(),
      enableTimeBoost: z.boolean().default(false),
      timeTarget: z.number().min(1, "Minimum target is 1").optional(),
      timeWindow: z.number().min(1, "Minimum window is 1 minute").optional(),
      timeBonus: z.number().min(0.0001, "Minimum bonus amount is 0.0001").optional(),
    })),
    escrowAmount: z.number().min(0.1, "Minimum 0.1 SOL required"),
  }).refine((data) => {
    return data.methodSettings?.every(method => {
      if (method.enableVolumeBoost) {
        return method.volumeThreshold != null && method.volumeBonus != null;
      }
      if (method.enableTimeBoost) {
        return method.timeTarget != null && method.timeWindow != null && method.timeBonus != null;
      }
      return true;
    });
  }, {
    message: "Please fill in all required fields for enabled boost settings",
  });