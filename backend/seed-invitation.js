require("dotenv").config();

const prisma = require("./lib/prisma");

async function main() {
    // Create test organization
    const organization = await prisma.organization.create({
        data: {
            name: "Qveto Test Organization"
        }
    });

    // Create manager invitation
    const invitation = await prisma.invitation.create({
        data: {
            code: "MANAGER123",
            organizationId: organization.id,
            role: "manager"
        }
    });

    // Create employee invitation
    const employeeInvitation = await prisma.invitation.create({
        data: {
            code: "EMPLOYEE123",
            organizationId: organization.id,
            role: "employee"
        }
    });

    console.log("Test organization created:");
    console.log(organization);

    console.log("\nManager invitation:");
    console.log(invitation);

    console.log("\nEmployee invitation:");
    console.log(employeeInvitation);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });