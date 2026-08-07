const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SPECIALITIES = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Gynecologist",
  "Orthopedic",
  "Psychiatrist",
];

async function upsertUser({ name, email, role, kyc_status }) {
  const password = await bcrypt.hash("Password@1", 10);
  return prisma.users.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      password,
      role,
      email_verified: true,
      kyc_status: kyc_status || "Not Submitted",
    },
  });
}

async function seedDoctors() {
  for (let i = 1; i <= 7; i++) {
    const email = `doctor${i}@bsh.com`;
    const user = await upsertUser({
      name: `Dr. Doctor ${i}`,
      email,
      role: "Doctor",
      kyc_status: "Approved",
    });

    await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        nmc_number: `NMC-${1000 + i}`,
        speciality: SPECIALITIES[(i - 1) % SPECIALITIES.length],
        educational_qualification: "MBBS, MD",
        years_of_experience: 5 + i,
        is_active: true,
      },
    });

    console.log(`Seeded ${email}`);
  }
}

async function seedPatients() {
  for (let i = 1; i <= 20; i++) {
    const email = `patient${i}@bsh.com`;
    const user = await upsertUser({
      name: `Patient ${i}`,
      email,
      role: "Patient",
    });

    await prisma.patient.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
      },
    });

    console.log(`Seeded ${email}`);
  }
}

async function seedAdmin() {
  const email = "meroaspatal1@gmail.com";
  await upsertUser({
    name: "Admin",
    email,
    role: "Admin",
  });
  console.log(`Seeded ${email}`);
}

async function main() {
  await seedDoctors();
  await seedPatients();
  await seedAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
