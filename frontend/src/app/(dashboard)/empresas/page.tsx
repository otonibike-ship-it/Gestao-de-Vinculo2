'use client'

import { useQuery } from '@tanstack/react-query'
import { Building2, Search } from 'lucide-react'
import api from '@/lib/api'
import { useState } from 'react'

export default function EmpresasPage() {
  const [busca, setBusca] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const res = await api.get('/empresas/')
      return res.data
    },
  })

  const filtrados = data?.filter((e: any) => {
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      e.razao_social?.toLowerCase().includes(termo) ||
      e.nome_fantasia?.toLowerCase().includes(termo) ||
      e.cnpj?.includes(termo)
    )
  })

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar empresa..."
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
          <Building2 size={24} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhuma empresa encontrada</p>
        </div>
      )}

      {filtrados && filtrados.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Razão Social</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">CNPJ</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Nome Fantasia</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">E-mail</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.map((e: any) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-xs font-semibold text-amber-600 shrink-0">
                        {e.razao_social?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-slate-800">{e.razao_social}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{e.cnpj}</td>
                  <td className="px-5 py-3 text-slate-600">{e.nome_fantasia || '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{e.email || '—'}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {e.criado_em ? new Date(e.criado_em).toLocaleDateString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">{filtrados.length} registro(s)</p>
          </div>
        </div>
      )}
    </div>
  )
}
