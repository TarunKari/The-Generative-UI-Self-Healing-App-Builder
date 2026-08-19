'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [theme, setTheme] = useState('dark');
  const [isBuilding, setIsBuilding] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    html: string;
    css: string;
    js: string;
    messages: string[];
    previewUrl?: string;
    error?: string;
  } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBuilding(true);
    setResult(null);
    setLogs(['🚀 Starting build process...']);

    try {
      const response = await fetch('/api/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, theme }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.messages) {
        setLogs(data.messages);
      }

      if (!data.success) {
        setLogs(prev => [...prev, `❌ Error: ${data.error}`]);
      }
    } catch (error) {
      setLogs(prev => [...prev, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          🎨 Generative UI Builder
        </h1>
        <p className="text-gray-400 mt-2">
          Build, test, and self-heal web apps with AI vision
        </p>
      </header>

      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <section className="space-y-4">
          <form onSubmit={handleBuild} className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                What would you like to build?
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Build a dashboard for tracking my crypto portfolio with a dark theme"
                className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium mb-2">
                Theme
              </label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="colorful">Colorful</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isBuilding || !prompt.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-200"
            >
              {isBuilding ? '🔨 Building...' : '✨ Generate UI'}
            </button>
          </form>

          {/* Logs Section */}
          {logs.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">📋 Build Log</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-gray-300">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Preview Section */}
        <section className="space-y-4">
          {result?.success && result.html ? (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">🎯 Generated UI</h3>
              
              {/* Live Preview */}
              <div className="border border-gray-700 rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <style>${result.css}</style>
                      </head>
                      <body>
                        ${result.html}
                        <script>${result.js}</script>
                      </body>
                    </html>
                  `}
                  className="w-full h-96 border-0"
                  title="UI Preview"
                  sandbox="allow-scripts"
                />
              </div>

              {/* Code Tabs */}
              <div className="mt-4 space-y-4">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-white">
                    📄 View HTML Code
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-900 rounded-lg overflow-x-auto text-xs text-green-400">
                    <code>{result.html}</code>
                  </pre>
                </details>

                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-white">
                    🎨 View CSS Code
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-900 rounded-lg overflow-x-auto text-xs text-blue-400">
                    <code>{result.css}</code>
                  </pre>
                </details>

                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-white">
                    ⚙️ View JavaScript Code
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-900 rounded-lg overflow-x-auto text-xs text-yellow-400">
                    <code>{result.js || '// No JavaScript generated'}</code>
                  </pre>
                </details>
              </div>

              {result.previewUrl && (
                <a
                  href={result.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  🚀 Open in Sandbox →
                </a>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-gray-400">
                Your generated UI will appear here
              </h3>
              <p className="text-gray-500 mt-2">
                Describe what you want to build and click "Generate UI"
              </p>
            </div>
          )}

          {/* Error Display */}
          {result?.error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-2">❌ Build Failed</h3>
              <p className="text-red-300">{result.error}</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 p-6 text-center text-gray-500">
        <p>Powered by Claude Vision • E2B Sandbox • LangGraph Orchestration</p>
      </footer>
    </div>
  );
}
