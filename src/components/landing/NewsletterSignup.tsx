import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Sparkles, CheckCircle } from "lucide-react";
import { useNewsletterSubscribe } from "@/hooks/useOpportunities";
import { toast } from "sonner";

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { subscribe } = useNewsletterSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await subscribe(email);
      setIsSubscribed(true);
      toast.success("Successfully subscribed to newsletter!");
      setEmail("");
    } catch (error: any) {
      if (error.message?.includes("already subscribed")) {
        setIsSubscribed(true);
        toast.success("You're already subscribed! 🎉");
      } else {
        toast.error(error.message || "Failed to subscribe. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-24 px-4 bg-white relative">
      <div className="container mx-auto max-w-5xl">
        <Card className="bg-slate-50 border-slate-100 rounded-[2.5rem] overflow-hidden relative shadow-2xl shadow-slate-200">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
          
          <CardContent className="p-10 md:p-16 relative z-10">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3">
                <div className="h-16 w-16 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-primary">
                   <Mail className="h-8 w-8" />
                </div>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                Get Weekly <br /> Opportunity Briefs
              </h2>
              
              <p className="text-slate-500 max-w-lg mx-auto font-medium text-lg">
                Exclusive internships, high-stakes hackathons, and curated job openings — delivered every Monday morning.
              </p>

              {isSubscribed ? (
                <div className="flex items-center justify-center gap-2 text-emerald-500 py-6">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-medium">You're subscribed! Check your inbox soon.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mt-8">
                  <Input
                    type="email"
                    placeholder="Enter your professional email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 h-16 bg-white border-slate-200 text-slate-900 rounded-2xl px-6 text-lg shadow-inner"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn-premium h-16 px-12 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                  >
                    {isLoading ? "Joining..." : "Join Now"}
                  </Button>
                </form>
              )}

              <p className="text-xs text-muted-foreground mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default NewsletterSignup;
