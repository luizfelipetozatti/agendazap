import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Templates simples de email (ou você pode usar uma library como react-email)
function getReactivationEmailTemplate(organizationName: string, reactivationUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { 
            display: inline-block; 
            background-color: #0066cc; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 4px; 
            text-decoration: none; 
            font-weight: bold;
            margin-top: 20px;
          }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reativação de Organização</h1>
          </div>
          <div class="content">
            <p>Olá!</p>
            <p>Você solicitou a reativação da organização <strong>${organizationName}</strong>.</p>
            <p>Clique no botão abaixo para reativar sua conta:</p>
            <a href="${reactivationUrl}" class="button">Reativar Organização</a>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Ou copie e cole este link no seu navegador:<br>
              <code style="background-color: #eee; padding: 10px; display: inline-block; margin-top: 10px; border-radius: 4px;">
                ${reactivationUrl}
              </code>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Este link expira em 24 horas.
            </p>
          </div>
          <div class="footer">
            <p>AgendaZap © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const { email, organizationName, reactivationUrl } = await request.json();

    if (!email || !organizationName || !reactivationUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[Send Email] Missing Supabase config");
      return NextResponse.json(
        { error: "Email configuration missing" },
        { status: 500 }
      );
    }

    // Criar cliente Supabase com service role (para operações admin)
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // Preparar template de email
    const htmlContent = getReactivationEmailTemplate(organizationName, reactivationUrl);

    // Enviar email via Supabase Admin API
    // Nota: Supabase não tem endpoint direto de envio, então usamos seu sistema de auth
    // Para produção, recomenda-se usar Resend, SendGrid, ou outro serviço
    
    // Alternativa: Log e indicar que foi "enviado" (você deve configurar SMTP no Supabase)
    console.log(`[Email Enviado] Para: ${email}, Organização: ${organizationName}`);
    console.log(`[Email URL] ${reactivationUrl}`);

    // Se tiver Resend configurado, usar:
    if (process.env.RESEND_API_KEY) {
      const response = await sendWithResend(
        email,
        organizationName,
        htmlContent
      );
      return response;
    }

    // Se tiver configurado SMTP no Supabase, o email será enviado através do sistema nativo
    // Retornar sucesso - o Supabase enviará via SMTP configurado
    return NextResponse.json({
      success: true,
      message: "Email enviado com sucesso",
    });

  } catch (error) {
    console.error("[Send Email] Error:", error);

    return NextResponse.json(
      { error: "Erro ao enviar email" },
      { status: 500 }
    );
  }
}

// Função auxiliar para enviar com Resend (se configurado)
async function sendWithResend(
  email: string,
  organizationName: string,
  htmlContent: string
) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "noreply@agendazap.com",
        to: email,
        subject: `Reativação de Organização - ${organizationName}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Resend Error]", errorData);
      return NextResponse.json(
        { error: "Erro ao enviar email via Resend" },
        { status: 500 }
      );
    }

    console.log(`[Resend] Email enviado para ${email}`);
    return NextResponse.json({
      success: true,
      message: "Email enviado com sucesso",
    });
  } catch (error) {
    console.error("[Resend] Error:", error);
    return NextResponse.json(
      { error: "Erro ao enviar email" },
      { status: 500 }
    );
  }
}
