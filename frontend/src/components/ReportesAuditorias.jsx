import { useState } from 'react';

export default function ReportesAuditorias({ mostrarNotificacion }) {
  const [pestaña, setPestaña] = useState('corte');

  const simularCorte = () => {
    mostrarNotificacion('Cálculo realizado. Turno cerrado con balance de $145,580.00.');
  };

  return (
    <div className="p-8 w-full min-h-screen font-sans">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reportes y Auditorías</h1>
        
        {/* Selector de Pestañas */}
        <div className="flex gap-4 mt-4 border-b border-gray-200 pb-2">
          <button 
            onClick={() => setPestaña('corte')}
            className={`font-semibold pb-2 ${pestaña === 'corte' ? 'text-[#4169E1] border-b-2 border-[#4169E1]' : 'text-gray-500'}`}
          >
            Cierre de Turno
          </button>
          <button 
            onClick={() => setPestaña('insights')}
            className={`font-semibold pb-2 ${pestaña === 'insights' ? 'text-[#4169E1] border-b-2 border-[#4169E1]' : 'text-gray-500'}`}
          >
            IA Insights (Gemini)
          </button>
        </div>
      </div>

      {pestaña === 'corte' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium uppercase mb-2">Ventas Totales</p>
            <p className="text-4xl font-bold text-gray-900 mb-6">$142,580.00</p>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">💵 Efectivo</span>
                <span className="font-semibold">$45,200.00</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">💳 Tarjeta Crédito/Débito</span>
                <span className="font-semibold">$82,350.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🏦 Transferencia</span>
                <span className="font-semibold">$15,030.00</span>
              </div>
            </div>
            
            <div className="mt-8 bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-red-500 text-sm font-bold uppercase">Diferencia Detectada</p>
              <p className="text-2xl font-bold text-red-600">-$120.00</p>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col">
            <h3 className="text-xl font-bold text-[#4169E1] mb-6">Resumen Financiero</h3>
            <div className="space-y-4 flex-1 text-lg">
              <div className="flex justify-between"><span>Fondo Inicial:</span> <span>$5,000.00</span></div>
              <div className="flex justify-between"><span>Ventas Netas:</span> <span>$142,580.00</span></div>
              <div className="flex justify-between text-red-500"><span>Retiros de Efectivo:</span> <span>-$2,000.00</span></div>
              <div className="flex justify-between font-bold text-2xl mt-4 pt-4 border-t border-indigo-200 text-[#4169E1]">
                <span>Balance de Caja:</span> <span>$145,580.00</span>
              </div>
            </div>
            <button onClick={simularCorte} className="w-full mt-6 bg-[#4169E1] text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-800 transition-colors">
              Realizar Corte Ahora
            </button>
          </div>
        </div>
      )}

      {pestaña === 'insights' && (
        <div className="space-y-6">
          <div className="bg-[#1a237e] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-300 text-xs font-bold tracking-widest uppercase mb-2">✨ Sugerencia de Gemini API</p>
              <h2 className="text-3xl font-bold mb-4">Incrementar stock de "Café Arabica" un 15% antes del próximo fin de semana.</h2>
              <p className="text-indigo-100 max-w-2xl mb-6">
                Nuestra IA detectó un patrón de consumo ascendente vinculado a eventos locales. Evita una pérdida estimada de $45,000 en ventas no realizadas.
              </p>
              <button onClick={() => mostrarNotificacion('Pedido generado y enviado a proveedor.')} className="bg-white text-[#1a237e] font-bold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                Aprobar Pedido
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-2">
              <h3 className="font-bold text-gray-900 mb-4">Tendencias de Ventas</h3>
              <div className="h-40 bg-gray-50 rounded flex items-end justify-between p-4">
                {/* Barras simuladas de gráfica */}
                <div className="w-8 bg-blue-200 rounded-t h-1/2"></div>
                <div className="w-8 bg-[#4169E1] rounded-t h-full"></div>
                <div className="w-8 bg-blue-200 rounded-t h-3/4"></div>
                <div className="w-8 bg-blue-200 rounded-t h-1/3"></div>
                <div className="w-8 bg-blue-200 rounded-t h-2/3"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center flex-col">
              <h3 className="font-bold text-gray-900 mb-4 text-center">Salud del Inventario</h3>
              <div className="w-32 h-32 rounded-full border-8 border-[#4169E1] flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">85%</span>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">Excelente</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
