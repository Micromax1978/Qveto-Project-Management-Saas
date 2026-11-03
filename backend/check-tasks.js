
require("dotenv").config();

const prisma = require("./lib/prisma");

async function main() {
    const projectId = "cmvp4xgz10000ksvqh1eq95er";

    const tasks = await prisma.task.findMany({
        where: {
            projectId: projectId
        },
        select: {
            id: true,
            title: true,
            status: true,
            priority: true
        }
    });

    console.log("Tasks in your project:");
    console.log(tasks);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

