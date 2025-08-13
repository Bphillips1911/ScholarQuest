import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeploymentTest() {
  const [email, setEmail] = useState("nslaw@yahoo.com");
  const [password, setPassword] = useState("password");
  const [result, setResult] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const testLogin = async () => {
    setResult("");
    setLogs([]);
    
    try {
      addLog("Starting deployment test...");
      addLog(`Environment: ${window.location.hostname}`);
      addLog(`Protocol: ${window.location.protocol}`);
      addLog(`Testing with email: ${email}`);
      
      const apiUrl = "/api/parent/login";
      addLog(`API URL: ${apiUrl}`);
      
      const requestBody = { email, password };
      addLog(`Request body: ${JSON.stringify(requestBody)}`);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      addLog(`Response status: ${response.status}`);
      addLog(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Error response text: ${errorText}`);
        setResult(`FAILED: ${response.status} - ${errorText}`);
        return;
      }
      
      const data = await response.json();
      addLog(`Success response: ${JSON.stringify(data, null, 2)}`);
      
      // Test localStorage
      addLog("Testing localStorage...");
      localStorage.setItem("testKey", "testValue");
      const retrieved = localStorage.getItem("testKey");
      addLog(`localStorage test: ${retrieved === "testValue" ? "PASS" : "FAIL"}`);
      
      setResult("SUCCESS: Login API works correctly in deployment!");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Caught error: ${errorMessage}`);
      setResult(`ERROR: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Deployment Environment Test</CardTitle>
          <p className="text-sm text-gray-600">
            Testing parent login in deployment vs preview
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
          </div>
          
          <Button onClick={testLogin} className="w-full">
            Test Login API
          </Button>
          
          {result && (
            <div className={`p-4 rounded ${result.startsWith("SUCCESS") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              <strong>Result:</strong> {result}
            </div>
          )}
          
          {logs.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              <div className="font-bold mb-2">Debug Logs:</div>
              {logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}