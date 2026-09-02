# DSA Interviewer Frontend

Next.js 14 frontend for the AI-powered DSA mock interviewer platform.

## 🚀 Features

- **Candidate Dashboard**: Overview of past interviews, performance summaries, and quick start options.
- **Interactive Coding & Chat Interface**: Split-pane layout with Monaco editor (syntax highlighting, multiple languages) and real-time Socratic AI chat.
- **Performance Evaluation**: Comprehensive evaluation reports with detailed rubric breakdown, strengths, areas for improvement, and hire recommendations.
- **Authentication**: JWT token storage, user login/registration, and Google OAuth integration.
- **Voice Synthesis**: Integrated text-to-speech for interview conversational experience.
- **Dark / Light Mode**: Seamless theme switching with Tailwind CSS and Next Themes.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or yarn

### 2. Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 🔧 Environment Configuration

Create a `.env.local` file in the `frontend` directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── auth/                       # Auth callback handlers
│   ├── dashboard/                  # Candidate past interviews & metrics
│   ├── interview/[session_id]/     # Active coding & interview room
│   ├── login/                      # Login page
│   ├── register/                   # Registration page
│   ├── profile/                    # User profile settings
│   ├── thankyou/                   # Post-interview completion screen
│   ├── layout.tsx                  # Root layout & providers
│   └── page.tsx                    # Landing & pre-interview setup
├── components/
│   ├── CodeInputBox.tsx            # Monaco code editor integration
│   ├── ChatMessage.tsx             # Interview dialog bubbles
│   ├── ChatInput.tsx               # Chat input & mic controls
│   ├── EvaluationViewer.tsx        # Post-interview evaluation scorecard
│   ├── GoogleAuthButton.tsx        # Google sign-in button
│   ├── InterviewTimer.tsx          # Real-time interview timer
│   └── ThemeToggle.tsx             # Dark / light mode switcher
├── lib/
│   ├── api.ts                      # FastAPI client functions
│   ├── auth.ts                     # Auth helpers & token management
│   ├── store.ts                    # Zustand application state store
│   └── types.ts                    # TypeScript interfaces
└── utils/
    └── speech.ts                   # Web Speech API speech synthesis
```

---

## 📦 Scripts

- `npm run dev` - Start local development server
- `npm run build` - Build production bundle
- `npm run start` - Run production server
- `npm run lint` - Run ESLint checks

---

## 🚀 Deployment

The frontend can be deployed directly to [Vercel](https://vercel.com/) or any platform supporting Next.js 14:

1. Connect the GitHub repository to Vercel.
2. Set the Root Directory to `frontend`.
3. Add the `NEXT_PUBLIC_API_URL` environment variable pointing to your deployed backend.
4. Deploy!