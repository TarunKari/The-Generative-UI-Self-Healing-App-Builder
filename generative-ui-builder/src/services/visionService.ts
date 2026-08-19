import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject, generateText } from 'ai';
import { UIFeedbackSchema, type UIFeedback } from '../types';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const visionModel = anthropic('claude-sonnet-4-20250514');

/**
 * Analyzes a UI screenshot using Claude's vision capabilities
 * Returns structured feedback about UI issues
 */
export async function analyzeUIScreenshot(
  screenshotBase64: string,
  prompt: string
): Promise<UIFeedback> {
  try {
    const result = await generateObject({
      model: visionModel,
      schema: UIFeedbackSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert UI/UX designer and frontend developer. 
          Your task is to analyze screenshots of web applications and provide actionable feedback.
          
          Look for:
          - Text readability issues (contrast, font size)
          - Layout problems (overlapping elements, misalignment)
          - Color scheme issues
          - Spacing and padding problems
          - Accessibility concerns
          - Overall visual appeal and usability
          
          Be specific about what needs to be fixed and how.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: screenshotBase64,
            },
            {
              type: 'text',
              text: `Analyze this UI screenshot. The original prompt was: "${prompt}"
              
              Provide detailed feedback on any visual or usability issues you find.
              Focus especially on readability and accessibility problems.`
            }
          ]
        }
      ],
    });

    return result.object;
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    throw new Error(`Failed to analyze UI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates React code based on a prompt and optional feedback
 */
export async function generateUICode(
  prompt: string,
  theme: string = 'modern',
  existingCode?: string,
  feedback?: UIFeedback
): Promise<{ html: string; css: string; js: string }> {
  try {
    let systemPrompt = `You are an expert React developer. Generate a complete, working React component based on the user's request.
    
Requirements:
- Create a single-file React component that can run in a browser
- Use modern React with hooks
- Include all necessary CSS inline or in a style tag
- Make it visually appealing with a ${theme} theme
- Ensure it's responsive and accessible
- Return ONLY valid HTML/CSS/JS code`;

    if (feedback && existingCode) {
      systemPrompt += `
      
IMPORTANT: Fix the following issues identified in the previous version:
${JSON.stringify(feedback.issues, null, 2)}

Previous code had these problems. Make sure to address each one.`;
    }

    const result = await generateText({
      model: visionModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: existingCode
            ? `Improve this code based on the feedback:\n\nOriginal Code:\n${existingCode}\n\nFix the issues mentioned.`
            : `Build this UI: ${prompt}`
        }
      ],
    });

    // Parse the response to extract HTML, CSS, and JS
    const code = result.text;
    const extracted = extractCodeSections(code);

    return extracted;
  } catch (error) {
    console.error('Error generating code:', error);
    throw new Error(`Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts HTML, CSS, and JS from generated code
 */
function extractCodeSections(code: string): { html: string; css: string; js: string } {
  // Try to extract different sections
  const htmlMatch = code.match(/```html([\s\S]*?)```/);
  const cssMatch = code.match(/```css([\s\S]*?)```/);
  const jsMatch = code.match(/```(?:javascript|js)([\s\S]*?)```/);
  
  // If no markdown blocks, try to extract from structure
  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  
  return {
    html: htmlMatch ? htmlMatch[1].trim() : code.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, ''),
    css: cssMatch ? cssMatch[1].trim() : styleMatch ? styleMatch[1].trim() : '',
    js: jsMatch ? jsMatch[1].trim() : scriptMatch ? scriptMatch[1].trim() : '',
  };
}

/**
 * Generates a critique summary for the user
 */
export async function generateCritiqueSummary(feedback: UIFeedback): Promise<string> {
  const criticalIssues = feedback.issues.filter(i => i.severity === 'critical');
  const warnings = feedback.issues.filter(i => i.severity === 'warning');
  
  let summary = `UI Analysis Complete - Score: ${feedback.overallScore}/10\n\n`;
  
  if (criticalIssues.length > 0) {
    summary += `🔴 Critical Issues (${criticalIssues.length}):\n`;
    criticalIssues.forEach(issue => {
      summary += `- ${issue.description}\n`;
    });
    summary += '\n';
  }
  
  if (warnings.length > 0) {
    summary += `🟡 Warnings (${warnings.length}):\n`;
    warnings.forEach(issue => {
      summary += `- ${issue.description}\n`;
    });
    summary += '\n';
  }
  
  if (!feedback.requiresFix) {
    summary += '✅ UI looks good! No fixes required.';
  } else {
    summary += '🔧 Auto-fixing identified issues...';
  }
  
  return summary;
}
