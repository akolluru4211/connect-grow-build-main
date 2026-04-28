import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Phone, Rocket, Star, Sparkles } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";

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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function KidsAuth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [activeTab, setActiveTab] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/kids");
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
    setErrors({});
    const result = signInSchema.safeParse({ email: signInEmail, password: signInPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    const { error } = await signIn(signInEmail, signInPassword);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("Invalid login credentials") ? "Invalid email or password." : error.message);
    } else {
      toast.success("Welcome back, superstar! 🌟");
      navigate("/kids");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = signUpSchema.safeParse({ fullName: signUpName, email: signUpEmail, phone: signUpPhone, password: signUpPassword, confirmPassword: signUpConfirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword, signUpName, signUpPhone);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("already registered") ? "This email is already registered." : error.message);
    } else {
      toast.success("Account created! Check your email to verify. 🚀");
      navigate("/kids");
    }
  };

  const inputClass = (field: string) =>
    `h-12 rounded-2xl bg-card/80 backdrop-blur-sm border-border text-sm transition-all focus:bg-card focus:shadow-md focus:border-primary placeholder:text-muted-foreground ${errors[field] ? "border-destructive" : ""}`;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Decorative elements */}
      <div className="absolute top-[-15%] right-[-8%] w-[450px] h-[450px] rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[350px] h-[350px] rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute top-[10%] left-[5%] w-[200px] h-[200px] rounded-full bg-cyan-100/40 blur-2xl" />
      
      {/* Floating decorations */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce opacity-20"
          style={{
            left: `${10 + i * 20}%`,
            top: `${15 + (i % 3) * 30}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${2.5 + i * 0.5}s`,
          }}
        >
          {i % 3 === 0 ? <Star className="h-5 w-5 text-sky-400" /> :
           i % 3 === 1 ? <Sparkles className="h-5 w-5 text-blue-400" /> :
           <Rocket className="h-5 w-5 text-cyan-400" />}
        </div>
      ))}

      <div className="w-full max-w-[420px] relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <img src={logo} alt="EdWorld" className="mx-auto mb-4 h-12 w-auto drop-shadow-sm" />
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-primary mb-3">
            <Rocket className="h-3.5 w-3.5" />
            EdWorld Kids Hub
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-900">
            {activeTab === "signin" ? "Welcome back! 👋" : "Join the fun! 🚀"}
          </h1>
          <p className="mt-2 text-sm text-sky-600/70">
            {activeTab === "signin" ? "Sign in to continue learning" : "Create your account to start your adventure"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-2xl shadow-xl shadow-md p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-11 rounded-2xl bg-sky-50 p-1">
              <TabsTrigger value="signin" className="rounded-xl text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-0">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="kid-signin-email" className="text-sm font-medium text-sky-800">Email</Label>
                  <Input id="kid-signin-email" type="email" placeholder="you@example.com" value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)} className={inputClass("email")} />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid-signin-password" className="text-sm font-medium text-sky-800">Password</Label>
                  <div className="relative">
                    <Input id="kid-signin-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)}
                      className={`${inputClass("password")} pr-11`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-600 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>
                <Button type="submit" className="w-full h-12 rounded-2xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign In ✨"}
                </Button>
                <Button type="button" variant="link" onClick={() => navigate("/forgot-password")}
                  className="w-full text-sm text-muted-foreground hover:text-primary">
                  Forgot your password?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kid-signup-name" className="text-sm font-medium text-sky-800">Full Name</Label>
                  <Input id="kid-signup-name" type="text" placeholder="Your Name" value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)} className={inputClass("fullName")} />
                  {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid-signup-email" className="text-sm font-medium text-sky-800">Email</Label>
                  <Input id="kid-signup-email" type="email" placeholder="you@example.com" value={signUpEmail}
                    onChange={(e) => {
                      setSignUpEmail(e.target.value);
                      setEmailEdited(true);
                    }} className={inputClass("email")} />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid-signup-phone" className="text-sm font-medium text-sky-800">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
                    <Input id="kid-signup-phone" type="tel" placeholder="+91 98765 43210" value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)} className={`${inputClass("phone")} pl-10`} />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid-signup-password" className="text-sm font-medium text-sky-800">Password</Label>
                  <div className="relative">
                    <Input id="kid-signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)}
                      className={`${inputClass("password")} pr-11`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-600 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid-signup-confirm-password" className="text-sm font-medium text-sky-800">Confirm Password</Label>
                  <div className="relative">
                    <Input id="kid-signup-confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••"
                      value={signUpConfirmPassword} onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      className={`${inputClass("confirmPassword")} pr-11`} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-600 transition-colors">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full h-12 rounded-2xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Create Account 🚀"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-sky-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
