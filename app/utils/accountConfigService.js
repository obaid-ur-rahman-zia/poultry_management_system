// accountConfigService.ts
import prisma from "@/lib/prisma";

export class AccountConfigService {
  async getAccountConfig(description, tx) {
    const prismaClient = tx ? tx : prisma;
    const config = await prismaClient.account_manage.findFirst({
      where: {
        description: description,
        is_active: 1,
      },
      select: {
        head_id: true,
        sub_id: true,
        acc_id: true,
        display_category: true,
      },
    });

    if (!config) {
      throw new Error(
        `No active configuration found for account type: ${description}`
      );
    }

    return config;
  }

  async getAllActiveConfigs() {
    const configs = await prisma.account_manage.findMany({
      where: {
        is_active: 1,
      },
      select: {
        head_id: true,
        sub_id: true,
        display_category: true,
      },
    });

    return configs;
  }
}
