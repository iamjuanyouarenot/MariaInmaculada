import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LogOut, UserPlus, Search, ChevronRight, DollarSign, FileText, Trash2 } from 'lucide-react';
import StudentForm from '../components/StudentForm';
import PaymentModal from '../components/PaymentModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const GRADOS = {
    "Inicial": ["3 años", "4 años", "5 años"],
    "Primaria": ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
    "Secundaria": ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"] // Assuming structure to match typical PE system or as requested
};

export default function Dashboard() {
    const { logout, token } = useAuth();
    const [selectedGrado, setSelectedGrado] = useState(null);
    const [students, setStudents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        fetchStudents();
    }, [selectedGrado, refresh]);

    const fetchStudents = async () => {
        try {
            const url = selectedGrado
                ? `${API_URL}/estudiantes?grado=${selectedGrado}`
                : `${API_URL}/estudiantes`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreated = () => {
        setShowForm(false);
        setRefresh(p => p + 1);
    };

    const handlePayment = async (studentId, deudaId) => {
        // ... (kept for reference if needed, though we use modal now. We can leave it or remove it. Context implies it's unused but safe to keep)
    };

    const handleDelete = async (id, nombre) => {
        if (!confirm(`¿Estás seguro de ELIMINAR a ${nombre}?\n\nEsta acción borrará todo su historial de deudas y pagos permanentemente.`)) return;

        try {
            await axios.delete(`${API_URL}/estudiantes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Estudiante eliminado");
            fetchStudents(); // Refresh list
        } catch (e) {
            alert("Error al eliminar");
            console.error(e);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-indigo-900 text-white flex flex-col shadow-2xl z-20">
                <div className="p-8 border-b border-indigo-800/50 bg-indigo-950/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-900 font-bold text-xl shadow-lg">M</div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Maria Inmaculada</h1>
                            <p className="text-indigo-300 text-xs font-medium uppercase tracking-wider">Gestión Escolar</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <button
                        onClick={() => setSelectedGrado(null)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${!selectedGrado ? 'bg-white/10 text-white font-semibold shadow-inner' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${!selectedGrado ? 'bg-green-400' : 'bg-transparent'}`}></div>
                        Todos los Alumnos
                    </button>

                    <div className="mt-8 mb-2 px-4 text-xs text-indigo-400 uppercase tracking-widest font-bold">Nivel Inicial</div>
                    {GRADOS["Inicial"].map(g => (
                        <button key={g} onClick={() => setSelectedGrado(g)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${selectedGrado === g ? 'bg-white/10 text-white font-semibold' : 'text-indigo-300 hover:text-white hover:bg-white/5'}`}>
                            <span className="opacity-50">•</span> {g}
                        </button>
                    ))}

                    <div className="mt-8 mb-2 px-4 text-xs text-indigo-400 uppercase tracking-widest font-bold">Nivel Primaria</div>
                    {GRADOS["Primaria"].map(g => (
                        <button key={g} onClick={() => setSelectedGrado(g)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${selectedGrado === g ? 'bg-white/10 text-white font-semibold' : 'text-indigo-300 hover:text-white hover:bg-white/5'}`}>
                            <span className="opacity-50">•</span> {g}
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-indigo-800/50 bg-indigo-950/30">
                    <button onClick={logout} className="flex items-center gap-3 text-indigo-300 hover:text-white w-full transition-colors font-medium text-sm p-2 rounded-lg hover:bg-white/5">
                        <LogOut size={18} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 relative">
                <div className="absolute top-0 left-0 w-full h-64 bg-indigo-900/5 -z-10"></div> {/* Subtle top background */}

                <header className="px-8 py-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                            {selectedGrado || 'Listado General'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Gestiona los estudiantes y sus estados de cuenta.</p>
                    </div>

                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 font-semibold text-sm active:scale-95"
                    >
                        <UserPlus size={18} /> Nuevo Estudiante
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pb-8">
                    {showForm && (
                        <div className="mb-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-fade-in ring-1 ring-gray-900/5">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Registrar Nuevo Alumno</h3>
                                    <p className="text-sm text-gray-500">Complete la información solicitada.</p>
                                </div>
                                <button onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
                            </div>
                            <StudentForm onSuccess={handleCreated} />
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Estudiante</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Grado</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Estado Financiero</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Acciones Rápidas</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {students.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                    {s.nombre ? s.nombre.charAt(0) : '?'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{s.nombre || "Sin Nombre"}</div>
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        {s.apoderado && <span className="block text-indigo-600">Apoderado: {s.apoderado}</span>}
                                                        DNI: {s.dni || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                {s.grado || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-700">{s.telefono}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col items-start gap-1">
                                                {s.saldo_pendiente > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                        Deuda: S/ {s.saldo_pendiente.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                        Al día
                                                    </span>
                                                )}

                                                {s.deudas.length > 0 && s.saldo_pendiente > 0 && (
                                                    <span className="text-[10px] text-gray-400 ml-1 font-medium tracking-wide uppercase">Total Cargos: S/ {s.deudas.reduce((acc, d) => acc + Number(d.monto_total), 0).toFixed(2)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleGenerateMatricula(s)}
                                                    className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                                                    title="Generar Matrícula (S/ 305.00)"
                                                >
                                                    <DollarSign size={14} /> Matrícula
                                                </button>
                                                <button
                                                    onClick={() => setSelectedStudentForPayment(s)}
                                                    className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                                                    title="Ver Estado de Cuenta"
                                                >
                                                    <FileText size={14} /> Ver Cuenta
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.id, s.nombre)}
                                                    className="inline-flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                                                    title="Eliminar Estudiante"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Search size={48} className="mb-4 text-gray-200" />
                                                <p className="text-lg font-medium text-gray-500">No hay estudiantes registrados.</p>
                                                <p className="text-sm">Selecciona otro grado o agrega un nuevo alumno.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {selectedStudentForPayment && (
                <PaymentModal
                    student={selectedStudentForPayment}
                    onClose={() => setSelectedStudentForPayment(null)}
                    onRefresh={() => setRefresh(p => p + 1)}
                />
            )}
        </div>
    );
}
