const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function transferAndDelete(oldName, newName) {
  const oldGroup = await prisma.disciplinaryGroup.findFirst({ where: { name: oldName }});
  const newGroup = await prisma.disciplinaryGroup.findFirst({ where: { name: newName }});
  
  if (oldGroup && newGroup) {
    // transfer subjects
    await prisma.subject.updateMany({ where: { disciplinaryGroupId: oldGroup.id }, data: { disciplinaryGroupId: newGroup.id }});
    // transfer users
    await prisma.user.updateMany({ where: { disciplinaryGroupId: oldGroup.id }, data: { disciplinaryGroupId: newGroup.id }});
    // delete old
    await prisma.disciplinaryGroup.delete({ where: { id: oldGroup.id }});
    console.log(`Transferred and deleted: ${oldName} -> ${newName}`);
  }
}

async function main() {
  // Renomear Economia se existir com o nome antigo
  const ecOld = await prisma.disciplinaryGroup.findFirst({ where: { name: 'Economia' }});
  if (ecOld) {
    await prisma.disciplinaryGroup.update({
      where: { id: ecOld.id },
      data: { name: 'Economia, OEAG, Área técnica de VM' }
    });
    console.log('Renamed Economia -> Economia, OEAG, Área técnica de VM');
  }

  await transferAndDelete('LP / AISE / SI / TIC', 'Informática');
}
main().finally(() => prisma.$disconnect());
