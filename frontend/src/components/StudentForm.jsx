import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const GRADOS_OPTIONS = [
    "3 años", "4 años", "5 años",
    "1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado",
    "1er Año", "2do Año", "3er Año", "4to Año", "5to Año"
];

export default function StudentForm({ onSuccess }) {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        apoderado: '',
        dni: '',
        edad: '',
        grado: '',
        es_nuevo: false,
        mensualidad: 300 // Default value
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/estudiantes`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Estudiante registrado exitosamente!');
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Error al registrar estudiante');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                <input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Nombres y Apellidos"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">DNI <span className="text-gray-400 font-normal">(Opcional)</span></label>
                <input
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Documento de Identidad"
                />
            </div>

            <div className="col-span-1 flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sección (Opcional)</label>
                    <input name="seccion" value={formData.seccion || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Ej: A" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Monto Mensualidad (S/)</label>
                    <input
                        type="number"
                        name="mensualidad"
                        value={formData.mensualidad}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="300"
                    />
                </div>
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Grado</label>
                <select
                    name="grado"
                    value={formData.grado}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                    required
                >
                    <option value="">Seleccione grado...</option>
                    {GRADOS_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Edad</label>
                <input
                    name="edad"
                    type="number"
                    value={formData.edad}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Edad del alumno"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                <input
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Celular de apoderado"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Apoderado</label>
                <input
                    name="apoderado"
                    value={formData.apoderado || ''}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Nombre del Apoderado"
                />
            </div>

            <div className="col-span-2 mt-4">
                <div
                    className={`flex items-start p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.es_nuevo ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}
                    onClick={() => setFormData(prev => ({ ...prev, es_nuevo: !prev.es_nuevo }))}
                >
                    <div className="flex items-center h-5">
                        <input
                            id="es_nuevo"
                            name="es_nuevo"
                            type="checkbox"
                            checked={formData.es_nuevo}
                            onChange={handleChange}
                            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="es_nuevo" className="font-bold text-gray-900 cursor-pointer">
                            ¿Nuevo Ingreso?
                        </label>
                        <p className="text-gray-500">
                            Si se marca, el sistema generará automáticamente una <strong>Deuda de Inscripción (S/ 100.00)</strong> asociada al estudiante.
                        </p>
                    </div>
                </div>
            </div>

            <div className="col-span-2 pt-6">
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/40 text-sm tracking-wide">
                    Guardar Estudiante
                </button>
            </div>
        </form>
    );
}
