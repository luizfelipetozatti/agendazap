import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();

  // Usar a URL base da request atual
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}
