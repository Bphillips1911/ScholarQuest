import { useState } from "react";
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
import { Link } from "wouter";
import { Mail, ArrowLeft, CheckCircle, Shield } from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function AdminForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      return await apiRequest("POST", "/api/admin/forgot-password", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Password Reset Requested",
        description: "If your email is registered, you'll receive reset instructions shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    resetMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
            <CardTitle className="text-2xl font-bold school-name-3d">Password Reset Requested</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Check Your Email:</strong> If your email address is registered as an administrator, you'll receive password reset instructions with a secure link shortly. Please check your inbox and spam folder.
                <br /><br />
                <strong>Security Note:</strong> The reset link will expire in 1 hour for your protection.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-3">
              <Link href="/admin-login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
              
              <Link href="/admin-signup">
                <Button variant="link" className="w-full">
                  Don't have an account? Sign up
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" data-testid="admin-forgot-password-section">
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
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold school-name-3d">Reset Administrator Password</CardTitle>
          <p className="text-gray-600 program-title-3d">Administrator Portal - Bush Hills STEAM Academy</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Administrator Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your registered email address"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Secure Password Reset:</strong> Enter your registered administrator email address. You'll receive a secure reset link that expires in 1 hour. Check your spam folder if you don't see the email.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full"
                disabled={resetMutation.isPending}
                data-testid="button-reset"
              >
                {resetMutation.isPending ? "Sending Request..." : "Send Reset Instructions"}
              </Button>

              <div className="text-center">
                <Link href="/admin-login">
                  <Button variant="link" className="text-sm" data-testid="link-back-login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
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
