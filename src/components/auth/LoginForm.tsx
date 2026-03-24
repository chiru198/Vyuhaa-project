import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, LogIn, Eye, EyeOff } from "lucide-react";
import cerviaiLogo from "@/assets/cerviai-logo.jpeg";

const LoginForm = () => {
  // --- States ---
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Form States ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Use your EC2 IP for production, localhost for local dev
    const API_BASE = "http://localhost:5000"; // Change to your EC2 IP when deploying
    const endpoint = isSignup
      ? `${API_BASE}/api/auth/signup`
      : `${API_BASE}/login`;

    const payload = isSignup
      ? { name, email, password, role }
      : { email, password };

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
          setPassword(""); // Clear password for security
        } else {
          localStorage.setItem("user", JSON.stringify(data.user));
          window.location.href = "/";
        }
      } else {
        setError(data.error || "Action failed. Please check your credentials.");
      }
    } catch (err) {
      setError(
        "Connection to server failed. Please check your internet or server status.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`w-full max-w-md shadow-xl border-t-4 transition-all duration-500 ${
        isSignup ? "border-t-teal-500" : "border-t-blue-600"
      }`}
    >
      <CardHeader className="text-center space-y-4 pb-2">
        <div className="flex justify-center">
          <img src={cerviaiLogo} alt="Logo" className="h-20 object-contain" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-extrabold text-slate-900">
            {isSignup ? "Create Account" : "Vyuhaa Med Data"}
          </CardTitle>
          <CardDescription className="text-teal-600 font-medium italic">
            {isSignup
              ? "Join the Digital Pathology Network"
              : "Digital Pathology Information Management System"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50 text-red-800 border-red-200"
            >
              <AlertDescription className="font-medium text-center">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Full Name (Signup Only) */}
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-semibold">
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="h-11"
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@vyuhaa.com"
              className="h-11"
              required
            />
          </div>

          {/* Role Selection (Signup Only) */}
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-700 font-semibold">
                I am a...
              </Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="customer">Customer</option>
                <option value="pathologist">Pathologist</option>
                <option value="technician">Lab Technician</option>
                <option value="accession">Accession Team</option>
              </select>
            </div>
          )}

          {/* Password with Show/Hide Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-slate-700 font-semibold"
              >
                Password
              </Label>
              {!isSignup && (
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                >
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
                className="h-11 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className={`w-full h-11 transition-all shadow-md active:scale-[0.98] ${
              isSignup
                ? "bg-teal-600 hover:bg-teal-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : isSignup ? (
              <>
                <UserPlus className="mr-2 h-4 w-4" /> Register Account
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Sign In to Dashboard
              </>
            )}
          </Button>
        </form>

        {/* Toggle between Login and Signup */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError(""); // Clear errors when switching
            }}
            className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            {isSignup
              ? "Already have an account? Sign In"
              : "Don't have an account? Create one"}
          </button>
        </div>

        <div className="mt-8 text-center border-t pt-4">
          <p className="text-xs text-slate-400">
            © 2026 Vyuhaa Med Data. All rights reserved.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
