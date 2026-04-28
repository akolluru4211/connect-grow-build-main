import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = emailSchema.safeParse({ email });
    if (!result.success) { setError(result.error.errors[0].message); return; }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Password reset email sent!");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <img src={logo} alt="EdWorld" className="mx-auto mb-4 h-16 w-auto drop-shadow-sm" />
          <p className="mt-1 text-muted-foreground">Reset your password</p>
        </div>

        <div className="rounded-3xl border border-border/30 bg-card/70 backdrop-blur-2xl shadow-2xl p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold">Forgot Password</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {sent ? "Check your email for the reset link" : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <Button variant="outline" onClick={() => navigate("/auth")} className="w-full gap-2 rounded-2xl h-12">
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-12 rounded-2xl bg-background/60 backdrop-blur-sm border-border/40 transition-all focus:bg-background focus:shadow-md ${error ? "border-destructive" : ""}`} />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button type="submit" className="w-full h-12 rounded-2xl font-semibold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : "Send Reset Link"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate("/auth")} className="w-full gap-2 rounded-2xl h-11">
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
