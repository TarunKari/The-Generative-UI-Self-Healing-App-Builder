# 🎨 Generative UI Builder

An AI-powered application that builds, deploys, and visually debugs full web applications in real-time using vision-language models and self-healing loops.

## ✨ Features

- **Vision-to-Code Loop**: Uses Claude's vision capabilities to analyze screenshots of generated UIs and provide actionable feedback
- **Ephemeral Sandboxing**: Safely runs and previews untrusted frontend code using E2B Code Interpreter
- **Stateful Agentic Loops**: Manages the build → test → critique → fix lifecycle with LangGraph
- **Self-Healing UI**: Automatically detects and fixes visual issues like unreadable text, poor contrast, and layout problems
- **Real-time Preview**: See your generated UI instantly with live preview

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Prompt   │────▶│  Code Generator  │────▶│   HTML/CSS/JS   │
│                 │     │   (Claude LLM)   │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Fixed Code    │◀────│  Feedback JSON   │◀────│   Screenshot    │
│                 │     │   (VLM Vision)   │     │   (Puppeteer)   │
└────────┬────────┘     └──────────────────┘     └────────┬────────┘
         │                                                 │
         │                                                 ▼
         │                                   ┌─────────────────┐
         │                                   │   E2B Sandbox   │
         │                                   │   Deployment    │
         └───────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Anthropic API Key (for Claude)
- E2B API Key (for sandboxing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd generative-ui-builder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
E2B_API_KEY=your_e2b_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 Usage

1. **Enter a prompt**: Describe the UI you want to build
   - Example: "Build a dashboard for tracking my crypto portfolio with a dark theme"

2. **Choose a theme**: Select from Dark, Light, Modern, Minimal, or Colorful

3. **Watch the magic**: The AI will:
   - Generate initial code
   - Deploy to a sandbox
   - Take a screenshot
   - Analyze with vision model
   - Fix any issues found
   - Repeat until satisfied

4. **View results**: See the generated UI, view the code, or open in sandbox

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **AI/LLM**: Anthropic Claude (via @ai-sdk/anthropic)
- **Orchestration**: LangGraph (stateful agentic workflows)
- **Sandboxing**: E2B Code Interpreter
- **Browser Automation**: Puppeteer (for screenshots)
- **Image Processing**: Sharp

## 📁 Project Structure

```
generative-ui-builder/
├── app/
│   ├── api/
│   │   └── build/
│   │       └── route.ts          # Build API endpoint
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main UI
├── src/
│   ├── services/
│   │   ├── buildOrchestrator.ts  # LangGraph state machine
│   │   ├── sandboxService.ts     # E2B sandbox management
│   │   └── visionService.ts      # Claude vision analysis
│   ├── types/
│   │   └── index.ts              # TypeScript types & Zod schemas
│   └── lib/
│       └── utils.ts              # Utility functions
├── .env.example                  # Environment variables template
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `E2B_API_KEY` | Yes | E2B API key for sandboxing |
| `SANDBOX_TIMEOUT` | No | Sandbox timeout in ms (default: 30000) |
| `MAX_HEALING_ITERATIONS` | No | Max fix iterations (default: 5) |

## 🔄 The Self-Healing Loop

The application uses a stateful agent loop powered by LangGraph:

1. **Build**: Generate initial UI code from prompt
2. **Test**: Deploy to sandbox and capture screenshot
3. **Critique**: Analyze screenshot with Claude Vision
4. **Fix**: Regenerate code addressing identified issues
5. **Repeat**: Continue until no critical issues or max iterations

## 📝 Example Prompts

- "Build a dashboard for tracking my crypto portfolio with a dark theme"
- "Create a weather app showing current conditions and 5-day forecast"
- "Design a task management board with drag-and-drop functionality"
- "Make a music player interface with playlist support"

## ⚠️ Limitations

- Requires API keys for Anthropic and E2B (paid services)
- Complex layouts may require multiple iterations
- JavaScript-heavy interactions may not work perfectly in sandbox
- Vision analysis depends on screenshot quality

## 🚀 Future Enhancements

- [ ] Support for backend API generation
- [ ] Multi-component architecture
- [ ] State persistence between sessions
- [ ] Export to GitHub/Gist
- [ ] Custom component library
- [ ] Real-time collaboration features

## 📄 License

ISC

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.
