const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('A preparar para inserir professores e delegados...');

  // A password será igual para todos
  const defaultPassword = bcrypt.hashSync('professor123', 8);

  // Lista extraída do PDF
  const delegados = [
    { name: 'Raquel Vasconcelos', username: 'raquelvasconcelos' },
    { name: 'Rui Babo', username: 'ruibabo' },
    { name: 'Patrícia Martins', username: 'patriciamartins' },
    { name: 'Bruno Silva', username: 'brunosilva' },
    { name: 'Augusto Nogueira', username: 'augustonogueira' },
    { name: 'Sara Barbosa', username: 'sarabarbosa' }
  ];

  // Professores que não são delegados
  const professores = [
    { name: 'Paulo Maia', username: 'paulomaia' },
    { name: 'Daniela Seco', username: 'danielaseco' },
    { name: 'Sandra Cardoso', username: 'sandracardoso' },
    { name: 'Nicole Gama', username: 'nicolegama' },
    { name: 'Fátima Ferreira', username: 'fatimaferreira' },
    { name: 'Cristiano Sá', username: 'cristianosa' },
    { name: 'Mónica Simões', username: 'monicasimoes' },
    { name: 'Liliana Relva', username: 'lilianarelva' },
    { name: 'Ruben Joel Lopes', username: 'rubenjoellopes' },
    { name: 'Andreia Cibrão', username: 'andreiacibrao' },
    { name: 'Marco André Araujo', username: 'marcoandrearaujo' }
  ];

  // 1. Inserir Delegados (Role: EVALUATOR)
  console.log('\n--- A INSERIR DELEGADOS ---');
  for (const del of delegados) {
    const user = await prisma.user.upsert({
      where: { username: del.username },
      update: {},
      create: {
        name: del.name,
        username: del.username,
        password: defaultPassword,
        role: 'EVALUATOR',
      },
    });
    console.log(`✅ Delegado adicionado: ${user.name} (@${user.username})`);
  }

  // 2. Inserir Professores (Role: TEACHER)
  console.log('\n--- A INSERIR PROFESSORES ---');
  for (const prof of professores) {
    const user = await prisma.user.upsert({
      where: { username: prof.username },
      update: {},
      create: {
        name: prof.name,
        username: prof.username,
        password: defaultPassword,
        role: 'TEACHER',
      },
    });
    console.log(`✅ Professor adicionado: ${user.name} (@${user.username})`);
  }

  console.log('\nTodos os utilizadores foram inseridos com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao inserir dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
