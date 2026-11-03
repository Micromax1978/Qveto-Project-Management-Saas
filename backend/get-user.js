require("dotenv").config();

const prisma = require("./lib/prisma");

async function main() {
    const user = await prisma.user.findUnique({
        where: {
            email: "manager2@test.com"
        },
        select: {
            id: true,
            email: true
        }
    });

    console.log(user);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });