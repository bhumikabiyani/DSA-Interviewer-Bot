# DSA Interviewer Frontend

Next.js frontend for the AI-powered DSA mock interviewer.

## 🎯 Three-Flow Interview Process

### Flow 1: Background Assessment
**Route:** `/background/[session_id]`

- Gathers candidate information before technical questions
- Asks about education, experience, DSA knowledge, and goals
- 3-5 conversational questions
- Shows "Ready for Technical Interview" button after sufficient conversation

### Flow 2: Interview Introduction
**Transition:** Background → Interview

- Automatically triggered when candidate clicks "Ready" button
- Picks random DSA question from knowledge base
- Provides interviewer introduction
- Seamlessly transitions to technical interview

### Flow 3: Technical Interview
**Route:** `/interview/[session_id]`

- Interactive DSA problem solving
- RAG-enhanced responses with relevant context
- Multi-turn conversation with full history
- Type "babi" to end interview

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
frountend/
├── app/
│   ├── page.tsx                    # Home page - starts background flow
│   ├── background/
│   │   └── [session_id]/
│   │       └── page.tsx            # Background assessment chat
│   ├── interview/
│   │   └── [session_id]/
│   │       └── page.tsx            # Technical interview chat
│   └── thankyou/
│       └── page.tsx                # End screen
├── components/
│   ├── ChatMessage.tsx             # Message bubble component
│   ├── ChatInput.tsx               # Input field component
│   ├── LoadingIndicator.tsx        # Loading animation
│   └── ThemeToggle.tsx             # Dark/light mode toggle
├── lib/
│   ├── api.ts                      # API client functions
│   ├── types.ts                    # TypeScript interfaces
│   └── store.ts                    # Zustand state management
└── README.md
```

## 🔌 API Integration

### Background Flow APIs

```typescript
// Start background session
const response = await startBackground();
// Returns: { session_id: string, message: string }

// Send background message
const response = await sendBackgroundMessage(sessionId, message);
// Returns: { response: string }
```

### Interview Flow APIs

```typescript
// Start technical interview (requires background session)
const response = await startInterview(sessionId);
// Returns: { session_id: string, intro: string }

// Send interview message
const response = await sendMessage(sessionId, message);
// Returns: { response: string, command?: string }
```

## 🎨 Features

- **Dark Mode Support** - Toggle between light and dark themes
- **Real-time Chat** - Smooth message animations and auto-scroll
- **Loading States** - Visual feedback during API calls
- **Error Handling** - Graceful error messages and recovery
- **Responsive Design** - Works on desktop and mobile
- **Session Management** - Maintains conversation history
- **Smart Transitions** - Automatic flow progression

## 🔧 Configuration

Environment variables (`.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🎯 User Journey

1. **Landing Page** → Click "Start Interview"
2. **Background Chat** → Answer 3-5 questions about yourself
3. **Transition** → Click "Ready for Technical Interview"
4. **Technical Interview** → Solve DSA problem with AI guidance
5. **End** → Type "babi" to finish and see thank you page

## 🛠️ Development

```bash
# Run linting
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## 📦 Dependencies

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Markdown** - Message formatting

## 🚀 Deployment

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

Deploy to Vercel, Netlify, or any Node.js hosting platform.

## 📝 Notes

- Session IDs are preserved across all three flows
- Background conversation history is maintained during transition
- Interview page expects `initialQuestion` from store (set during transition)
- All API calls include proper error handling and loading states