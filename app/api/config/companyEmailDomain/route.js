import { NextResponse } from "next/server";

export async function GET() {
  const companyEmailDomain = process.env.COMPANY_EMAIL_DOMAIN || "";
  
  return NextResponse.json({
    domain: companyEmailDomain,
  });
}

