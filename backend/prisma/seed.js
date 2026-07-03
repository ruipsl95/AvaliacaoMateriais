const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding...');

  // Criar o Administrador
  const adminPassword = bcrypt.hashSync('admin123', 8);

  const admin = await prisma.user.upsert({
    where: { username: 'eugeniasousa' },
    update: {}, // Não atualiza se já existir
    create: {
      name: 'Eugénia Sousa',
      username: 'eugeniasousa',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Admin criado: ${admin.username}`);
  
  // Opcional: Criar um grupo disciplinar de teste
  const group = await prisma.disciplinaryGroup.upsert({
    where: { name: 'Informática' },
    update: {},
    create: {
      name: 'Informática'
    }
  });
  console.log(`Grupo criado: ${group.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
