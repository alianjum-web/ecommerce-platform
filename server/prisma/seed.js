"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = "admin@gmail.com";
    const password = "123456";
    const name = "Super Admin";
    const existingSuperAdmin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
    });
    if (existingSuperAdmin) {
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const superAdminUser = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            role: "SUPER_ADMIN",
        },
    });
    console.log("Super admin created successfully", superAdminUser.email);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
