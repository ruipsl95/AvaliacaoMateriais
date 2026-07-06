const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const courseMap = {
  'INF': 'Informática de Gestão',
  'IG': 'Informática de Gestão',
  'VM': 'Vendas e Marketing',
  'TUR': 'Turismo',
  'T': 'Turismo',
  'MEC.AERO': 'Mecânico de Aeronaves',
  'AERO': 'Mecânico de Aeronaves',
  'MEC.AUTO': 'Mecânica Automóvel',
  'AUT': 'Mecânica Automóvel',
  'MEC': 'Mecânica',
  'REST/BAR': 'Restaurante/Bar',
  'RB': 'Restaurante/Bar',
  'CP': 'Cozinha/Pastelaria',
  'COPA': 'Cozinha/Pastelaria',
  'COZ': 'Cozinha/Pastelaria',
  'AS': 'Auxiliar de Saúde',
  'DESP': 'Desporto',
  'DES': 'Desporto',
  'CEF': 'Curso de Educação e Formação'
};

function parseClassCode(code) {
  // Ex: Inf1, VM1, Mec.Aero1, Rest/Bar1, CEF
  const match = code.match(/^([a-zA-Z\.\/]+)(\d*)$/i);
  if (!match) return { courseAbbr: code, year: null, fullName: code };
  
  const abbr = match[1].toUpperCase();
  const year = match[2] ? parseInt(match[2]) : null;
  const fullName = courseMap[abbr] || abbr;
  
  return { courseAbbr: abbr, year, fullName };
}

const dataRaw = [
  // Economia
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'Economia', codes: ['Inf1','Inf2','Inf3','VM1','VM2','Coz2'], teachers: ['paulomaia', 'raquelvasconcelos'] },
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'Economia', codes: ['Coz3'], teachers: ['raquelvasconcelos'] },
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'Comércio e Serviços', codes: ['VM1'], teachers: ['danielaseco'] },
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'Comércio e Serviços', codes: ['VM2','VM3'], teachers: ['raquelvasconcelos'] },
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'Marketing', codes: ['VM1'], teachers: ['sandracardoso', 'nicolegama'] },
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'Marketing', codes: ['VM2'], teachers: ['sandracardoso', 'nicolegama', 'danielaseco'] },
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'Marketing', codes: ['VM3'], teachers: ['sandracardoso', 'fatimaferreira'] },
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'Vendas', codes: ['VM1'], teachers: ['danielaseco'] },
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'Vendas', codes: ['VM2'], teachers: ['sandracardoso', 'nicolegama', 'danielaseco'] },
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'Vendas', codes: ['VM3'], teachers: ['sandracardoso', 'danielaseco'] },
  { group: 'Economia, OEAG, Área técnica de VM', subject: 'OEAG', codes: ['Inf1','Inf2','Inf3'], teachers: ['paulomaia'] },

  // LP / AISE / SI / TIC
  { group: 'Informática', subject: 'LP', codes: ['Inf1','Inf3'], teachers: ['ruibabo'] },
  { group: 'Informática', subject: 'LP', codes: ['Inf2'], teachers: ['cristianosa'] },
  { group: 'Informática', subject: 'AISE', codes: ['Inf1'], teachers: ['monicasimoes'] },
  { group: 'Informática', subject: 'AISE', codes: ['Inf2'], teachers: ['ruibabo'] },
  { group: 'Informática', subject: 'SI', codes: ['Inf2','Inf3'], teachers: ['monicasimoes'] },
  { group: 'Informática', subject: 'TIC', codes: ['Inf1','VM1','AS1','Mec.Aero1','TUR1'], teachers: ['monicasimoes'] },
  { group: 'Informática', subject: 'TIC', codes: ['Rest/Bar1','Copa1','Mec1','Mec.Auto1','Desp.1'], teachers: ['ruibabo'] },

  // Línguas
  { group: 'Línguas', subject: 'Inglês', codes: ['AS1','AS3','COZ1','COZ3','DESP2','MEC2','MEC3','T2','T3','INF1','RB1'], teachers: ['lilianarelva'] },
  { group: 'Línguas', subject: 'Inglês', codes: ['AS2','COZ2','DESP1','MEC1','T1','INF2','AUT1','AERO1'], teachers: ['patriciamartins'] },
  { group: 'Línguas', subject: 'Inglês', codes: ['INF3','CEF'], teachers: ['fatimaferreira'] },
  { group: 'Línguas', subject: 'Língua Técnica', codes: ['RB1'], teachers: ['patriciamartins'] },
  { group: 'Línguas', subject: 'SCBM', codes: ['CEF'], teachers: ['patriciamartins'] },

  // Educação Física
  { group: 'Educação Física / Área de Movimento', subject: 'Educação Física (EF)', codes: ['AS1','AS2','CP2','IG1','MEC2','MEC.AERO1','TUR1','VM2'], teachers: ['rubenjoellopes'] },
  { group: 'Educação Física / Área de Movimento', subject: 'Educação Física (EF)', codes: ['CP1','RB1','VM1'], teachers: ['brunosilva'] },
  { group: 'Educação Física / Área de Movimento', subject: 'Educação Física (EF)', codes: ['IG2','TUR2'], teachers: ['marcoandrearaujo'] },
  { group: 'Educação Física / Área de Movimento', subject: 'Educação Física (EF)', codes: ['MEC1'], teachers: ['andreiacibrao'] },
  { group: 'Educação Física / Área de Movimento', subject: 'EMOV', codes: ['DES2'], teachers: ['andreiacibrao'] },
  { group: 'Educação Física / Área de Movimento', subject: 'MDD', codes: ['DES2'], teachers: ['rubenjoellopes'] },
  { group: 'Educação Física / Área de Movimento', subject: 'AGSBE', codes: ['DES1','DES2'], teachers: ['andreiacibrao'] },
  { group: 'Educação Física / Área de Movimento', subject: 'DCI', codes: ['DES1'], teachers: ['brunosilva'] },

  // Área Técnica
  { group: 'Biologia e Disciplinas da Área Técnica', subject: 'Biologia', codes: ['AS1'], teachers: [] },
  { group: 'Biologia e Disciplinas da Área Técnica', subject: 'Saúde', codes: ['AS1'], teachers: [] },
  { group: 'Disciplinas Técnicas', subject: 'TIAT', codes: ['T1'], teachers: [] },
  { group: 'Disciplinas Técnicas', subject: 'OTET', codes: ['T1'], teachers: [] },
  { group: 'Disciplinas Técnicas', subject: 'TCAT', codes: ['T1'], teachers: [] }
];

