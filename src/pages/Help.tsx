import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Helmet } from "react-helmet-async";
import { 
  BookOpen, 
  Briefcase, 
  BrainCircuit, 
  Trophy, 
  Users, 
  MessageSquare,
  HelpCircle
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Career Opportunities",
    icon: <Briefcase className="w-6 h-6 text-blue-500" />,
    description: "Discover real-time jobs and internships tailored to your profile. Apply directly and track your applications.",
    color: "bg-blue-50 border-blue-100"
  },
  {
    title: "AI Study & Exam Prep",
    icon: <BrainCircuit className="w-6 h-6 text-purple-500" />,
    description: "Use the Exam Helper to generate study plans, flashcards, and take mock assessments to ace your exams.",
    color: "bg-purple-50 border-purple-100"
  },
  {
    title: "Mentorship & Networking",
    icon: <Users className="w-6 h-6 text-green-500" />,
    description: "Connect with industry professionals, book mentorship sessions, and build your professional network.",
    color: "bg-green-50 border-green-100"
  },
  {
    title: "Gamification & Leaderboards",
    icon: <Trophy className="w-6 h-6 text-yellow-500" />,
    description: "Earn points, unlock achievements, and climb the leaderboard as you complete courses and activities.",
    color: "bg-yellow-50 border-yellow-100"
  },
  {
    title: "Knowledge Center",
    icon: <BookOpen className="w-6 h-6 text-red-500" />,
    description: "Access a vast library of resources, articles, and roadmaps to guide your learning journey.",
    color: "bg-red-50 border-red-100"
  },
  {
    title: "AI Profile Analyzer",
    icon: <MessageSquare className="w-6 h-6 text-indigo-500" />,
    description: "Get instant feedback on your resume and profile to improve your chances of landing your dream job.",
    color: "bg-indigo-50 border-indigo-100"
  }
];

const Help = () => {
  return (
    <MainLayout>
      <Helmet>
        <title>Help Center | EdWorld</title>
        <meta name="description" content="Learn how to use EdWorld features." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-8 lg:py-12">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">EdWorld Help Center</h1>
              <p className="text-slate-500 mt-1">Discover how to make the most of your EdWorld experience</p>
            </div>
          </div>
          
          <p className="text-slate-600 leading-relaxed max-w-3xl">
            Welcome to the EdWorld Help Center! Our platform is designed to be your ultimate career and education companion. 
            Below you will find a guide to our core features and how they can accelerate your growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-2xl border ${feature.color} transition-all hover:shadow-md cursor-pointer`}
            >
              <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white text-center mt-12">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            If you couldn't find what you were looking for or have specific questions, our support team is here for you.
            We also highly value your feedback to help us improve.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a 
              href="/contact" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Contact Support
            </a>
            <a 
              href="/feedback" 
              className="bg-white text-slate-900 hover:bg-slate-50 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Give Feedback
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Help;
