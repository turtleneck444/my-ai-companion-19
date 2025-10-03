# AI Companion Platform

A modern AI companion platform built with React, TypeScript, and Vite.

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase, Netlify Functions
- **AI**: OpenAI GPT-4, ElevenLabs TTS
- **Payments**: Stripe integration

## Features

- 🤖 **AI Characters**: Chat with pre-built and custom AI companions
- 🎤 **Voice Calls**: Real-time voice conversations with AI
- 🎮 **Interactive Games**: Play games with AI characters
- 💳 **Payment System**: Multiple payment providers support
- 🔐 **Authentication**: Secure user management
- 📱 **Mobile Responsive**: Optimized for all devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+
- Supabase account
- OpenAI API key
- ElevenLabs API key

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd my-ai-companion-19
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in Netlify:
   - Go to Site Settings > Environment Variables
   - Add all required environment variables

4. Start development server:
```bash
npm run dev
```

## Deployment

This project is configured for Netlify deployment:

1. Connect your GitHub repository to Netlify
2. Set up environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

## Project Structure

```
src/
├── components/     # React components
├── pages/         # Page components
├── lib/           # Utility functions
├── hooks/         # Custom React hooks
├── contexts/      # React contexts
└── types/         # TypeScript type definitions

api/               # API endpoints
netlify/functions/ # Netlify serverless functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary.
