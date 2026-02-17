"use client";

import { useState } from "react";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@agendazap/ui";
import { requestReactivation } from "@/app/actions/organization";

export default function RequestReactivationPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; developmentToken?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await requestReactivation(email);
      setResult(response);
      if (response.success) {
        setEmail("");
      }
    } catch (err) {
      setResult({
        success: false,
        message: "Erro inesperado. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Reativar Organização</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de reativação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Você deve ser proprietário da organização para reativá-la
              </p>
            </div>

            {result && (
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
                {result.developmentToken && (
                  <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border">
                    <p className="text-xs font-semibold mb-1">Link de desenvolvimento:</p>
                    <a 
                      href={result.developmentToken}
                      className="text-xs break-all text-blue-600 hover:underline"
                    >
                      {result.developmentToken}
                    </a>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Solicitar Reativação"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
