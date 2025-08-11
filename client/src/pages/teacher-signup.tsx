import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTeacherAuthSchema, type TeacherSignup } from "@shared/schema";
import { Link } from "wouter";
import { UserPlus, GraduationCap, CheckCircle } from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function TeacherSignup() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<TeacherSignup>({
    resolver: zodResolver(insertTeacherAuthSchema),
    defaultValues: {
      email: "",
      name: "",
      subject: "",
      gradeRole: "6th Grade" as const,
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: TeacherSignup) => {
      return await apiRequest("POST", "/api/teacher/signup", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Registration Submitted",
        description: "Your account is pending approval by administration.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeacherSignup) => {
    signupMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="h-16 w-auto mx-auto mb-4"
            />
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <CardTitle>Registration Submitted</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your teacher account registration has been submitted and is awaiting approval from school administration.
            </p>
            <p className="text-sm text-gray-500">
              You will receive an email notification once your account is approved and ready to use.
            </p>
            <div className="space-y-2">
              <Link href="/teacher-login">
                <Button className="w-full">
                  Go to Login Page
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4" data-testid="teacher-signup-section">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img 
            src={schoolLogoPath} 
            alt="Bush Hills STEAM Academy" 
            className="h-16 w-auto mx-auto mb-4"
            data-testid="school-logo"
          />
          <div className="flex items-center justify-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <CardTitle>Teacher Registration</CardTitle>
          </div>
          <p className="text-sm text-gray-600">
            Create your BHSA teacher portal account
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="teacher@email.com or personal@email.com"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      You can use your school email or personal email address. You'll receive all notifications at this address.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your full name"
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gradeRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade/Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-grade-role">
                          <SelectValue placeholder="Select your grade/role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6th Grade">6th Grade</SelectItem>
                        <SelectItem value="7th Grade">7th Grade</SelectItem>
                        <SelectItem value="8th Grade">8th Grade</SelectItem>
                        <SelectItem value="Unified Arts">Unified Arts</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Counselor">Counselor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject/Position</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Math, Science, ELA, Principal"
                        data-testid="input-subject"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Create a secure password"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <GraduationCap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Email Policy:</strong> You can use any email address (school or personal). All notifications including account approval, student updates, and system alerts will be sent to this address.
                  <br /><br />
                  Your account will require approval from school administration before you can access the teacher portal.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? "Creating Account..." : "Create Teacher Account"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/teacher-login" className="text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}