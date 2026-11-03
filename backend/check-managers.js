require("dotenv").config();
const prisma = require("./lib/prisma");

async function main() {
    const managers = await prisma.membership.findMany({
        where: { role: "manager" },
        select: {
            organizationId: true,
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    console.log("Manager accounts:");
    console.log(managers);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
