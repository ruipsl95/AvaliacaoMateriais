const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const disciplinaryGroupId = "974bbcb3-e31c-4f88-9a63-6d1f0550bc9e";
  const subjects = await prisma.subject.findMany({
    where: { disciplinaryGroupId },
    include: { course: true, teacher: true }
  });
  const courseMap = new Map();
  subjects.forEach(s => {
    if (s.course && !courseMap.has(s.course.id)) {
      courseMap.set(s.course.id, s.course);
    }
  });
  const courses = Array.from(courseMap.values());
  console.log("Subjects:", subjects.length);
  console.log("Courses:", courses.length);
  console.log(courses);
  await prisma.$disconnect();
}
test();
