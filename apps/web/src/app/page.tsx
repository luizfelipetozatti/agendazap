import { Button } from "@agendazap/ui";
import { Calendar, MessageCircle, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AgendaZap</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Começar Grátis</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight">
            Agendamento inteligente com{" "}
            <span className="text-whatsapp">WhatsApp</span> automático
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Simplifique o agendamento da sua clínica ou coworking. Seus clientes
            agendam online e recebem confirmação automática pelo WhatsApp.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Criar Conta Grátis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg">
                Ver Demo
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">
              Tudo que você precisa
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-6">
                <Calendar className="h-10 w-10 text-primary" />
                <h3 className="mt-4 text-xl font-semibold">
                  Agendamento Online
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Página personalizada para seus clientes agendarem 24/7, sem
                  necessidade de ligação.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <MessageCircle className="h-10 w-10 text-whatsapp" />
                <h3 className="mt-4 text-xl font-semibold">
                  WhatsApp Automático
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Confirmação e lembretes automáticos via WhatsApp. Reduza
                  faltas em até 70%.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <Building2 className="h-10 w-10 text-primary" />
                <h3 className="mt-4 text-xl font-semibold">Multi-Negócios</h3>
                <p className="mt-2 text-muted-foreground">
                  Gerencie múltiplas unidades ou negócios em uma única
                  plataforma com isolamento total.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AgendaZap. Todos os direitos
          reservados.
        </div>
      </footer>
    </div>
  );
}
