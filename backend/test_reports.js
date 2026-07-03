const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const reports = await prisma.evaluation.findMany({
      include: {
        evaluator: true,
        teacher: true,
        subject: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(reports);
  } catch(e) {
    console.error("error", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
