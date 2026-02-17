import { prisma } from "@agendazap/database";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@agendazap/ui";
import { getCurrentUserOrgId } from "@/lib/auth/dashboard";
import { OrganizationForm } from "./organization-form";
import { DeleteOrganizationButton } from "./delete-organization-button";

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const orgId = await getCurrentUserOrgId();
  
  const org = await prisma.organization.findUnique({
    where: { id: orgId }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Configure sua organização
        </p>
      </div>

      {org && (
        <OrganizationForm
          organization={{
            name: org.name,
            slug: org.slug,
            whatsappNumber: org.whatsappNumber,
          }}
          appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
        />
      )}

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis para sua organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteOrganizationButton organizationName={org.name} />
        </CardContent>
      </Card>
    </div>
  );
}
