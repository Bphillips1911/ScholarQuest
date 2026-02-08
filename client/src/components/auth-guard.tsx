import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  sectionName?: string;
}

export default function AuthGuard({ children, sectionName = "This section" }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const teacherToken = localStorage.getItem('teacherToken');
    setIsAuthorized(!!(adminToken || teacherToken));
  }, []);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <section className="min-h-screen bg-gray-50 p-4 flex items-center justify-center" data-testid="unauthorized-section">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
            <p className="text-gray-600 mb-6">
              {sectionName} is only accessible to teachers and administrators.
              Please log in with your authorized account to continue.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation('/teacher-login')}
                className="w-full"
                data-testid="button-teacher-login"
              >
                Teacher Login
              </Button>
              <Button 
                onClick={() => setLocation('/admin-login')}
                variant="outline"
                className="w-full"
                data-testid="button-admin-login"
              >
                Administrator Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return <>{children}</>;
}
