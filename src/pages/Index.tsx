import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { OpportunitiesSection } from "@/components/landing/OpportunitiesSection";
import { FeaturesShowcase } from "@/components/landing/FeaturesShowcase";
import NewsletterSignup from "@/components/landing/NewsletterSignup";
import { MainLayout } from "@/components/layout/MainLayout";
import logo from "@/assets/logo.png";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col w-full overflow-x-hidden selection:bg-primary/20">
        {/* Hero Section - Clean Theme */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 overflow-hidden pt-20 bg-background">
          {/* Animated Background Highlights */}
          <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
 
          <div className="relative z-10 max-w-6xl mx-auto text-center flex flex-col items-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-10 px-6 py-2 rounded-full bg-accent/50 border border-border flex items-center gap-2 text-muted-foreground font-bold text-sm shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="uppercase tracking-widest text-[10px] font-black">Institutional Career Operating System</span>
            </motion.div>
 
            {/* Centered Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <img
                src={logo}
                alt="EdWorld Logo"
                className="h-24 w-auto object-contain brightness-100 dark:brightness-110"
              />
            </motion.div>
 
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-foreground"
            >
              Build Your Future <br /> <span className="text-primary italic">With AI-Powered Tools</span>
            </motion.h1>
 
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
            >
              AI mentors, resume builder, interview prep, and global job search — <br className="hidden sm:block" />
              all free. Join the future of professional placement.
            </motion.p>
 
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={() => navigate("/auth?mode=signup")}
                  className="btn-premium h-16 px-12 text-lg rounded-2xl flex items-center gap-2 shadow-xl shadow-primary/20"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/auth")}
                  className="h-16 px-12 text-lg rounded-2xl border-border bg-background hover:bg-accent text-foreground font-bold transition-all"
                >
                  Sign In
                </Button>
              </motion.div>
            </motion.div>
 
            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto w-full"
            >
              {[
                { label: "Active Students", value: "200k+" },
                { label: "AI Tools", value: "25+" },
                { label: "Free Access", value: "100%" },
                { label: "Success Rate", value: "94%" },
              ].map((s) => (
                <div key={s.label} className="bg-accent/30 border border-border rounded-[2rem] p-6 text-center transition-all duration-300 hover:shadow-xl hover:bg-background group cursor-default">
                  <div className="text-3xl font-black text-foreground group-hover:text-primary transition-colors">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 border-2 border-primary/20 rounded-full flex items-start justify-center p-2"
            >
              <div className="w-1 h-2 rounded-full bg-primary" />
            </motion.div>
          </motion.div>
        </section>

        {/* Global Features Highlighting - The Career OS Ecosystem */}
        <FeaturesShowcase />

        {/* Opportunities Section */}
        <div className="bg-slate-50/50">
          <OpportunitiesSection />
        </div>

        {/* Newsletter */}
        <NewsletterSignup />

        {/* Footer CTA */}
        <section className="py-32 px-4 relative bg-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-indigo-500/5 pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center relative z-10 bg-slate-900 rounded-[3.5rem] py-20 px-8 shadow-2xl shadow-slate-900/20"
          >
            <h2 className="text-5xl sm:text-7xl font-black mb-6 text-white tracking-tight leading-[0.9]">
              Ready to Upgrade <br /> Your Career?
            </h2>
            <p className="text-slate-400 mb-10 text-xl font-medium max-w-2xl mx-auto">
              Join thousands of students building their future with EdWorld — completely free. No credit card, no hidden fees.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="btn-premium h-16 px-12 text-lg rounded-2xl flex items-center gap-2 mx-auto"
            >
              Get Started Today
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </section>
      </div>
    </MainLayout>
  );
}
