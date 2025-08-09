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
import Pledge from "@/pages/pledge";
import ParentLetter from "@/pages/parent-letter";
import ParentSignup from "@/pages/parent-signup";
import ParentLogin from "@/pages/parent-login";
import ParentPortal from "@/pages/parent-portal";
import TeacherLogin from "@/pages/teacher-login";
import TeacherSignup from "@/pages/teacher-signup";
import StudentLogin from "@/pages/student-login";
import StudentSignup from "@/pages/student-signup";
import StudentDashboard from "@/pages/student-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import HouseSorting from "@/pages/house-sorting";
import Admin from "@/pages/admin";
import AdminSettings from "@/pages/admin-settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Switch>
        {/* Parent portal routes without navigation */}
        <Route path="/parent-signup" component={ParentSignup} />
        <Route path="/parent-login" component={ParentLogin} />
        <Route path="/parent-portal" component={ParentPortal} />
        
        {/* Teacher portal routes without navigation */}
        <Route path="/teacher-login" component={TeacherLogin} />
        <Route path="/teacher-signup" component={TeacherSignup} />
        <Route path="/student-login" component={StudentLogin} />
        <Route path="/student-signup" component={StudentSignup} />
        <Route path="/student-dashboard" component={StudentDashboard} />
        <Route path="/teacher-dashboard" component={TeacherDashboard} />
        
        {/* Main app routes with navigation */}
        <Route>
          <NavigationHeader />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/houses" component={Houses} />
              <Route path="/houses/:id" component={HouseDetail} />
              <Route path="/pbis" component={PBIS} />
              <Route path="/pledge" component={Pledge} />
              <Route path="/parent-letter" component={ParentLetter} />
              <Route path="/house-sorting" component={HouseSorting} />
              <Route path="/admin" component={Admin} />
              <Route path="/admin-settings" component={AdminSettings} />
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