async function main() {
  console.log('A processar mapeamento e inserir na base de dados...\n');

  for (const item of dataRaw) {
    // 1. Garantir Grupo Disciplinar
    let group = await prisma.disciplinaryGroup.findFirst({ where: { name: item.group } });
    if (!group) {
      group = await prisma.disciplinaryGroup.create({ data: { name: item.group } });
      console.log(`Criado Grupo: ${group.name}`);
    }

    // Processar cada turma/código
    for (const code of item.codes) {
      const parsed = parseClassCode(code.replace('.', '')); // Limpar pontos se houver ex: Desp.1 -> Desp1
      
      // 2. Garantir Curso
      let course = await prisma.course.findFirst({ where: { name: parsed.fullName } });
      if (!course) {
        course = await prisma.course.create({ data: { name: parsed.fullName } });
        console.log(`Criado Curso: ${course.name}`);
      }

      // 3. Obter IDs dos Professores baseados no username
      const teacherUsers = await prisma.user.findMany({
        where: { username: { in: item.teachers } }
      });

      // 4. Garantir Disciplina ligada ao Curso e Grupo
      let subject = await prisma.subject.findFirst({
        where: { 
          name: item.subject,
          courseId: course.id,
          year: parsed.year
        },
        include: { teachers: true }
      });

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            name: item.subject,
            year: parsed.year,
            courseId: course.id,
            disciplinaryGroupId: group.id,
            teachers: {
              connect: teacherUsers.map(t => ({ id: t.id }))
            }
          }
        });
        console.log(`Criada Disciplina: ${subject.name} (${parsed.fullName} ${parsed.year || ''})`);
      } else {
        // Atualizar professores se a disciplina já existir
        await prisma.subject.update({
          where: { id: subject.id },
          data: {
            disciplinaryGroupId: group.id,
            teachers: {
              connect: teacherUsers.map(t => ({ id: t.id }))
            }
          }
        });
      }
    }
  }

  console.log('\nTodas as disciplinas, cursos e relações inseridas com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
