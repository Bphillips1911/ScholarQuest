import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavigationHeader from "@/components/navigation-header";
import Dashboard from "@/pages/dashboard";
import Houses from "@/pages/houses";
import HouseDetail from "@/pages/house-detail";
import PBIS from "@/pages/pbis-enhanced";
import MonthlyPBIS from "@/pages/monthly-pbis";
import Pledge from "@/pages/pledge";
import ParentLetter from "@/pages/parent-letter";
import ParentSignup from "@/pages/parent-signup";
import ParentLogin from "@/pages/parent-login";
import ParentPortal from "@/pages/parent-portal";
import TeacherLogin from "@/pages/teacher-login";
import TeacherSignup from "@/pages/teacher-signup";
import TeacherForgotPassword from "@/pages/teacher-forgot-password";
import TeacherQRAccess from "@/pages/teacher-qr-access";
import AdminLogin from "@/pages/admin-login";
import AdminSignup from "@/pages/admin-signup";
import StudentLogin from "@/pages/student-login";
import StudentSignup from "@/pages/student-signup";
import StudentDashboard from "@/pages/student-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import TeacherMessages from "@/pages/teacher-messages";
import HouseSorting from "@/pages/house-sorting";
import Admin from "@/pages/admin";
import AdminSettings from "@/pages/admin-settings";
import AdminTest from "@/pages/admin-test";
import EmailTroubleshooting from "@/pages/email-troubleshooting";
import QRGenerator from "@/pages/qr-generator";
import Tutorial from "@/pages/tutorial";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Switch>
        {/* Parent portal routes without navigation */}
        <Route path="/parent-signup" component={ParentSignup} />
        <Route path="/parent-login" component={ParentLogin} />
        <Route path="/parent-portal" component={ParentPortal} />
        
        {/* Authentication routes without navigation */}
        <Route path="/teacher-login" component={TeacherLogin} />
        <Route path="/teacher-signup" component={TeacherSignup} />
        <Route path="/teacher-forgot-password" component={TeacherForgotPassword} />
        <Route path="/teacher-qr-access" component={TeacherQRAccess} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/admin-signup" component={AdminSignup} />
        <Route path="/student-login" component={StudentLogin} />
        <Route path="/student-signup" component={StudentSignup} />
        <Route path="/student-dashboard" component={StudentDashboard} />
        <Route path="/teacher-dashboard" component={TeacherDashboard} />
        <Route path="/teacher-messages" component={TeacherMessages} />
        <Route path="/admin" component={AdminTest} />
        <Route path="/admin-full" component={Admin} />
        <Route path="/admin-settings" component={AdminSettings} />
        
        {/* Main app routes with navigation */}
        <Route>
          <NavigationHeader />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/houses" component={Houses} />
              <Route path="/houses/:id" component={HouseDetail} />
              <Route path="/pbis" component={PBIS} />
              <Route path="/monthly-pbis" component={MonthlyPBIS} />
              <Route path="/pledge" component={Pledge} />
              <Route path="/parent-letter" component={ParentLetter} />
              <Route path="/house-sorting" component={HouseSorting} />
              <Route path="/email-troubleshooting" component={EmailTroubleshooting} />
              <Route path="/qr-generator" component={QRGenerator} />
              <Route path="/tutorial" component={Tutorial} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
