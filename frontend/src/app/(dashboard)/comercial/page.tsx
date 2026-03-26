'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, ShoppingCart } from 'lucide-react'
import { vinculoService, VinculoData } from '@/services/vinculo'
import { VinculoModal } from '@/components/vinculo-modal'
import Link from 'next/link'

const statusLabels: Record<string, string> = {
  aberto: 'Aberto',
  validacao_financeiro: 'Valid. Financeiro',
  tarefa_ti: 'Tarefa TI',
  fechado: 'Fechado',
}

const statusColors: Record<string, string> = {
  aberto: 'bg-blue-100 text-blue-700',
  validacao_financeiro: 'bg-amber-100 text-amber-700',
  tarefa_ti: 'bg-purple-100 text-purple-700',
  fechado: 'bg-green-100 text-green-700',
}

export default function ComercialPage() {
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<VinculoData | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['vinculos'],
    queryFn: () => vinculoService.listar(),
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
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pedido, cliente, franquia..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
          />
        </div>
        <Link
          href="/comercial/novo"
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo Pedido
        </Link>
      </div>

      {isLoading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-sm text-slate-400">
          Carregando...
        </div>
      )}

      {filtrados && filtrados.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <ShoppingCart size={24} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum pedido encontrado</p>
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
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Valid.</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
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
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
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
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${v.necessario_validacao ? 'text-amber-600' : 'text-slate-400'}`}>
                        {v.necessario_validacao ? 'Sim' : 'Nao'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[v.status] || 'bg-slate-100 text-slate-600'}`}>
                        {statusLabels[v.status] || v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">{filtrados.length} registro(s)</p>
          </div>
        </div>
      )}

      {/* Justificativa visivel na tabela quando status=aberto e tem justificativa */}
      {filtrados && filtrados.some(v => v.justificativa_reprovacao) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Pedidos com Justificativa de Reprovacao</p>
          <div className="space-y-2">
            {filtrados.filter(v => v.justificativa_reprovacao).map(v => (
              <div key={v.id} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <span className="text-xs font-medium text-red-600 shrink-0">{v.numero_pedido}</span>
                <p className="text-sm text-red-700">{v.justificativa_reprovacao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selecionado && (
        <VinculoModal
          vinculo={selecionado}
          onClose={() => setSelecionado(null)}
          modo="comercial"
        />
      )}
    </div>
  )
}
