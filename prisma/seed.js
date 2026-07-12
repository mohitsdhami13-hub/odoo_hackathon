const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // ---- 1. Reference data: Departments (upsert, no head yet — avoids circular FK issue) ----
  const engineering = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering" },
  });

  const marketing = await prisma.department.upsert({
    where: { name: "Marketing" },
    update: {},
    create: { name: "Marketing" },
  });

  // ---- 2. Reference data: Users (upsert by email) ----
  const admin = await prisma.user.upsert({
    where: { email: "admin@assetflow.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@assetflow.com",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@assetflow.com" },
    update: {},
    create: {
      name: "Asha Patel",
      email: "manager@assetflow.com",
      password: passwordHash,
      role: "ASSET_MANAGER",
    },
  });

  const deptHead = await prisma.user.upsert({
    where: { email: "depthead@assetflow.com" },
    update: {},
    create: {
      name: "Rohan Mehta",
      email: "depthead@assetflow.com",
      password: passwordHash,
      role: "DEPARTMENT_HEAD",
      departmentId: engineering.id,
    },
  });

  const employee1 = await prisma.user.upsert({
    where: { email: "priya@assetflow.com" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "priya@assetflow.com",
      password: passwordHash,
      role: "EMPLOYEE",
      departmentId: engineering.id,
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: "raj@assetflow.com" },
    update: {},
    create: {
      name: "Raj Verma",
      email: "raj@assetflow.com",
      password: passwordHash,
      role: "EMPLOYEE",
      departmentId: marketing.id,
    },
  });

  // ---- 3. Now that the department head exists, link it back to the department ----
  await prisma.department.update({
    where: { id: engineering.id },
    data: { headId: deptHead.id },
  });

  // ---- 4. Reference data: Asset Categories (upsert) ----
  const electronics = await prisma.assetCategory.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics" },
  });

  const furniture = await prisma.assetCategory.upsert({
    where: { name: "Furniture" },
    update: {},
    create: { name: "Furniture" },
  });

  const vehicles = await prisma.assetCategory.upsert({
    where: { name: "Vehicles" },
    update: {},
    create: { name: "Vehicles" },
  });

  // ---- 5. Wipe transactional/demo data so re-seeding gives a consistent, predictable state ----
  // Order matters: delete children before parents to respect foreign keys.
  await prisma.notification.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.asset.deleteMany({});

  // ---- 6. Assets — a realistic mix of statuses ----
  const laptop1 = await prisma.asset.create({
    data: {
      assetTag: "AF-0001",
      name: "Dell Latitude 5440",
      categoryId: electronics.id,
      serialNumber: "SN-LAP-0001",
      acquisitionDate: new Date("2024-03-10"),
      acquisitionCost: 82000,
      condition: "Good",
      location: "Engineering Floor 2",
      status: "ALLOCATED",
    },
  });

  const laptop2 = await prisma.asset.create({
    data: {
      assetTag: "AF-0002",
      name: "Dell Latitude 5440",
      categoryId: electronics.id,
      serialNumber: "SN-LAP-0002",
      acquisitionDate: new Date("2024-03-10"),
      acquisitionCost: 82000,
      condition: "Good",
      location: "Store Room",
      status: "AVAILABLE",
    },
  });

  const chair1 = await prisma.asset.create({
    data: {
      assetTag: "AF-0003",
      name: "Ergonomic Office Chair",
      categoryId: furniture.id,
      serialNumber: "SN-CHR-0001",
      acquisitionDate: new Date("2023-11-05"),
      acquisitionCost: 12000,
      condition: "Good",
      location: "Marketing Floor 1",
      status: "ALLOCATED",
    },
  });

  const projector = await prisma.asset.create({
    data: {
      assetTag: "AF-0004",
      name: "Epson Projector EB-X06",
      categoryId: electronics.id,
      serialNumber: "SN-PRJ-0001",
      acquisitionDate: new Date("2023-08-20"),
      acquisitionCost: 35000,
      condition: "Good",
      location: "Conference Room B2",
      isBookable: true,
      status: "AVAILABLE",
    },
  });

  const companyCar = await prisma.asset.create({
    data: {
      assetTag: "AF-0005",
      name: "Company Car — Toyota Innova",
      categoryId: vehicles.id,
      serialNumber: "SN-VEH-0001",
      acquisitionDate: new Date("2022-01-15"),
      acquisitionCost: 1450000,
      condition: "Needs Repair",
      location: "Parking Lot A",
      isBookable: true,
      status: "UNDER_MAINTENANCE",
    },
  });

  await prisma.asset.create({
    data: {
      assetTag: "AF-0006",
      name: "Standing Desk (Old Model)",
      categoryId: furniture.id,
      serialNumber: "SN-DSK-0001",
      acquisitionDate: new Date("2019-06-01"),
      acquisitionCost: 9000,
      condition: "Worn",
      location: "Storage",
      status: "RETIRED",
    },
  });

  // ---- 7. Allocations — one active + overdue (demonstrates the dashboard flag), one active on time ----
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 3); // 3 days overdue

  const futureReturnDate = new Date();
  futureReturnDate.setDate(futureReturnDate.getDate() + 10);

  await prisma.allocation.create({
    data: {
      assetId: laptop1.id,
      employeeId: employee1.id,
      status: "ACTIVE",
      allocatedAt: new Date("2024-06-01"),
      expectedReturnDate: overdueDate, // overdue on purpose
    },
  });

  await prisma.allocation.create({
    data: {
      assetId: chair1.id,
      employeeId: employee2.id,
      status: "ACTIVE",
      allocatedAt: new Date("2024-09-15"),
      expectedReturnDate: futureReturnDate,
    },
  });

  // ---- 8. A pending transfer request (demo of the conflict workflow) ----
  await prisma.transferRequest.create({
    data: {
      assetId: laptop1.id,
      requestedById: employee2.id,
      toEmployeeId: employee2.id,
      status: "PENDING",
    },
  });

  // ---- 9. Bookings — one upcoming, one completed (in the past) ----
  const tomorrow10am = new Date();
  tomorrow10am.setDate(tomorrow10am.getDate() + 1);
  tomorrow10am.setHours(10, 0, 0, 0);
  const tomorrow11am = new Date(tomorrow10am);
  tomorrow11am.setHours(11, 0, 0, 0);

  await prisma.booking.create({
    data: {
      assetId: projector.id,
      bookedById: employee1.id,
      startTime: tomorrow10am,
      endTime: tomorrow11am,
      status: "UPCOMING",
    },
  });

  const lastWeekStart = new Date();
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  lastWeekStart.setHours(14, 0, 0, 0);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setHours(15, 0, 0, 0);

  await prisma.booking.create({
    data: {
      assetId: projector.id,
      bookedById: employee2.id,
      startTime: lastWeekStart,
      endTime: lastWeekEnd,
      status: "COMPLETED",
    },
  });

  // ---- 10. Maintenance requests — one approved/in-progress, one pending ----
  await prisma.maintenanceRequest.create({
    data: {
      assetId: companyCar.id,
      raisedById: employee2.id,
      issue: "Engine making unusual noise, needs inspection",
      priority: "HIGH",
      status: "APPROVED",
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: laptop2.id,
      raisedById: employee1.id,
      issue: "Battery draining faster than expected",
      priority: "LOW",
      status: "PENDING",
    },
  });

  // ---- 11. A couple of notifications, so the notification feed isn't empty on first look ----
  await prisma.notification.create({
    data: {
      userId: manager.id,
      message: "New maintenance request raised for AF-0005 (High priority)",
    },
  });

  await prisma.notification.create({
    data: {
      userId: deptHead.id,
      message: "Transfer request pending your approval for AF-0001",
    },
  });

  console.log("Seed complete:");
  console.log({
    admin: admin.email,
    manager: manager.email,
    deptHead: deptHead.email,
    employees: [employee1.email, employee2.email],
    departments: [engineering.name, marketing.name],
    categories: [electronics.name, furniture.name, vehicles.name],
    assets: 6,
  });
  console.log("All demo accounts use password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });