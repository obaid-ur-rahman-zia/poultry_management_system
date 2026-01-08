import { swaggerSpec } from '@/app/utils/swagger';

export async function GET() {
  return Response.json(swaggerSpec);
}

