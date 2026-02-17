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

  // Função auxiliar para configurar a organização
  const setupOrganization = async (userId: string) => {
    const response = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supabaseId: userId,
        email,
        name,
        orgName,
        whatsapp,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      
      // Verificar se é uma organização deletada
      if (data.error === "ORGANIZATION_DELETED") {
        toast.warning("Organização já existe", {
          description: data.message,
        });
        router.push("/request-reactivation");
        return false;
      }
      
      // Verificar se o nome já está em uso
      if (data.error === "ORGANIZATION_EXISTS") {
        toast.error("Nome já está em uso", {
          description: data.message,
        });
        return false;
      }
      
      // Verificar se o slug já está em uso
      if (data.error === "SLUG_EXISTS") {
        toast.error("Nome indisponível", {
          description: data.message,
        });
        return false;
      }
      
      toast.error("Erro ao configurar organização");
      return false;
    }
    
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. PRIMEIRO: Verificar se o nome da organização está disponível
    const checkResponse = await fetch("/api/auth/check-org-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgName }),
    });

    if (!checkResponse.ok) {
      const checkData = await checkResponse.json();
      
      if (checkData.error === "ORGANIZATION_EXISTS") {
        toast.error("Nome já está em uso", {
          description: checkData.message,
        });
        setIsLoading(false);
        return;
      }
      
      if (checkData.error === "ORGANIZATION_PENDING_REACTIVATION" || checkData.error === "ORGANIZATION_DELETED") {
        toast.warning("Organização já existe", {
          description: checkData.message,
        });
        router.push("/request-reactivation");
        setIsLoading(false);
        return;
      }
    }

    const supabase = createClient();

    // 2. Criar conta no Supabase (somente após validar nome da org)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, org_name: orgName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      // Tratamento específico para erro de envio de email
      if (error.message.includes("Error sending confirmation email")) {
        console.warn("Erro ao enviar email de confirmação, mas conta foi criada:", error);
        
        toast.warning("Conta criada, mas email não enviado", { 
          description: "Configure o SMTP no Supabase ou desabilite a confirmação de email." 
        });
        
        // Continuar com o fluxo mesmo sem email
        if (data?.user) {
          const setupSuccess = await setupOrganization(data.user.id);
          if (!setupSuccess) {
            setIsLoading(false);
            return;
          }
          
          toast.success("Conta configurada com sucesso!");
          router.push("/dashboard");
        }
        
        setIsLoading(false);
        return;
      }
      
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
      // 3. Criar user e org via API route
      const setupSuccess = await setupOrganization(data.user.id);
      
      if (!setupSuccess) {
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
        duration: 3000,
      });
      
      // Marcar que acabou de criar a conta (evitar race condition no dashboard)
      sessionStorage.setItem("just_registered", "true");
      sessionStorage.setItem("registered_at", Date.now().toString());
      
      // Aguardar um pouco para garantir que o banco processou
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Force refresh para limpar qualquer cache do Next.js
      window.location.href = "/dashboard";
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
