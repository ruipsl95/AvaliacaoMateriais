const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const name = "Valid Subject";
    const year = "";
    const disciplinaryGroupId = "974bbcb3-e31c-4f88-9a63-6d1f0550bc9e";
    const courseId = "13a47dbb-2dbc-46d1-bd96-1863da750e44";
    const teacherId = "a8d2c6fb-89a5-4cc7-ad45-801286a0617b";
    
    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        year: year ? parseInt(year) : null,
        disciplinaryGroup: disciplinaryGroupId ? { connect: { id: disciplinaryGroupId } } : undefined,
        course: { connect: { id: courseId } },
        teacher: teacherId ? { connect: { id: teacherId } } : undefined
      }
    });
    console.log("Success:", subject);
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
