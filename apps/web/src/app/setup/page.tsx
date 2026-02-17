"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  PhoneInput,
} from "@agendazap/ui";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Componente que usa searchParams - precisa estar em Suspense
function SetupDescription() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <CardDescription>
      {reason === "no-organization"
        ? "Você não tem nenhuma organização ativa. Crie uma para continuar."
        : "Configure sua conta e crie sua primeira organização"}
    </CardDescription>
  );
}

function SetupForm() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<{
    email: string;
    name: string;
    supabaseId: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    orgName: "",
    whatsapp: "",
  });

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserData({
        email: user.email || "",
        name: user.user_metadata?.name || "",
        supabaseId: user.id,
      });

      setFormData((prev) => ({
        ...prev,
        name: user.user_metadata?.name || "",
      }));
    };

    loadUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseId: userData?.supabaseId,
          email: userData?.email,
          name: formData.name,
          orgName: formData.orgName,
          whatsapp: formData.whatsapp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao configurar conta");
      }

      toast.success("Conta configurada com sucesso!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Setup error:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao configurar conta"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete seu Cadastro</CardTitle>
          <Suspense fallback={<CardDescription>Carregando...</CardDescription>}>
            <SetupDescription />
          </Suspense>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Seu Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="João Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgName">Nome da Organização</Label>
              <Input
                id="orgName"
                value={formData.orgName}
                onChange={(e) =>
                  setFormData({ ...formData, orgName: e.target.value })
                }
                placeholder="Minha Clínica"
                required
              />
              <p className="text-xs text-muted-foreground">
                Este será o nome público da sua organização
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (Opcional)</Label>
              <PhoneInput
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(value) =>
                  setFormData({ ...formData, whatsapp: value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Número com código do país e DDD
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Configurando..." : "Criar Organização"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetupPage() {
  return <SetupForm />;
}
