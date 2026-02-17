"use client";

import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@agendazap/ui";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "organization-deleted") {
      toast.info("Organização desativada", {
        description: "Sua organização foi desativada com sucesso. Para reativar, solicite um link de reativação.",
      });
    } else if (message === "organization-reactivated") {
      toast.success("Organização reativada!", {
        description: "Sua organização foi reativada com sucesso. Faça login para acessar.",
      });
    }
  }, [searchParams]);

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("Digite seu email primeiro");
      return;
    }

    setIsResendingEmail(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      toast.error("Erro ao reenviar email", { description: error.message });
    } else {
      toast.success("Email de confirmação reenviado!", { 
        description: "Verifique sua caixa de entrada." 
      });
    }
    
    setIsResendingEmail(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Tratamento específico para diferentes tipos de erro
      if (error.message.includes("Email not confirmed")) {
        toast.error("Email não confirmado", { 
          description: "Verifique sua caixa de entrada e clique no link de confirmação, ou contate o suporte." 
        });
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error("Credenciais inválidas", { 
          description: "Email ou senha incorretos. Verifique e tente novamente." 
        });
      } else {
        toast.error("Erro ao fazer login", { description: error.message });
      }
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Entrar no AgendaZap</CardTitle>
          <CardDescription>
            Entre com sua conta para acessar o dashboard
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isResendingEmail || !email}
              onClick={handleResendConfirmation}
            >
              {isResendingEmail ? "Reenviando..." : "Reenviar Email de Confirmação"}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Criar conta grátis
              </Link>
            </p>
            
            <p className="text-center text-sm text-muted-foreground">
              Organização desativada?{" "}
              <Link
                href="/request-reactivation"
                className="font-medium text-primary hover:underline"
              >
                Solicitar reativação
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
