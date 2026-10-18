require("dotenv").config();
const prisma = require("./config/prisma");

async function main() {
    // Find or create test organization
    let organization = await prisma.organization.findFirst();

    if (!organization) {
        organization = await prisma.organization.create({
            data: {
                name: "Qveto Test Organization"
            }
        });
    }

    // Create manager invitation
    const invitation = await prisma.invitation.create({
        data: {
            code: "MANAGER123",
            organizationId: organization.id,
            role: "MANAGER"
        }
    });

    // Create employee invitation
    const employeeInvitation = await prisma.invitation.create({
        data: {
            code: "EMPLOYEE123",
            organizationId: organization.id,
            role: "EMPLOYEE"
        }
    });

    console.log("Test organization:", organization.name, `(${organization.id})`);
    console.log("Manager invitation code:", invitation.code);
    console.log("Employee invitation code:", employeeInvitation.code);
}

main()
    .catch((error) => {
        console.error("Error creating invitations:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
