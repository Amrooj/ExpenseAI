import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  User,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/utils";

const schema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name too long"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password too long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-danger-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-warning-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-primary-500" };
  return { score, label: "Strong", color: "bg-success-500" };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const passwordStrength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.name, data.email, data.password, data.confirmPassword);
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: { type?: string; errors?: { field: string; message: string }[] } } } };
      const status = err.response?.status;
      const errorData = err.response?.data?.error;

      if (status === 409) {
        setError("email", { message: "An account with this email already exists" });
        return;
      }

      if (errorData?.type === "VALIDATION_ERROR" && errorData.errors) {
        errorData.errors.forEach(({ field, message }) => {
          if (field === "email" || field === "name" || field === "password" || field === "confirmPassword") {
            setError(field as keyof FormData, { message });
          }
        });
        return;
      }

      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Left panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-white">ExpenseAI</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-dark-muted text-sm">
              Start tracking expenses intelligently, for free
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("name")}
              type="text"
              label="Full name"
              placeholder="John Doe"
              autoComplete="name"
              error={errors.name?.message}
              leftIcon={<User className="h-4 w-4" />}
              disabled={isLoading}
            />

            <Input
              {...register("email")}
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              leftIcon={<Mail className="h-4 w-4" />}
              disabled={isLoading}
            />

            <div className="space-y-2">
              <Input
                {...register("password", {
                  onChange: (e) => setPasswordValue(e.target.value),
                })}
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                autoComplete="new-password"
                error={errors.password?.message}
                leftIcon={<Lock className="h-4 w-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-dark-muted hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                disabled={isLoading}
              />
              {/* Password strength */}
              {passwordValue && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength.score >= level
                            ? passwordStrength.color
                            : "bg-dark-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    passwordStrength.label === "Weak" ? "text-danger-400" :
                    passwordStrength.label === "Fair" ? "text-warning-500" :
                    passwordStrength.label === "Good" ? "text-primary-400" :
                    "text-success-500"
                  }`}>
                    {passwordStrength.label} password
                  </p>
                </div>
              )}
            </div>

            <Input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              label="Confirm password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              leftIcon={<Lock className="h-4 w-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-dark-muted hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="default"
              size="lg"
              loading={isLoading}
              className="w-full mt-2"
            >
              {isLoading ? "Creating account..." : "Create account"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-center text-sm">
            <span className="text-dark-muted">Already have an account? </span>
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-emerald-950 via-dark-elevated to-dark-bg">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-56 h-56 bg-primary-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div />
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white leading-tight">
                Start your financial
                <span className="block bg-gradient-to-r from-emerald-400 to-primary-400 bg-clip-text text-transparent">
                  clarity journey
                </span>
              </h2>
              <p className="text-dark-muted leading-relaxed">
                Join thousands tracking smarter with AI-powered expense management.
              </p>
            </div>
            <div className="space-y-3">
              {[
                "Free to use, no credit card required",
                "AI auto-categorization saves hours",
                "Beautiful charts and insights",
                "Export your data anytime",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="text-dark-muted text-sm">
            Your data is encrypted and never sold.
          </p>
        </div>
      </div>
    </div>
  );
}
