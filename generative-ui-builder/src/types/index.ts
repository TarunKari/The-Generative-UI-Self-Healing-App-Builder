import { z } from 'zod';

// Schema for UI feedback from VLM analysis
export const UIFeedbackSchema = z.object({
  issues: z.array(z.object({
    severity: z.enum(['critical', 'warning', 'info']),
    category: z.enum(['readability', 'layout', 'color', 'spacing', 'accessibility', 'other']),
    description: z.string(),
    element: z.string().optional(),
    suggestion: z.string(),
  })),
  overallScore: z.number().min(0).max(10),
  isUsable: z.boolean(),
  requiresFix: z.boolean(),
});

export type UIFeedback = z.infer<typeof UIFeedbackSchema>;

// Schema for code generation request
export const CodeGenRequestSchema = z.object({
  prompt: z.string(),
  theme: z.string().optional(),
  components: z.array(z.string()).optional(),
  existingCode: z.string().optional(),
  feedback: z.any().optional(),
});

export type CodeGenRequest = z.infer<typeof CodeGenRequestSchema>;

// Schema for app state
export const AppStateSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  html: z.string(),
  css: z.string(),
  js: z.string(),
  screenshotUrl: z.string().optional(),
  feedback: UIFeedbackSchema.optional(),
  iteration: z.number().default(0),
  status: z.enum(['building', 'testing', 'fixing', 'complete', 'failed']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AppState = z.infer<typeof AppStateSchema>;
