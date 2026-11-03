require("dotenv").config();
const prisma = require("./lib/prisma");

async function main() {
    const projects = await prisma.project.findMany({
        where: {
            organizationId: "cmvaumpel00007kvqep9km0bz",
            name: "Qveto Website"
        },
        select: {
            id: true,
            name: true,
            workspaceId: true
        }
    });

    console.log("Your Qveto project:");
    console.log(projects);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
