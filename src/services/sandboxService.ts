import { Sandbox } from '@e2b/code-interpreter';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

export interface SandboxResult {
  success: boolean;
  url?: string;
  screenshotBase64?: string;
  error?: string;
  logs?: string[];
}

/**
 * Creates an ephemeral sandbox to run and preview generated code
 */
export class SandboxService {
  private sandbox: Sandbox | null = null;
  private browser: any | null = null;
  private timeout: number;

  constructor(timeoutMs: number = 30000) {
    this.timeout = timeoutMs;
  }

  /**
   * Initialize a new sandbox environment
   */
  async initialize(): Promise<void> {
    try {
      // Create E2B sandbox for code execution
      this.sandbox = await Sandbox.create({
        apiKey: process.env.E2B_API_KEY,
        timeoutMs: this.timeout,
      });
      
      console.log('Sandbox initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sandbox:', error);
      throw new Error(`Sandbox initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deploy HTML/CSS/JS code to the sandbox and get a preview URL
   */
  async deployCode(html: string, css: string, js: string): Promise<string> {
    if (!this.sandbox) {
      throw new Error('Sandbox not initialized. Call initialize() first.');
    }

    try {
      // Create a complete HTML file
      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated UI Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    ${js}
  </script>
</body>
</html>`;

      // Write the HTML file to sandbox
      const filePath = '/home/user/index.html';
      await this.sandbox.files.write(filePath, fullHtml);

      // Start a simple HTTP server in the sandbox
      await this.sandbox.commands.run({
        cmd: `cd /home/user && python3 -m http.server 8080`,
        background: true,
      });

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the sandbox URL
      const url = await this.sandbox.getHost(8080);
      
      return url || 'https://localhost:8080';
    } catch (error) {
      console.error('Error deploying code:', error);
      throw new Error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Take a screenshot of the deployed UI
   */
  async takeScreenshot(url: string): Promise<string> {
    try {
      // Launch headless browser
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });

      const page = await browser.newPage();
      
      // Set viewport for consistent screenshots
      await page.setViewport({ width: 1280, height: 720 });

      // Navigate to the URL
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });

      // Wait for any animations to settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Take screenshot
      const screenshot = await page.screenshot({
        fullPage: false,
        type: 'png',
      });

      // Convert to base64
      const base64 = Buffer.from(screenshot).toString('base64');

      await browser.close();

      return base64;
    } catch (error) {
      console.error('Error taking screenshot:', error);
      throw new Error(`Screenshot failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Full deployment and screenshot pipeline
   */
  async deployAndCapture(html: string, css: string, js: string): Promise<SandboxResult> {
    try {
      if (!this.sandbox) {
        await this.initialize();
      }

      // Deploy the code
      const url = await this.deployCode(html, css, js);

      // Take a screenshot
      const screenshotBase64 = await this.takeScreenshot(url);

      return {
        success: true,
        url,
        screenshotBase64,
        logs: [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute arbitrary code in the sandbox (for backend API generation)
   */
  async executeCode(code: string, language: 'python' | 'javascript' = 'python'): Promise<{ output: string; error?: string }> {
    if (!this.sandbox) {
      throw new Error('Sandbox not initialized');
    }

    try {
      let result;
      
      if (language === 'python') {
        result = await this.sandbox.runCode(code);
      } else {
        // For JavaScript, we'd need to set up Node.js in the sandbox
        result = await this.sandbox.runCode(code);
      }

      return {
        output: result.text || '',
        error: result.error?.value,
      };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clean up sandbox resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
      }
      
      if (this.sandbox) {
        await this.sandbox.destroy();
        this.sandbox = null;
      }
      
      console.log('Sandbox cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up sandbox:', error);
    }
  }
}

// Singleton instance
let sandboxServiceInstance: SandboxService | null = null;

export function getSandboxService(): SandboxService {
  if (!sandboxServiceInstance) {
    const timeout = parseInt(process.env.SANDBOX_TIMEOUT || '30000');
    sandboxServiceInstance = new SandboxService(timeout);
  }
  return sandboxServiceInstance;
}
