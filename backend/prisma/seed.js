const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // 1. Create Admin User
    const password = await bcrypt.hash('Anani123', 10); // Password: Anani123
    const admin = await prisma.user.upsert({
        where: { username: 'Anani' },
        update: {},
        create: {
            username: 'Anani',
            password: password,
        },
    });
    console.log('Created admin user:', admin.username);

    // 2. Create Students (Mock Data)
    const studentsData = [
        { nombre: 'Mateo Alva', grado: '3 años', es_nuevo: true },
        { nombre: 'Luciana Rios', grado: '4 años', es_nuevo: false },
        { nombre: 'Sofia Torres', grado: '1er Grado', es_nuevo: true },
        { nombre: 'Matias Vega', grado: '5to Grado', es_nuevo: false },
    ];

    for (const s of studentsData) {
        const student = await prisma.estudiante.create({
            data: {
                nombre: s.nombre,
                grado: s.grado,
                es_nuevo: s.es_nuevo,
                // If they are new, we might want to ensure logic consistency, 
                // but here we are bypassing the API logic, so we must manually add the debt if needed
                // or just let them be without debt for testing the "add student" flow manually later.
                // Let's add debt only for the 'true' ones to simulate.
                deudas: s.es_nuevo ? {
                    create: {
                        concepto: 'Inscripción',
                        monto_total: 100.00
                    }
                } : undefined
            }
        });
        console.log(`Created student with id: ${student.id}`);
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
