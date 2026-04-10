'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Store, AlertCircle } from 'lucide-react'
import { vinculoService, VinculoData } from '@/services/vinculo'
import { authService } from '@/services/auth'
import { VinculoModal } from '@/components/vinculo-modal'
import Link from 'next/link'

const statusLabels: Record<string, string> = {
  aberto: 'Novo Pedido',
  validacao_comercial: 'Aguard. Comercial',
  validacao_financeiro: 'Aguard. Financeiro',
  tarefa_ti: 'Aguard. TI',
  fechado: 'Vinculado',
}

const statusColors: Record<string, string> = {
  aberto: 'bg-blue-100 text-blue-700',
  validacao_comercial: 'bg-orange-100 text-orange-700',
  validacao_financeiro: 'bg-amber-100 text-amber-700',
  tarefa_ti: 'bg-purple-100 text-purple-700',
  fechado: 'bg-green-100 text-green-700',
}

export default function FranquiaPage() {
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<VinculoData | null>(null)
  const franquiaId = authService.getFranquiaId()

  const { data, isLoading } = useQuery({
    queryKey: ['vinculos', 'franquia', franquiaId],
    queryFn: () => vinculoService.listar(undefined, franquiaId ?? undefined),
    enabled: !!franquiaId,
  })

  const filtrados = data?.filter((v) => {
    if (!busca) return true
    const t = busca.toLowerCase()
    return (
      v.numero_pedido.toLowerCase().includes(t) ||
      v.nome_cliente.toLowerCase().includes(t)
    )
  })

  const ativos = filtrados?.filter(v => v.status !== 'aberto') ?? []
  const reprovados = filtrados?.filter(v => v.status === 'aberto') ?? []

  const TabelaVinculos = ({ vinculos, vazio }: { vinculos: VinculoData[]; vazio: string }) => (
    vinculos.length === 0 ? (
      <div className="px-5 py-8 text-center">
        <p className="text-sm text-slate-400">{vazio}</p>
      </div>
    ) : (
      <>
        <div className="max-h-[260px] overflow-y-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {vinculos.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelecionado(v)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 font-medium text-slate-800">{v.numero_pedido}</td>
                  <td className="px-5 py-3 text-slate-600">{v.nome_cliente}</td>
                  <td className="px-5 py-3 text-slate-600">
                    R$ {Number(v.valor_pedido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {v.data_pedido ? new Date(v.data_pedido + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
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
          <p className="text-xs text-slate-400">{vinculos.length} pedido(s)</p>
        </div>
      </>
    )
  )

  return (
    <div className="space-y-5">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pedido..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
          />
        </div>
        <Link
          href="/franquia/novo"
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

      {!franquiaId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-amber-700 text-sm">
          Sua conta não está vinculada a uma franquia. Contate o administrador.
        </div>
      )}

      {/* Lista de pedidos ativos */}
      {!isLoading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Store size={16} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Meus Pedidos</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">N. Pedido</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Cliente</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Valor</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Data</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
          </table>
          <TabelaVinculos vinculos={ativos} vazio="Nenhum pedido em andamento" />
        </div>
      )}

      {/* Lista de pedidos reprovados */}
      {reprovados.length > 0 && (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Pedidos Reprovados — Ação Necessária</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-red-50">
                <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">N. Pedido</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Cliente</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Valor</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Data</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
          </table>
          <div className="max-h-[260px] overflow-y-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-red-50">
                {reprovados.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelecionado(v)}
                    className="hover:bg-red-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 font-medium text-slate-800">{v.numero_pedido}</td>
                    <td className="px-5 py-3 text-slate-600">{v.nome_cliente}</td>
                    <td className="px-5 py-3 text-slate-600">
                      R$ {Number(v.valor_pedido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {v.data_pedido ? new Date(v.data_pedido + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                        Novo Pedido
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 border-t border-red-100 bg-red-50">
            <p className="text-xs text-red-500">{reprovados.length} pedido(s) aguardando revisão — clique para editar e reenviar</p>
          </div>
        </div>
      )}

      {selecionado && (
        <VinculoModal
          vinculo={selecionado}
          onClose={() => setSelecionado(null)}
          modo="franquia"
        />
      )}
    </div>
  )
}
