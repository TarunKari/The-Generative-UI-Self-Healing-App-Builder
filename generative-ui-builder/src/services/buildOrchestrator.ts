import { StateGraph, END } from '@langchain/langgraph';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, UIFeedback } from '../types';
import { generateUICode, analyzeUIScreenshot, generateCritiqueSummary } from './visionService';
import { getSandboxService, type SandboxResult } from './sandboxService';

// Define the state interface for our graph
interface BuildState {
  appId: string;
  prompt: string;
  theme: string;
  html: string;
  css: string;
  js: string;
  screenshotBase64: string | null;
  feedback: UIFeedback | null;
  iteration: number;
  status: 'building' | 'testing' | 'fixing' | 'complete' | 'failed';
  messages: string[];
  error?: string;
}

const MAX_ITERATIONS = parseInt(process.env.MAX_HEALING_ITERATIONS || '5');

/**
 * Initial node: Generate the first version of the UI
 */
async function initialBuild(state: BuildState): Promise<Partial<BuildState>> {
  console.log(`🔨 Starting initial build for: ${state.prompt}`);
  
  try {
    const code = await generateUICode(state.prompt, state.theme);
    
    return {
      html: code.html,
      css: code.css,
      js: code.js,
      status: 'testing' as const,
      messages: [...state.messages, '✅ Initial UI generated'],
    };
  } catch (error) {
    return {
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error during build',
      messages: [...state.messages, `❌ Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Test node: Deploy to sandbox and capture screenshot
 */
async function testUI(state: BuildState): Promise<Partial<BuildState>> {
  console.log('🧪 Testing UI in sandbox...');
  
  try {
    const sandbox = getSandboxService();
    
    if (!sandbox) {
      throw new Error('Sandbox service not available');
    }

    // Initialize sandbox if needed
    if (!(sandbox as any).sandbox) {
      await sandbox.initialize();
    }

    // Deploy and capture
    const result: SandboxResult = await sandbox.deployAndCapture(
      state.html,
      state.css,
      state.js
    );

    if (!result.success) {
      throw new Error(result.error || 'Deployment failed');
    }

    console.log(`✅ UI deployed at: ${result.url}`);

    return {
      screenshotBase64: result.screenshotBase64 || null,
      status: 'fixing' as const,
      messages: [...state.messages, `✅ UI deployed successfully`, `📸 Screenshot captured`],
    };
  } catch (error) {
    return {
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error during testing',
      messages: [...state.messages, `❌ Testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Critique node: Analyze screenshot with VLM
 */
async function critiqueUI(state: BuildState): Promise<Partial<BuildState>> {
  console.log('👁️ Analyzing UI with vision model...');
  
  if (!state.screenshotBase64) {
    return {
      status: 'failed' as const,
      error: 'No screenshot available for analysis',
      messages: [...state.messages, '❌ No screenshot to analyze'],
    };
  }

  try {
    const feedback = await analyzeUIScreenshot(state.screenshotBase64, state.prompt);
    const summary = await generateCritiqueSummary(feedback);

    console.log(summary);

    return {
      feedback,
      messages: [...state.messages, summary],
      // If no fixes needed, go to complete
      status: feedback.requiresFix && state.iteration < MAX_ITERATIONS ? 'fixing' as const : 'complete' as const,
    };
  } catch (error) {
    return {
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error during critique',
      messages: [...state.messages, `❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Fix node: Regenerate code based on feedback
 */
async function fixUI(state: BuildState): Promise<Partial<BuildState>> {
  console.log(`🔧 Fixing UI issues (iteration ${state.iteration + 1})...`);
  
  if (!state.feedback) {
    return {
      status: 'failed' as const,
      error: 'No feedback available to guide fixes',
      messages: [...state.messages, '❌ No feedback to apply'],
    };
  }

  if (state.iteration >= MAX_ITERATIONS) {
    return {
      status: 'complete' as const,
      messages: [...state.messages, `⚠️ Max iterations (${MAX_ITERATIONS}) reached. Finalizing.`],
    };
  }

  try {
    // Combine existing code
    const existingCode = `
HTML:
${state.html}

CSS:
${state.css}

JavaScript:
${state.js}
    `.trim();

    const code = await generateUICode(
      state.prompt,
      state.theme,
      existingCode,
      state.feedback
    );

    return {
      html: code.html,
      css: code.css,
      js: code.js,
      iteration: state.iteration + 1,
      status: 'testing' as const,
      messages: [...state.messages, `🔧 Applied fixes (iteration ${state.iteration + 1}/${MAX_ITERATIONS})`],
    };
  } catch (error) {
    return {
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error during fix',
      messages: [...state.messages, `❌ Fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Determine next step after critique
 */
function routeAfterCritique(state: BuildState): string {
  if (state.status === 'failed') {
    return 'end';
  }
  
  if (!state.feedback?.requiresFix || state.iteration >= MAX_ITERATIONS) {
    return 'complete';
  }
  
  return 'fix';
}

/**
 * Determine next step after fixing
 */
function routeAfterFix(state: BuildState): string {
  if (state.status === 'failed') {
    return 'end';
  }
  
  return 'test';
}

/**
 * Create and compile the state graph for the build process
 */
export function createBuildGraph() {
  const workflow = new StateGraph<BuildState>()
    .addNode('build', initialBuild)
    .addNode('test', testUI)
    .addNode('critique', critiqueUI)
    .addNode('fix', fixUI)
    .addEdge('__start__', 'build')
    .addEdge('build', 'test')
    .addEdge('test', 'critique')
    .addConditionalEdges('critique', routeAfterCritique, {
      'fix': 'fix',
      'complete': END,
      'end': END,
    })
    .addConditionalEdges('fix', routeAfterFix, {
      'test': 'test',
      'end': END,
    });

  return workflow.compile();
}

/**
 * Main function to run the complete build process
 */
export async function runBuildProcess(
  prompt: string,
  theme: string = 'modern'
): Promise<{
  success: boolean;
  appId: string;
  html: string;
  css: string;
  js: string;
  messages: string[];
  error?: string;
}> {
  const appId = uuidv4();
  console.log(`\n🚀 Starting build process for app: ${appId}`);
  console.log(`📝 Prompt: ${prompt}`);
  console.log(`🎨 Theme: ${theme}\n`);

  const initialState: BuildState = {
    appId,
    prompt,
    theme,
    html: '',
    css: '',
    js: '',
    screenshotBase64: null,
    feedback: null,
    iteration: 0,
    status: 'building',
    messages: [`🚀 Build started: ${prompt}`],
  };

  const graph = createBuildGraph();
  
  try {
    const result = await graph.invoke(initialState);
    
    console.log('\n✅ Build process completed!');
    console.log(`Final status: ${result.status}`);
    console.log(`Total iterations: ${result.iteration}`);
    
    return {
      success: result.status === 'complete',
      appId: result.appId,
      html: result.html,
      css: result.css,
      js: result.js,
      messages: result.messages,
      error: result.error,
    };
  } catch (error) {
    console.error('❌ Build process failed:', error);
    
    return {
      success: false,
      appId,
      html: '',
      css: '',
      js: '',
      messages: [`❌ Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
