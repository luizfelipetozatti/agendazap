import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  Button,
} from "@agendazap/ui";
import { prisma } from "@agendazap/database";

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';

// TODO: Pegar org_id da session
async function getOrg() {
  return prisma.organization.findFirst();
}

export default async function SettingsPage() {
  const org = await getOrg();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Configure sua organização
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Organização</CardTitle>
          <CardDescription>
            Dados principais do seu negócio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              defaultValue={org?.name ?? ""}
              placeholder="Nome do negócio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL de agendamento)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                /agendar/
              </span>
              <Input
                id="slug"
                defaultValue={org?.slug ?? ""}
                placeholder="meu-negocio"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              URL pública: {process.env.NEXT_PUBLIC_APP_URL}/agendar/
              {org?.slug ?? "seu-slug"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Número WhatsApp</Label>
            <Input
              id="whatsapp"
              defaultValue={org?.whatsappNumber ?? ""}
              placeholder="5511999999999"
            />
          </div>
          <Button>Salvar Alterações</Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis para sua organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Excluir Organização</Button>
        </CardContent>
      </Card>
    </div>
  );
}
