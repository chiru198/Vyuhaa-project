import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, LogIn, Eye, EyeOff, Microscope, ShieldCheck, Activity } from "lucide-react";
import cerviaiLogo from "@/assets/cerviai-logo.jpeg";
import vyuhaaLogo from "@/assets/vyuhaa.png";

const LoginForm = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const API_BASE = "http://localhost:5000";
    const endpoint = isSignup ? `${API_BASE}/api/auth/signup` : `${API_BASE}/login`;
    const payload = isSignup ? { name, email, password, role } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isSignup) {
          alert("Registration successful! Please sign in.");
          setIsSignup(false);
          setPassword("");
        } else {
          localStorage.setItem("user", JSON.stringify(data.user));
          window.location.href = "/";
        }
      } else {
        setError(data.error || "Action failed. Please check your credentials.");
      }
    } catch (err) {
      setError("Connection to server failed. Please check your internet or server status.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f2544] via-[#1a3a6b] to-[#0e6b8c] flex-col justify-between p-12 relative overflow-hidden">

        {/* Background decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full" />

        {/* Top placeholder to maintain spacing */}
        <div className="z-10" />

        {/* Center Content */}
        <div className="z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Digital Pathology<br />
              <span className="text-blue-300">Information System</span>
            </h1>
            <p className="text-blue-200 text-base leading-relaxed max-w-sm">
              AI-enhanced cervical cancer screening platform for pathologists, labs, and healthcare providers.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4 pt-4">
            {[
              { icon: Microscope, title: "AI-Powered Analysis", desc: "Automated LBC slide interpretation" },
              { icon: ShieldCheck, title: "NABL Accredited", desc: "ISO 13485 & ISO 15189 certified" },
              { icon: Activity, title: "Real-time Reporting", desc: "Instant PDF report generation" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-blue-300 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-blue-400 text-xs z-10">
          © 2026 Vyuhaa Med Data Private Limited, Visakhapatnam
        </p>
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md space-y-8">

          {/* Vyuhaa logo — top of form */}
          <div className="flex justify-center">
            <img src={vyuhaaLogo} alt="Vyuhaa" className="h-16 object-contain" />
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {isSignup ? "Create Account" : "Welcome back"}
            </h2>
            <p className="text-slate-500 text-sm">
              {isSignup
                ? "Fill in your details to join the platform"
                : "Sign in to access your dashboard"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name (Signup only) */}
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-slate-700 font-semibold text-sm">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@vyuhaa.com"
                className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {/* Role (Signup only) */}
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-slate-700 font-semibold text-sm">I am a...</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="customer">Customer</option>
                  <option value="pathologist">Pathologist</option>
                  <option value="technician">Lab Technician</option>
                  <option value="accession">Accession Team</option>
                </select>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">Password</Label>
                {!isSignup && (
                  <button type="button" className="text-xs text-blue-600 hover:underline font-medium">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md active:scale-[0.98] transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : isSignup ? (
                <><UserPlus className="mr-2 h-4 w-4" /> Create Account</>
              ) : (
                <><LogIn className="mr-2 h-4 w-4" /> Sign In</>
              )}
            </Button>
          </form>

          {/* Toggle Login / Signup */}
          <div className="text-center">
            <span className="text-sm text-slate-500">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
            </span>
            <button
              onClick={() => { setIsSignup(!isSignup); setError(""); }}
              className="text-sm text-blue-600 hover:underline font-semibold"
            >
              {isSignup ? "Sign In" : "Create one"}
            </button>
          </div>

          {/* CerviAI logo — bottom of form */}
          <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-100">
            <img src={cerviaiLogo} alt="CerviAI" className="h-12 w-12 rounded-xl object-cover shadow-md" />
            <p className="text-xs text-slate-400 font-medium">Powered by CerviAI</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginForm;
