import React, { useState } from 'react';
import { X, DollarSign, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function PaymentModal({ student, onClose, onRefresh }) {
    const { token } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetchSchedule();
    }, [student]);

    const fetchSchedule = async () => {
        try {
            const res = await axios.get(`${API_URL}/estudiantes/${student.id}/estado-cuenta`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchedule(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (item) => {
        const amountStr = prompt(`Ingrese monto a pagar para ${item.concepto} (Saldo: S/ ${item.saldo.toFixed(2)}):`, item.saldo);
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) return alert("Monto inválido");

        try {
            let deudaId = item.deudaId;

            // Si no existe la deuda (es virtual/vencido sin registro), crearla primero
            if (!deudaId) {
                const resDeuda = await axios.post(`${API_URL}/deudas/generar`, {
                    estudianteId: student.id,
                    concepto: item.concepto,
                    monto: item.monto_total,
                    fecha_vencimiento: item.vencimiento
                }, { headers: { Authorization: `Bearer ${token}` } });
                deudaId = resDeuda.data.id;
            }

            // Registrar Pago
            await axios.post(`${API_URL}/pagos`, {
                deudaId: deudaId,
                monto: amount
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert("Pago registrado con éxito");
            fetchSchedule(); // Refresh modal
            onRefresh(); // Refresh parent dashboard
        } catch (e) {
            console.error(e);
            alert("Error al procesar el pago");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pagado': return <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle size={12} /> Pagado</span>;
            case 'vencido': return <span className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-bold"><AlertCircle size={12} /> Vencido</span>;
            case 'parcial': return <span className="flex items-center gap-1 text-orange-700 bg-orange-100 px-2 py-1 rounded-full text-xs font-bold"><Clock size={12} /> Parcial</span>;
            default: return <span className="flex items-center gap-1 text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs font-bold">Pendiente</span>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Estado de Cuenta</h3>
                        <p className="text-sm text-gray-500">{student.nombre} - {student.grado}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                    ) : (
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 border-b border-gray-200">
                                    <th className="text-left font-semibold pb-3 pl-2">Concepto</th>
                                    <th className="text-left font-semibold pb-3">Vencimiento</th>
                                    <th className="text-left font-semibold pb-3">Estado</th>
                                    <th className="text-right font-semibold pb-3 pr-2">Saldo</th>
                                    <th className="text-right font-semibold pb-3 pr-2">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {schedule.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-3 pl-2 font-medium text-gray-900">{item.concepto}</td>
                                        <td className="py-3 text-gray-500">
                                            {new Date(item.vencimiento).toLocaleDateString()}
                                        </td>
                                        <td className="py-3">{getStatusBadge(item.status)}</td>
                                        <td className="py-3 text-right pr-2 font-mono text-gray-700">
                                            {item.saldo > 0 ? `S/ ${item.saldo.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="py-3 text-right pr-2">
                                            {item.status !== 'pagado' && (
                                                <button
                                                    onClick={() => handlePay(item)}
                                                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
                                                >
                                                    Pagar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
