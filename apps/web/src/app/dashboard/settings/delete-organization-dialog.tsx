"use client";

import { useState } from "react";
import { Input, Label } from "@agendazap/ui";
import { deactivateOrganization } from "@/app/actions/organization";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Importar Button com tipo específico
import { Button, type ButtonProps } from "@agendazap/ui";

interface DeleteOrganizationDialogProps {
  organizationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteOrganizationDialog({
  organizationName,
  open,
  onOpenChange,
}: DeleteOrganizationDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deactivateOrganization(confirmationText);

      if (result.success) {
        // Mostrar mensagem de sucesso
        toast.success("Organização desativada", {
          description: "Sua organização foi desativada com sucesso. Para reativar, solicite um link de reativação.",
          duration: 3000,
        });
        
        // Fechar o diálogo
        onOpenChange(false);
        
        // Aguardar um pouco para o toast aparecer
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Hard redirect para limpar cache e sessão
        window.location.href = "/login?message=organization-deleted";
      } else {
        setError(result.error || "Erro ao excluir organização");
        setIsDeleting(false);
      }
    } catch (err) {
      console.error("Erro ao desativar organização:", err);
      setError("Erro inesperado. Tente novamente.");
      setIsDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-destructive">
              Excluir Organização
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Esta ação irá desativar sua organização <strong>{organizationName}</strong>.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <h3 className="font-semibold text-sm mb-2">⚠️ Importante:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-700 dark:text-gray-300">
              <li>Todos os membros perderão acesso</li>
              <li>O histórico será preservado</li>
              <li>Você pode reativar posteriormente</li>
              <li>Um email de confirmação será necessário para reativação</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Digite <strong>EXCLUIR PERMANENTEMENTE</strong> para confirmar:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="EXCLUIR PERMANENTEMENTE"
              className="font-mono"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmationText("");
                setError(null);
                onOpenChange(false);
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                confirmationText !== "EXCLUIR PERMANENTEMENTE" || isDeleting
              }
            >
              {isDeleting ? "Excluindo..." : "Excluir Organização"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
