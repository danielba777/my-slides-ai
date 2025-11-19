"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type MigrationResult = {
  fileName: string;
  avatarId: string;
  oldUrl?: string;
  newUrl?: string;
  size?: number;
  sizeMB?: string;
  status: "success" | "failed";
  error?: string;
};

type MigrationAuthDetails = {
  hasSession: boolean;
  isAdmin?: boolean;
  isAllowed: boolean;
  userEmail: string;
  allowedEmails: string[];
};

type MigrationResponse = {
  success: boolean;
  summary: {
    total: number;
    successCount: number;
    failureCount: number;
  };
  results: MigrationResult[];
  message: string;
  error?: string;
  details?: MigrationAuthDetails;
};

type VerificationAvatar = {
  id: string;
  name: string;
  videoStatus: "FILESERVER" | "LOCAL" | "NONE";
  isActive: boolean;
  willShowInDashboard: boolean;
};

type VerificationResponse = {
  success: boolean;
  analysis: {
    total: number;
    active: number;
    withVideos: number;
    localVideos: number;
    fileserverVideos: number;
    noVideos: number;
  };
  avatars: VerificationAvatar[];
  dashboardReady: {
    count: number;
    avatars: VerificationAvatar[];
  };
  recommendations: {
    success: boolean;
    message: string;
  };
  error?: string;
};

