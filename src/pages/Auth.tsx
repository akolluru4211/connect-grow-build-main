import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Phone, Copy, Mail, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").max(255),
  phone: z.string().min(10, "Enter a valid phone number").max(15).regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const refCode = searchParams.get("ref") || "";
  
  const [activeTab, setActiveTab] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [emailEdited, setEmailEdited] = useState(false);
  const [randomSuffix] = useState(() => Math.floor(100 + Math.random() * 900));
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<{ edworldEmail: string; password: string; personalEmail: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const auth = useAuth();
  const navigate = useNavigate();
  
  const user = auth?.user;
  const signIn = auth?.signIn;
  const signUp = auth?.signUp;

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!emailEdited && signUpName) {
      const parts = signUpName.trim().split(/\s+/);
      if (parts.length > 1) {
        const firstName = parts[0];
        const surname = parts[parts.length - 1];
        const generated = `${surname.toLowerCase()}${firstName.charAt(0).toLowerCase()}${randomSuffix}@edworld.co.in`;
        setSignUpEmail(generated.replace(/[^a-z0-9@.]/g, ''));
      } else if (parts.length === 1 && parts[0]) {
        const generated = `${parts[0].toLowerCase()}${randomSuffix}@edworld.co.in`;
        setSignUpEmail(generated.replace(/[^a-z0-9@.]/g, ''));
      } else {
        setSignUpEmail("");
      }
    } else if (!emailEdited && !signUpName) {
      setSignUpEmail("");
    }
  }, [signUpName, emailEdited, randomSuffix]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    
    setErrors({});
    const result = signInSchema.safeParse({ email: signInEmail, password: signInPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => { 
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; 
      });
      setErrors(fieldErrors);
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await signIn(signInEmail, signInPassword);
      if (error) {
        toast.error(error.message.includes("Invalid login credentials") ? "Invalid email or password." : error.message);
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    setErrors({});
    const result = signUpSchema.safeParse({
      fullName: signUpName,
      email: signUpEmail,
      phone: signUpPhone,
      password: signUpPassword,
      confirmPassword: signUpConfirmPassword,
      referralCode: refCode
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(
        signUpEmail, 
        signUpPassword, 
        signUpName,
        signUpPhone,
        refCode
      );
      if (error) {
        toast.error(error.message);
      } else {
        setCredentials({
          edworldEmail: signUpEmail,
          password: signUpPassword,
          personalEmail: signUpEmail,
        });
      }
    } catch (err: any) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendToEmail = () => {
    if (!credentials) return;
    const subject = encodeURIComponent("Your EdWorld Login Credentials");
    const body = encodeURIComponent(
      `Welcome to EdWorld!\n\nHere are your login credentials:\n\nEdWorld Email: ${credentials.edworldEmail}\nPassword: ${credentials.password}\n\nKeep this safe and do not share it with anyone.\n\n– Team EdWorld`
    );
    window.open(`mailto:${credentials.personalEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20 relative overflow-hidden bg-background">
      <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      {/* Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background border border-border rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6"
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground">Account Created!</h2>
              <p className="text-sm text-muted-foreground mt-1">Save your EdWorld credentials below</p>
            </div>

            <div className="space-y-3">
              <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">EdWorld Email ID</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold text-primary break-all">{credentials.edworldEmail}</p>
                  <button
                    onClick={() => handleCopy(credentials.edworldEmail, "email")}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copied === "email" ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Password</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold text-foreground">{credentials.password}</p>
                  <button
                    onClick={() => handleCopy(credentials.password, "password")}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copied === "password" ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSendToEmail}
                className="w-full h-12 rounded-2xl font-bold"
              >
                <Mail className="mr-2 h-4 w-4" /> Send to my Email
              </Button>
              <Button
                variant="outline"
                onClick={() => { setCredentials(null); navigate("/auth"); }}
                className="w-full h-12 rounded-2xl font-bold"
              >
                Done — Go to Login
              </Button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground">
              ⚠️ Screenshot or copy these credentials. You won't see them again.
            </p>
          </motion.div>
        </div>
      )}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[440px] relative z-10">
        <div className="mb-12 text-center">
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={logo} 
            alt="EdWorld" 
            className="h-16 mx-auto mb-6" 
          />
          <h1 className="text-3xl font-black text-foreground tracking-tight">Welcome to EdWorld</h1>
          <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] mt-2">The Career Operating System</p>
        </div>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted p-1.5 rounded-2xl mb-8 border border-border/50">
            <TabsTrigger value="signin" className="rounded-xl font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="rounded-xl font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email Address</Label>
                <Input 
                  type="email" 
                  value={signInEmail} 
                  onChange={e => setSignInEmail(e.target.value)}
                  className="h-14 rounded-2xl border-border bg-muted/30 font-bold focus:bg-background transition-all shadow-sm"
                  placeholder="name@university.edu"
                />
                {errors.email && <p className="text-[10px] text-destructive font-black uppercase ml-1">{errors.email}</p>}
              </div>
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Password</Label>
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={signInPassword} 
                  onChange={e => setSignInPassword(e.target.value)}
                  className="h-14 rounded-2xl border-border bg-muted/30 font-bold focus:bg-background transition-all shadow-sm"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {errors.password && <p className="text-[10px] text-destructive font-black uppercase ml-1">{errors.password}</p>}
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl btn-premium shadow-xl shadow-primary/20 text-lg font-bold">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Access Account"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-6">
            <form onSubmit={handleSignUp} className="space-y-4">
               <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</Label>
                <Input 
                  value={signUpName} 
                  onChange={e => setSignUpName(e.target.value)}
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold focus:bg-white transition-all shadow-sm"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">EdWorld Email ID</Label>
                  {emailEdited && (
                    <button
                      type="button"
                      onClick={() => { setEmailEdited(false); }}
                      className="text-[9px] font-black uppercase text-primary hover:underline"
                    >
                      ↺ Reset to auto
                    </button>
                  )}
                </div>
                <Input 
                  type="email" 
                  value={signUpEmail} 
                  onChange={e => {
                    setSignUpEmail(e.target.value);
                    setEmailEdited(true);
                  }}
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold focus:bg-white transition-all shadow-sm"
                  placeholder="Auto-generated after entering name"
                />
                {!emailEdited && signUpEmail && (
                  <p className="text-[10px] text-primary/70 font-bold ml-1">
                    ✨ Auto-generated — you can edit this or keep it
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    value={signUpPhone} 
                    onChange={e => setSignUpPhone(e.target.value)}
                    className="h-14 pl-11 rounded-2xl border-slate-100 bg-slate-50 font-bold focus:bg-white transition-all shadow-sm"
                    placeholder="9988776655"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">New Password</Label>
                <Input 
                  type="password" 
                  value={signUpPassword} 
                  onChange={e => setSignUpPassword(e.target.value)}
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold focus:bg-white transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl btn-premium shadow-xl shadow-primary/20 text-lg font-bold mt-4">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Career OS ID"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
