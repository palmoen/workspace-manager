import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ override: true });

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "kontorcompaniet" },
    update: {},
    create: {
      id: "kontorcompaniet",
      navn: "Kontorcompaniet",
      logoUrl: "/Kontorcompaniet Horisontal.svg",
    },
  });
  console.log("Tenant:", tenant.id, tenant.navn);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