export default function MigrateVideosPage() {
  const [migrating, setMigrating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [migrationResults, setMigrationResults] = useState<MigrationResponse | null>(null);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [verificationResults, setVerificationResults] = useState<VerificationResponse | null>(null);

  const handleMigrate = async () => {
    if (!confirm("Alle lokalen Hook-Videos werden auf den Fileserver hochgeladen und die Datenbank wird aktualisiert. Fortfahren?")) {
      return;
    }

    setMigrating(true);
    setMigrationResults(null);

    try {
      const response = await fetch("/api/admin/migrate-videos", {
        method: "POST",
      });

      const data: MigrationResponse = await response.json();

      if (!response.ok) {
        console.error("[Migrate] API Error:", {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });

        // Show detailed error info
        if (data.details) {
          console.error("[Migrate] Auth details:", data.details);
          throw new Error(`Unauthorized: ${data.details.userEmail || 'No email'} (Admin: ${data.details.isAdmin}, Allowed: ${data.details.isAllowed})`);
        }

        throw new Error(data.error || `Migration failed (${response.status})`);
      }

      setMigrationResults(data);

      if (data.summary.failureCount === 0) {
        toast.success("🎉 Alle Videos erfolgreich migriert!");
      } else {
        toast.warning(`⚠️ ${data.summary.successCount} erfolgreich, ${data.summary.failureCount} fehlgeschlagen`);
      }

      // Automatically verify after successful migration
      if (data.summary.successCount > 0) {
        setTimeout(() => handleVerify(), 1000);
      }

    } catch (error) {
      console.error("[Migrate] Error:", error);
      toast.error(error instanceof Error ? error.message : "Migration fehlgeschlagen");
    } finally {
      setMigrating(false);
    }
  };

  const handleOptimize = async () => {
    if (!confirm("Preview-Videos für schnelles Dashboard-Loading erstellen. Das verbessert die Performance erheblich. Fortfahren?")) {
      return;
    }

    setOptimizing(true);
    setOptimizationResults(null);

    try {
      const response = await fetch("/api/admin/optimize-videos", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Optimization failed");
      }

      setOptimizationResults(data);

      if (data.failed === 0) {
        toast.success(`⚡ ${data.optimized} Videos optimiert!`);
      } else {
        toast.warning(`⚡ ${data.optimized} optimiert, ${data.failed} fehlgeschlagen`);
      }

      // Auto-verify after optimization
      setTimeout(() => handleVerify(), 1000);

    } catch (error) {
      console.error("[Optimize] Error:", error);
      toast.error(error instanceof Error ? error.message : "Optimization fehlgeschlagen");
    } finally {
      setOptimizing(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);

    try {
      const response = await fetch("/api/admin/verify-migration", {
        method: "POST",
      });

      const data: VerificationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setVerificationResults(data);

      if (data.recommendations.success) {
        toast.success("✅ Videos sind bereit für Hook+Demo!");
      } else {
        toast.warning(data.recommendations.message);
      }

    } catch (error) {
      console.error("[Verify] Error:", error);
      toast.error(error instanceof Error ? error.message : "Verification fehlgeschlagen");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Videos auf Fileserver migrieren</h1>
        <p className="text-muted-foreground mt-2">
          Überträgt alle lokalen Hook-Videos auf den externen Fileserver, damit sie in Production verfügbar sind.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Migration starten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Was passiert hier?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Alle lokalen Videos aus <code>public/ugc/reaction-hooks/</code> werden hochgeladen</li>
                  <li>• URLs in der Datenbank werden auf <code>https://files.slidescockpit.com/...</code> aktualisiert</li>
                  <li>• Videos sind danach in Production verfügbar</li>
                  <li>• Lokale Dateien bleiben bestehen (Backup)</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Button
                  onClick={handleMigrate}
                  disabled={migrating}
                  className="w-full"
                  size="lg"
                >
                  {migrating ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Videos werden migriert...
                    </>
                  ) : (
                    "🚀 Videos übertragen"
                  )}
                </Button>

                <Button
                  onClick={handleOptimize}
                  disabled={optimizing}
                  variant="outline"
                  size="lg"
                >
                  {optimizing ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Optimiere...
                    </>
                  ) : (
                    "⚡ Preview Videos erstellen"
                  )}
                </Button>

                <Button
                  onClick={handleVerify}
                  disabled={verifying}
                  variant="outline"
                  size="lg"
                >
                  {verifying ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Überprüfe...
                    </>
                  ) : (
                    "🔍 Status prüfen"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {migrationResults && (
          <Card>
            <CardHeader>
              <CardTitle>Migrationsergebnisse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{migrationResults.summary.total}</div>
                    <div className="text-sm text-gray-600">Gesamt</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{migrationResults.summary.successCount}</div>
                    <div className="text-sm text-green-600">Erfolgreich</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{migrationResults.summary.failureCount}</div>
                    <div className="text-sm text-red-600">Fehlgeschlagen</div>
                  </div>
                </div>

                {/* Results List */}
                <div className="max-h-96 overflow-y-auto">
                  <h4 className="font-semibold mb-2">Details:</h4>
                  <div className="space-y-2">
                    {migrationResults.results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.status === "success"
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{result.fileName}</div>
                            {result.status === "success" ? (
                              <>
                                <div className="text-sm text-gray-600">{result.sizeMB} MB</div>
                                <div className="text-xs text-blue-600 truncate mt-1">{result.newUrl}</div>
                              </>
                            ) : (
                              <div className="text-sm text-red-600">{result.error}</div>
                            )}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            result.status === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {result.status === "success" ? "✅" : "❌"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {migrationResults.summary.failureCount === 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900">🎉 Migration abgeschlossen!</h3>
                    <p className="text-sm text-green-800 mt-1">
                      Alle Videos sind jetzt auf dem Fileserver verfügbar und funktionieren in Production.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {verificationResults && (
          <Card>
            <CardHeader>
              <CardTitle>Hook+Demo Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{verificationResults.analysis.total}</div>
                    <div className="text-sm text-blue-600">Gesamt</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{verificationResults.analysis.fileserverVideos}</div>
                    <div className="text-sm text-green-600">Fileserver</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{verificationResults.analysis.localVideos}</div>
                    <div className="text-sm text-yellow-600">Lokal</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{verificationResults.dashboardReady.count}</div>
                    <div className="text-sm text-purple-600">Hook+Demo Ready</div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className={`p-4 rounded-lg border ${
                  verificationResults.recommendations.success
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}>
                  <h3 className={`font-semibold ${
                    verificationResults.recommendations.success
                      ? "text-green-900"
                      : "text-yellow-900"
                  }`}>
                    {verificationResults.recommendations.success ? "✅" : "⚠️"} Hook+Demo Status
                  </h3>
                  <p className={`text-sm mt-1 ${
                    verificationResults.recommendations.success
                      ? "text-green-800"
                      : "text-yellow-800"
                  }`}>
                    {verificationResults.recommendations.message}
                  </p>
                </div>

                {/* Dashboard Ready Avatars */}
                {verificationResults.dashboardReady.avatars.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Diese Avatare erscheinen in Hook+Demo:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {verificationResults.dashboardReady.avatars.map((avatar) => (
                        <div key={avatar.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="font-medium text-sm">{avatar.name}</div>
                          <div className="text-xs text-green-600">{avatar.videoStatus}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
