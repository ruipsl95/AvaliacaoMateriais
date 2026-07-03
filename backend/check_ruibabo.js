const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  const ruibabo = await prisma.user.findFirst({ where: { username: 'ruibabo' } });
  console.log("Ruibabo:", ruibabo);

  if (ruibabo && ruibabo.disciplinaryGroupId) {
    const subjects = await prisma.subject.findMany({
      where: { disciplinaryGroupId: ruibabo.disciplinaryGroupId },
      include: { course: true }
    });
    console.log(`Subjects for ruibabo's group (${ruibabo.disciplinaryGroupId}):`, subjects.length);
    console.log(subjects);
  }

  const allSubjects = await prisma.subject.findMany({
    include: { course: true, disciplinaryGroup: true }
  });
  console.log("\nAll subjects in DB:", allSubjects.length);
  for(let s of allSubjects) {
     console.log(`Subject: ${s.name} | Group: ${s.disciplinaryGroup?.name} (${s.disciplinaryGroupId}) | Course: ${s.course?.name}`);
  }

  const allGroups = await prisma.disciplinaryGroup.findMany();
  console.log("\nAll groups:");
  console.log(allGroups);

  await prisma.$disconnect();
}
checkDb();
