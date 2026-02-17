"use client";

import { useState } from "react";
import { Button } from "@agendazap/ui";
import { DeleteOrganizationDialog } from "./delete-organization-dialog";

interface DeleteOrganizationButtonProps {
  organizationName: string;
}

export function DeleteOrganizationButton({
  organizationName,
}: DeleteOrganizationButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button variant="destructive" onClick={() => setDialogOpen(true)}>
        Excluir Organização
      </Button>
      <DeleteOrganizationDialog
        organizationName={organizationName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
