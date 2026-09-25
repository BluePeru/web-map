'use client';

import React, { useState } from 'react';
import { useMapStore } from '@/store/useMapStore';
import { ArrowRight, X, Building2, User, Phone, Briefcase, MessageSquare, Loader2 } from 'lucide-react';
import { trackLeadSubmission } from '@/lib/analytics';

export function B2BLeadModal() {
  const { isLeadModalOpen, closeLeadModal } = useMapStore();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [operationType, setOperationType] = useState('Flotas y Transporte');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isLeadModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !company.trim() || !contact.trim()) {
      setErrorMessage('Por favor completa todos los campos requeridos (*)');
      return;
    }

    setIsSubmitting(true);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/mapa';
      const res = await fetch(`${basePath}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          contact: contact.trim(),
          operationType,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar solicitud');
      }

      // Track conversion event in GA4
      trackLeadSubmission(company.trim(), operationType);

      // Close modal and redirect directly to WhatsApp
      closeLeadModal();
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-zinc-100 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Auditoría Territorial & API Corporativa</h2>
              <p className="text-xs text-zinc-400 font-mono">Plataforma de Inteligencia B1 Perú</p>
            </div>
          </div>
          <button
            onClick={closeLeadModal}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-zinc-500" /> Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Ing. Carlos Mendoza"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" /> Empresa / Razón Social *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ej. Transportes del Sur S.A.C."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Contacto & Operación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Contacto */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-zinc-500" /> Teléfono o Email Corporativo *
              </label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="carlos@empresa.pe o 999 888 777"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Operación */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-zinc-500" /> Tipo de Operación
              </label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="Flotas y Transporte">Flotas y Transporte de Carga</option>
                <option value="Retail y Locales">Retail y Locales Comerciales</option>
                <option value="Seguridad Patrimonial">Seguridad Patrimonial y Vigilancia</option>
                <option value="Distribución y Courier">Distribución y Courier Última Milla</option>
                <option value="Otro">Otro requerimiento corporativo</option>
              </select>
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-500" /> Rutas de interés o detalles (Opcional)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ej. Requerimos auditar rutas críticas entre Callao y Carretera Central..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={closeLeadModal}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-medium shadow-lg shadow-blue-900/30 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Solicitar Auditoría Táctica</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
