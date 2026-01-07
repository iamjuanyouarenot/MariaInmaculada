const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';

app.use(cors());
app.use(express.json());

// Middleware de autenticación
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Error en login' });
  }
});

app.post('/api/register-admin', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { username, password: hash }
    });
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --- Students Routes ---
app.get('/api/estudiantes', authenticate, async (req, res) => {
  const { grado } = req.query;
  const where = grado ? { grado } : {};

  try {
    const estudiantes = await prisma.estudiante.findMany({
      where,
      include: {
        deudas: {
          include: {
            pagos: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular estado financiero
    const data = estudiantes.map(e => {
      let totalDeuda = 0;
      let totalPagado = 0;

      e.deudas.forEach(d => {
        totalDeuda += Number(d.monto_total);
        d.pagos.forEach(p => {
          totalPagado += Number(p.monto);
        });
      });

      return {
        ...e,
        saldo_pendiente: totalDeuda - totalPagado
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/estudiantes', authenticate, async (req, res) => {
  const { nombre, telefono, apoderado, dni, edad, grado, seccionId, es_nuevo, mensualidad } = req.body;



  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear Estudiante
      // Fix: seccion_id mapping
      const estudiante = await tx.estudiante.create({
        data: {
          nombre: nombre || null,
          telefono: telefono || null,
          apoderado: apoderado || null,
          dni: dni || null,
          edad: edad ? parseInt(edad) : null,
          grado: grado || null,
          seccion_id: seccionId ? String(seccionId) : null,
          es_nuevo: !!es_nuevo,
          mensualidad: mensualidad ? Number(mensualidad) : 300.00
        }
      });

      // 2. Generar Deuda si es nuevo
      if (es_nuevo) {
        await tx.deuda.create({
          data: {
            estudianteId: estudiante.id,
            concepto: 'Inscripción',
            monto_total: 100.00
          }
        });
      }

      return estudiante;
    });

    res.json(result);
  } catch (error) {
    console.error("Error creating student FULL:", error);
    res.status(500).json({ error: 'Error al crear estudiante: ' + error.message });
  }
});

// DELETE Estudiante Endpoint
app.delete('/api/estudiantes/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {

    await prisma.$transaction(async (tx) => {
      const deudasIds = await tx.deuda.findMany({
        where: { estudianteId: Number(id) },
        select: { id: true }
      });

      const ids = deudasIds.map(d => d.id);

      // Delete Payments linked to Debts
      if (ids.length > 0) {
        await tx.pago.deleteMany({
          where: { deudaId: { in: ids } }
        });
      }

      // Delete Debts
      await tx.deuda.deleteMany({
        where: { estudianteId: Number(id) }
      });

      // Delete Student
      await tx.estudiante.delete({
        where: { id: Number(id) }
      });
    });


    res.json({ message: 'Estudiante eliminado' });
  } catch (e) {
    console.error("Error deleting student:", e);
    res.status(500).json({ error: 'Error al eliminar estudiante: ' + e.message });
  }
});

// --- Payments Routes ---
app.post('/api/pagos', authenticate, async (req, res) => {
  const { deudaId, monto } = req.body;
  try {
    const pago = await prisma.pago.create({
      data: {
        deudaId: Number(deudaId),
        monto: Number(monto)
      }
    });
    res.json(pago);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/estudiantes/:id/deudas', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const deudas = await prisma.deuda.findMany({
      where: { estudianteId: Number(id) },
      include: { pagos: true }
    });
    res.json(deudas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/estudiantes/:id/estado-cuenta', authenticate, async (req, res) => {
  const { id } = req.params;
  const YEAR = new Date().getFullYear();

  try {
    const est = await prisma.estudiante.findUnique({
      where: { id: Number(id) },
      include: { deudas: { include: { pagos: true } } }
    });

    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const MONTH_COST = Number(est.mensualidad);
    const matriculaDebt = est.deudas.find(d => d.concepto === 'Inscripción');
    const meses = [
      { nombre: 'Marzo', mes: 2 },
      { nombre: 'Abril', mes: 3 },
      { nombre: 'Mayo', mes: 4 },
      { nombre: 'Junio', mes: 5 },
      { nombre: 'Julio', mes: 6 },
      { nombre: 'Agosto', mes: 7 },
      { nombre: 'Septiembre', mes: 8 },
      { nombre: 'Octubre', mes: 9 },
      { nombre: 'Noviembre', mes: 10 },
      { nombre: 'Diciembre', mes: 11 },
    ];

    const today = new Date();

    const schedule = meses.map(m => {
      const concepto = `Pensión ${m.nombre}`;
      const existing = est.deudas.find(d => d.concepto === concepto);
      const vencimiento = new Date(YEAR, m.mes + 1, 0);

      let status = 'pendiente';
      let deudaId = existing?.id || null;
      let pagado = 0;
      let total = existing ? Number(existing.monto_total) : MONTH_COST;

      if (existing) {
        pagado = existing.pagos.reduce((acc, p) => acc + Number(p.monto), 0);
        if (pagado >= total - 0.1) status = 'pagado';
        else if (pagado > 0) status = 'parcial';
        else if (today > vencimiento) status = 'vencido';
      } else {
        if (today > vencimiento) status = 'vencido';
      }

      return {
        concepto,
        mes: m.nombre,
        vencimiento,
        monto_total: total,
        pagado,
        saldo: total - pagado,
        status,
        deudaId
      };
    });

    let matriculaStatus = 'na';
    if (matriculaDebt) {
      const pagado = matriculaDebt.pagos.reduce((acc, p) => acc + Number(p.monto), 0);
      const total = Number(matriculaDebt.monto_total);
      matriculaStatus = pagado >= total - 0.1 ? 'pagado' : 'vencido';
      schedule.unshift({
        concepto: 'Inscripción',
        mes: 'Matrícula',
        vencimiento: matriculaDebt.createdAt,
        monto_total: total,
        pagado,
        saldo: total - pagado,
        status: matriculaStatus,
        deudaId: matriculaDebt.id
      });
    }

    res.json(schedule);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/deudas/generar', authenticate, async (req, res) => {
  const { estudianteId, concepto, monto, fecha_vencimiento } = req.body;
  try {
    const deuda = await prisma.deuda.create({
      data: {
        estudianteId: Number(estudianteId),
        concepto,
        monto_total: Number(monto),
        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null
      }
    });
    res.json(deuda);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
