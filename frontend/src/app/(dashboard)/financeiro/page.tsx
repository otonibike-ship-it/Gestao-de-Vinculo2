'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, DollarSign } from 'lucide-react'
import { vinculoService, VinculoData } from '@/services/vinculo'
import { VinculoModal } from '@/components/vinculo-modal'

export default function FinanceiroPage() {
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<VinculoData | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['vinculos', 'validacao_financeiro'],
    queryFn: () => vinculoService.listar('validacao_financeiro'),
  })

  const filtrados = data?.filter((v) => {
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      v.numero_pedido.toLowerCase().includes(termo) ||
      v.nome_cliente.toLowerCase().includes(termo) ||
      v.franquia_nome.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-3">
        <p className="text-sm text-amber-700">
          Pedidos aguardando sua validacao financeira. Clique em um pedido para aprovar ou reprovar.
        </p>
      </div>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar pedido..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
        />
      </div>

      {isLoading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-sm text-slate-400">
          Carregando...
        </div>
      )}

      {filtrados && filtrados.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <DollarSign size={24} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum pedido pendente de validacao</p>
        </div>
      )}

      {filtrados && filtrados.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">N. Pedido</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Franquia</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Cliente</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Valor</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Data</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Anexos</th>
              </tr>
            </thead>
          </table>
          <div className="max-h-[230px] overflow-y-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {filtrados.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelecionado(v)}
                    className="hover:bg-amber-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 font-medium text-slate-800">{v.numero_pedido}</td>
                    <td className="px-5 py-3 text-slate-600">{v.franquia_nome}</td>
                    <td className="px-5 py-3 text-slate-600">{v.nome_cliente}</td>
                    <td className="px-5 py-3 text-slate-600">
                      R$ {Number(v.valor_pedido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {v.data_pedido ? new Date(v.data_pedido + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {v.anexos?.length || 0} arquivo(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">{filtrados.length} pedido(s) pendente(s)</p>
          </div>
        </div>
      )}

      {selecionado && (
        <VinculoModal
          vinculo={selecionado}
          onClose={() => setSelecionado(null)}
          modo="financeiro"
        />
      )}
    </div>
  )
}
