import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Database, AlertTriangle, CheckCircle, ExternalLink, Activity, Users, BarChart3, Layers } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface HealthData {
  status: string;
  environment: string;
  tenant: string;
  timestamp: string;
  dbCounts: {
    windows: number;
    results: number;
    mastery: number;
    projections: number;
    events: number;
    scholars: number;
  };
}

export default function AdminProdDebug() {
  const { data: health, isLoading, error, refetch } = useQuery<HealthData>({
    queryKey: ["/api/educap/analytics/health"],
    refetchInterval: 30000,
  });

  const recomputeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/educap/analytics/projections/recompute"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/educap/analytics/health"] });
    },
  });

  const apiEndpoints = [
    { label: "Health Check", path: "/api/educap/analytics/health" },
    { label: "Teacher Analytics", path: "/api/educap/analytics/teacher" },
    { label: "Admin Analytics", path: "/api/educap/analytics/admin" },
    { label: "Mastery Data", path: "/api/educap/analytics/mastery" },
    { label: "Projections", path: "/api/educap/analytics/projections" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6" />
                EduCAP Analytics — Prod Debug
              </h1>
              <p className="text-purple-200 text-sm mt-1">Diagnostic dashboard for InsightStack pipeline</p>
            </div>
            <Button
              variant="outline"
              className="border-white/40 text-white hover:bg-white/20"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-3 text-gray-600">Loading health data...</span>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Failed to fetch health data</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{String(error)}</p>
              <p className="text-xs text-red-500 mt-2">
                The /api/educap/analytics/health endpoint may not be registered yet. This is expected if the InsightStack backend routes haven't been deployed.
              </p>
            </CardContent>
          </Card>
        )}

        {health && (
          <>
            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                  <Database className="h-5 w-5" />
                  Tenant Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">
                    {health.tenant || "BHSA"}
                  </Badge>
                  <span className="text-gray-500 text-sm">Bush Hills STEAM Academy</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Windows", count: health.dbCounts?.windows ?? 0, icon: Layers },
                { label: "Results", count: health.dbCounts?.results ?? 0, icon: BarChart3 },
                { label: "Mastery Rows", count: health.dbCounts?.mastery ?? 0, icon: CheckCircle },
                { label: "Projections", count: health.dbCounts?.projections ?? 0, icon: Activity },
                { label: "Scholars", count: health.dbCounts?.scholars ?? 0, icon: Users },
              ].map((item) => (
                <Card key={item.label} className="border-purple-100">
                  <CardContent className="pt-4 pb-4 text-center">
                    <item.icon className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                    <p className="text-2xl font-bold text-purple-900">{item.count}</p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                  <CheckCircle className="h-5 w-5" />
                  Data Completeness
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const checks = [
                    { label: "Windows", ok: (health.dbCounts?.windows ?? 0) > 0 },
                    { label: "Results", ok: (health.dbCounts?.results ?? 0) > 0 },
                    { label: "Mastery", ok: (health.dbCounts?.mastery ?? 0) > 0 },
                    { label: "Projections", ok: (health.dbCounts?.projections ?? 0) > 0 },
                    { label: "Scholars", ok: (health.dbCounts?.scholars ?? 0) > 0 },
                  ];
                  const score = checks.filter(c => c.ok).length / checks.length;
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-purple-600 h-3 rounded-full transition-all"
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-purple-900">
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {checks.map((item) => (
                          <div key={item.label} className="flex items-center gap-2 text-sm">
                            {item.ok ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                            <span className={item.ok ? "text-green-700" : "text-amber-700"}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                  <AlertTriangle className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  {health.status === "ok" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={health.status === "ok" ? "text-green-700" : "text-red-700"}>
                    Status: {health.status}
                  </span>
                  <span className="text-gray-400 ml-2">|</span>
                  <span className="text-gray-500">Environment: {health.environment}</span>
                  <span className="text-gray-400 ml-2">|</span>
                  <span className="text-gray-500">Events: {health.dbCounts?.events ?? 0}</span>
                </div>
                {(health.dbCounts?.events ?? 0) === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent errors — pipeline healthy</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                <ExternalLink className="h-5 w-5" />
                API Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {apiEndpoints.map((ep) => (
                  <a
                    key={ep.path}
                    href={ep.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-50 transition-colors group"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-purple-700">{ep.label}</span>
                    <code className="text-xs text-gray-400 group-hover:text-purple-500">{ep.path}</code>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                <RefreshCw className="h-5 w-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                onClick={() => recomputeMutation.mutate()}
                disabled={recomputeMutation.isPending}
              >
                {recomputeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Recompute Projections
              </Button>
              {recomputeMutation.isSuccess && (
                <p className="text-sm text-green-600 text-center">Projections recomputed successfully</p>
              )}
              {recomputeMutation.isError && (
                <p className="text-sm text-red-600 text-center">Failed to recompute projections</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}