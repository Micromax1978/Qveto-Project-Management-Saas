require("dotenv").config();

const prisma = require("./lib/prisma");

async function main() {
    const workspace = await prisma.workspace.create({
        data: {
            organizationId: "cmvaumpel00007kvqep9km0bz",
            name: "Qveto Development"
        }
    });

    console.log("Workspace created:");
    console.log(workspace);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });