"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { EyeIcon, EyeOffIcon } from "lucide-react";

// shadcn components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "../Logo/logo";
import { Spinner } from "../ui/spinner";
import { toast } from "sonner"
// Form schemas
const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function AuthForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  // Signup form
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onLogin = (data: LoginValues) => {
    startTransition(async () => {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      if (error) {
        toast.error(error.message || "unkown error")
        return;
      }
      router.replace("/");
    });
  };

  const onSignup = (data: SignupValues) => {
    startTransition(async () => {
      const { error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name!,
        plan: process.env.DCUP_ENV === 'CLOUD' ? 'FREE' : 'OS'
      });
      if (error) {
        toast.error(error.message || "unkown error")
        return;
      }
      router.replace("/");
    });
  };

  const loginWith = (provider: "google" | "github") => {
    startTransition(async () => {
      const { error } = await authClient.signIn.social({
        provider,
      });
      if (error) {
        toast.error(error.message || "unkown error")
      }
    });
  };


  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className={"flex flex-col gap-6"}
    >
      <motion.div variants={fadeUp}>
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            {/* Logo */}
            <motion.div variants={fadeUp} className="flex justify-center">
              <Logo size={70} withName={false} />
            </motion.div>
            <motion.div variants={fadeUp}>
              <CardTitle className="text-3xl font-bold bg-linear-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                Dcup
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Advanced RAG for Personal Knowledge
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all">Login</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all">Sign Up</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                {activeTab === "login" && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TabsContent value="login" forceMount>
                      <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="m@example.com"
                            className="border-muted-foreground/20 focus:border-amber-500 focus:ring-amber-500/20"
                            {...registerLogin("email")}
                          />
                          {loginErrors.email && (
                            <p className="text-sm text-destructive">{loginErrors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="************"
                              className="border-muted-foreground/20 focus:border-amber-500 focus:ring-amber-500/20 pr-10"
                              {...registerLogin("password")}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                          </div>
                          {loginErrors.password && (
                            <p className="text-sm text-destructive">{loginErrors.password.message}</p>
                          )}
                        </div>
                        <Button type="submit" size='lg' className="w-full cursor-pointer" disabled={isPending}>
                          {isPending ? <>
                            <Spinner data-icon="inline-start" /> Sign in..
                          </> : " Sign in"}
                        </Button>
                      </form>
                    </TabsContent>
                  </motion.div>
                )}

                {activeTab === "signup" && (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TabsContent value="signup" forceMount>
                      <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Name (optional)</Label>
                          <Input
                            id="signup-name"
                            placeholder="John Doe"
                            className="border-muted-foreground/20 focus:border-amber-500 focus:ring-amber-500/20"
                            {...registerSignup("name")}
                          />
                          {signupErrors.name && (
                            <p className="text-sm text-destructive">{signupErrors.name.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="m@example.com"
                            className="border-muted-foreground/20 focus:border-amber-500 focus:ring-amber-500/20"
                            {...registerSignup("email")}
                          />
                          {signupErrors.email && (
                            <p className="text-sm text-destructive">{signupErrors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="*************"
                              className="border-muted-foreground/20 focus:border-amber-500 focus:ring-amber-500/20 pr-10"
                              {...registerSignup("password")}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                          </div>
                          {signupErrors.password && (
                            <p className="text-sm text-destructive">{signupErrors.password.message}</p>
                          )}
                        </div>
                        <Button type="submit" size='lg' className="w-full cursor-pointer" disabled={isPending}>
                          {isPending ? <>
                            <Spinner data-icon="inline-start" /> Creating Account..
                          </> : " Create Account"}
                        </Button>
                      </form>
                    </TabsContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <motion.div
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-3"
            >
              <motion.div variants={fadeUp}>
                <Button
                  variant="outline"
                  className="w-full border-muted-foreground/20 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all"
                  onClick={() => loginWith("google")}
                  disabled={isPending}
                >
                  <FaGoogle className="mr-2 h-4 w-4" />
                  Google
                </Button>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Button
                  variant="outline"
                  className="w-full border-muted-foreground/20 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all"
                  onClick={() => loginWith("github")}
                  disabled={isPending}
                >
                  <FaGithub className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>

          <CardFooter className="text-center text-xs text-muted-foreground">
            <p className="w-full">
              By continuing, you agree to our{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-amber-600 hover:text-amber-700"
                onClick={() => router.push("https://dcup.dev/terms_of_service_and_privacy_policy")}
              >
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-amber-600 hover:text-amber-700"
                onClick={() => router.push("https://dcup.dev/terms_of_service_and_privacy_policy")}
              >
                Privacy Policy
              </Button>
              .
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}
