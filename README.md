# EdWorld - Free AI Career Platform for Students

EdWorld is India's #1 free AI-powered student platform. Find jobs, internships, build resumes with AI, get career counseling, practice interviews, join study groups & learn new skills.

## 🚀 Features

- **AI Resume Builder**: Create ATS-optimized resumes in minutes.
- **AI Career Counseling**: Get personalized advice from elite industry mentors.
- **Interview Prep**: Practice with AI-driven mock interviews and behavioral coaching.
- **Job & Internship Portal**: Discover opportunities tailored to your skill set.
- **Study Planner**: Organize your learning with AI-generated roadmaps.
- **Professional Networking**: Connect with peers and mentors.

## 🛠️ Tech Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn-ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Google Gemini Pro 1.5 (Pro-002 & Flash-002) via Edge Functions

## 💻 Getting Started

1. **Clone the repository**:
   ```sh
   git clone <repo-url>
   ```
2. **Install dependencies**:
   ```sh
   npm i
   ```
3. **Set up environment variables** in `.env`:
   ```sh
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. **Start the development server**:
   ```sh
   npm run dev
   ```

## 🔒 Security

All data is secured via Supabase Row Level Security (RLS) and encrypted at rest. AI interactions are proxied through secure Edge Functions.

## 📄 License

Copyright © 2026 EdWorld. All rights reserved.
