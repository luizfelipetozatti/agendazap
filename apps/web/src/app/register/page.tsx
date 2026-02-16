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
  PhoneInput,
} from "@agendazap/ui";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();

    // 1. Criar conta no Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, org_name: orgName },
      },
    });

    if (error) {
      // Tratamento específico para rate limit de email
      if (error.message.includes("email rate limit exceeded")) {
        toast.error("Limite de emails atingido", { 
          description: "Tente novamente em alguns minutos ou contate o suporte." 
        });
      } else if (error.message.includes("User already registered")) {
        toast.error("Email já cadastrado", { 
          description: "Tente fazer login ou usar um email diferente." 
        });
      } else {
        toast.error("Erro ao criar conta", { description: error.message });
      }
      setIsLoading(false);
      return;
    }

    if (data.user) {
      // 2. Criar user e org via API route
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseId: data.user.id,
          email,
          name,
          orgName,
          whatsapp,
        }),
      });

      if (!response.ok) {
        toast.error("Conta criada, mas erro ao configurar organização");
        setIsLoading(false);
        return;
      }
    }

    // Verificar se email confirmação está habilitada
    const needsConfirmation = !data.session && data.user && !data.user.email_confirmed_at;
    
    if (needsConfirmation) {
      toast.success("Conta criada com sucesso!", {
        description: "Verifique seu email para confirmar a conta.",
      });
      router.push("/login");
    } else {
      toast.success("Conta criada e confirmada!", {
        description: "Redirecionando para o dashboard...",
      });
      router.push("/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>
            Comece a usar o AgendaZap gratuitamente
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome</Label>
              <Input
                id="name"
                placeholder="João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgName">Nome do negócio</Label>
              <Input
                id="orgName"
                placeholder="Minha Clínica"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <PhoneInput
                id="whatsapp"
                value={whatsapp}
                onChange={setWhatsapp}
              />
            </div>
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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
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
              {isLoading ? "Criando conta..." : "Criar Conta Grátis"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
