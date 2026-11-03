require("dotenv").config();

const prisma = require("./lib/prisma");

async function main() {
    const projects = await prisma.project.findMany({
        where: {
            organizationId: "cmvaumpel00007kvqep9km0bz"
        },
        select: {
            id: true,
            name: true,
            organizationId: true
        }
    });

    console.log(projects);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });