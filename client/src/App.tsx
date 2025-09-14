import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { realTimeSync } from "@/lib/realTimeSync";
import { NotificationProvider } from "@/components/NotificationSystem";
import { notificationService } from "@/services/notificationService";
import NavigationHeader from "@/components/navigation-header";
import { AdvancedUIProvider } from "@/components/ui/advanced-ui-system";
import { SkipLink } from "@/components/ui/accessibility-focused";
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
import ParentPortalEnhanced from "@/pages/parent-portal-enhanced";
import DeploymentTest from "@/pages/deployment-test";
import TeacherLogin from "@/pages/teacher-login";
import TeacherSignup from "@/pages/teacher-signup";
import TeacherForgotPassword from "@/pages/teacher-forgot-password";
import TeacherQRAccess from "@/pages/teacher-qr-access";
import AdminLogin from "@/pages/admin-login";
import AdminSignup from "@/pages/admin-signup";
import StudentLogin from "@/pages/student-login";
import StudentSignup from "@/pages/student-signup";
import StudentDashboard from "@/pages/student-dashboard";
import StudentMoodTracker from "@/pages/student-mood-tracker";
import StudentLearningPath from "@/pages/student-learning-path";
import StudentSkillTree from "@/pages/student-skill-tree";
import StudentHouseHistory from "@/pages/student-house-history";
import StudentAchievements from "@/pages/student-achievements";
import GamifiedLearning from "@/pages/gamified-learning";
import TeacherDashboard from "@/pages/teacher-dashboard";
import TeacherMessages from "@/pages/teacher-messages";
import TeacherStudentView from "@/pages/teacher-student-view";
import HouseSorting from "@/pages/house-sorting";
import Admin from "@/pages/admin";
import AdminNew from "@/pages/admin-new";
import AdminClean from "@/pages/admin-clean";
import AdminSettings from "@/pages/admin-settings";
import EmailTroubleshooting from "@/pages/email-troubleshooting";
import QRGenerator from "@/pages/qr-generator";
import AdminQR from "@/pages/admin-qr";
import Tutorial from "@/pages/tutorial";
import NotFound from "@/pages/not-found";
import MainLanding from "@/pages/main-landing";
import AdvancedUIShowcase from "@/pages/advanced-ui-showcase";

function Router() {
  return (
    <>
      <Switch>
        {/* Main Landing Page - no navigation */}
        <Route path="/" component={MainLanding} />
        
        {/* Parent portal routes without navigation */}
        <Route path="/parent-signup" component={ParentSignup} />
        <Route path="/parent-login" component={ParentLogin} />
        <Route path="/parent-portal" component={ParentPortalEnhanced} />
        <Route path="/parent-portal-enhanced" component={ParentPortalEnhanced} />
        
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
        <Route path="/student-mood-tracker" component={StudentMoodTracker} />
        <Route path="/student-learning-path" component={StudentLearningPath} />
        <Route path="/student-skill-tree" component={StudentSkillTree} />
        <Route path="/student-house-history" component={StudentHouseHistory} />
        <Route path="/student-achievements" component={StudentAchievements} />
        <Route path="/gamified-learning" component={GamifiedLearning} />
        <Route path="/teacher-dashboard" component={TeacherDashboard} />
        <Route path="/teacher-messages" component={TeacherMessages} />
        <Route path="/teacher-student-view/:studentId" component={TeacherStudentView} />
        <Route path="/teacher-student-view" component={TeacherStudentView} />
        <Route path="/admin" component={AdminNew} />
        <Route path="/admin-full" component={AdminNew} />
        <Route path="/admin-test" component={AdminNew} />
        <Route path="/admin-settings" component={AdminSettings} />
        <Route path="/admin-pbis" component={PBIS} />
        <Route path="/admin-sorting" component={HouseSorting} />
        <Route path="/admin-qr" component={AdminQR} />
        
        {/* Main app routes with navigation */}
        <Route>
          <NavigationHeader />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/houses" component={Houses} />
              <Route path="/houses/:id" component={HouseDetail} />
              <Route path="/add-points" component={PBIS} />
              <Route path="/pbis" component={PBIS} />
              <Route path="/pbis-recognition" component={PBIS} />
              <Route path="/scholars" component={Houses} />
              <Route path="/monthly-pbis" component={MonthlyPBIS} />
              <Route path="/pledge" component={Pledge} />
              <Route path="/parent-letter" component={ParentLetter} />
              <Route path="/house-sorting" component={HouseSorting} />
              <Route path="/email-troubleshooting" component={EmailTroubleshooting} />
              <Route path="/qr-generator" component={QRGenerator} />
              <Route path="/tutorial" component={Tutorial} />
              <Route path="/deployment-test" component={DeploymentTest} />
              <Route path="/advanced-ui" component={AdvancedUIShowcase} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </Route>
      </Switch>
    </>
  );
}

function App() {
  // Initialize token monitoring for 30-day authentication system
  useEffect(() => {
    import("@/utils/tokenUtils").then(({ initTokenMonitoring }) => {
      initTokenMonitoring();
    });
    
    // Initialize real-time synchronization system
    realTimeSync.init();
    
    // Initialize notification service
    notificationService.initializeRealTimeListeners();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdvancedUIProvider>
          <NotificationProvider>
            <div className="min-h-screen bg-slate-50">
              <SkipLink href="#main-content">Skip to main content</SkipLink>
              <Toaster />
              <Router />
            </div>
          </NotificationProvider>
        </AdvancedUIProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
