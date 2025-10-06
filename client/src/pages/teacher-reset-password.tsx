import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { CheckCircle, AlertCircle, Lock } from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function TeacherResetPassword() {
  const [token, setToken] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: "Invalid Reset Link",
        description: "No reset token found. Please request a new password reset.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/teacher-forgot-password"), 3000);
    }
  }, [toast, setLocation]);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      return await apiRequest("POST", "/api/teacher/reset-password", {
        token,
        newPassword: data.password,
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. Redirecting to login...",
      });
      setTimeout(() => setLocation("/teacher-login"), 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "The reset link may have expired. Please request a new one.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    resetMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy" 
                className="h-16 w-auto school-logo-3d"
              />
            </div>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold school-name-3d">Password Reset Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your password has been successfully updated. You can now log in with your new password.
                <br /><br />
                Redirecting you to the login page...
              </AlertDescription>
            </Alert>
            
            <Link href="/teacher-login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4" data-testid="teacher-reset-password-section">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="h-16 w-auto school-logo-3d"
              data-testid="school-logo"
            />
          </div>
          <div className="flex justify-center mb-2">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold school-name-3d">Create New Password</CardTitle>
          <p className="text-gray-600 program-title-3d">Teacher Portal - Bush Hills STEAM Academy</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter new password (min 8 characters)"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Re-enter new password"
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Password Requirements:</strong> Use at least 8 characters with a mix of letters, numbers, and symbols for better security.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full"
                disabled={resetMutation.isPending}
                data-testid="button-reset-password"
              >
                {resetMutation.isPending ? "Updating Password..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <Link href="/teacher-login">
                  <Button variant="link" className="text-sm" data-testid="link-cancel">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
