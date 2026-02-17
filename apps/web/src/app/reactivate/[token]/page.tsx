"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Spinner } from "@agendazap/ui";
import { reactivateOrganization } from "@/app/actions/organization";

function ReactivateContent() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; organizationSlug?: string } | null>(null);
  
  // Prevenir execução duplicada do useEffect (React 18 Strict Mode)
  const hasActivated = useRef(false);

  useEffect(() => {
    // Se já executou, não executar novamente
    if (hasActivated.current) {
      return;
    }
    
    if (!token) {
      setResult({
        success: false,
        message: "Token de reativação não fornecido",
      });
      setIsLoading(false);
      return;
    }

    const activate = async () => {
      // Marcar como executado ANTES da chamada para prevenir race conditions
      hasActivated.current = true;
      
      try {
        const response = await reactivateOrganization(token);
        setResult(response);
        
        if (response.success && response.organizationSlug) {
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            window.location.href = "/login?message=organization-reactivated";
          }, 2000);
        }
      } catch (err) {
        console.error("Erro ao reativar:", err);
        setResult({
          success: false,
          message: "Erro inesperado ao reativar organização",
        });
      } finally {
        setIsLoading(false);
      }
    };

    activate();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Reativação de Organização</CardTitle>
          <CardDescription>
            Processando sua solicitação de reativação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Spinner />
              <p className="text-sm text-muted-foreground">
                Verificando token...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div
                className={`rounded-md p-4 ${
                  result.success
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm ${
                    result.success
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {result.message || result.error}
                </p>
              </div>

              {result.success ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Você será redirecionado para o login em alguns segundos...
                  </p>
                  <Button
                    onClick={() => router.push("/login")}
                    className="w-full"
                  >
                    Ir para Login
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push("/request-reactivation")}
                    className="w-full"
                  >
                    Solicitar Novo Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/login")}
                    className="w-full"
                  >
                    Voltar ao Login
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReactivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner />
      </div>
    }>
      <ReactivateContent />
    </Suspense>
  );
}
