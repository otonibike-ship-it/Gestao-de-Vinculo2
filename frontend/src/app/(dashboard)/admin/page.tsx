'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Trash2, Pencil, X, Users, ShoppingCart } from 'lucide-react'
import { usuarioService, UsuarioData } from '@/services/usuarios'
import { vinculoService, VinculoData } from '@/services/vinculo'
import { VinculoModal } from '@/components/vinculo-modal'
import api from '@/lib/api'

const perfilLabels: Record<string, string> = {
  comercial: 'Comercial',
  financeiro: 'Financeiro',
  ti: 'TI',
  admin: 'Admin',
  franquia: 'Franquia',
}

const perfilColors: Record<string, string> = {
  comercial: 'bg-blue-100 text-blue-700',
  financeiro: 'bg-amber-100 text-amber-700',
  ti: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
  franquia: 'bg-green-100 text-green-700',
}

const statusLabels: Record<string, string> = {
  aberto: 'Reprovado',
  validacao_comercial: 'Aguard. Comercial',
  validacao_financeiro: 'Aguard. Financeiro',
  tarefa_ti: 'Aguard. TI',
  fechado: 'Vinculado',
}

const statusColors: Record<string, string> = {
  aberto: 'bg-red-100 text-red-700',
  validacao_comercial: 'bg-orange-100 text-orange-700',
  validacao_financeiro: 'bg-amber-100 text-amber-700',
  tarefa_ti: 'bg-purple-100 text-purple-700',
  fechado: 'bg-green-100 text-green-700',
}

export default function AdminPage() {
  const queryClient = useQueryClient()

  // ── Usuarios ──
  const [buscaUser, setBuscaUser] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<UsuarioData | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formSenha, setFormSenha] = useState('')
  const [formPerfil, setFormPerfil] = useState('comercial')
  const [formFranquiaId, setFormFranquiaId] = useState<number | null>(null)
  const [erroUser, setErroUser] = useState('')

  // ── Vinculos ──
  const [buscaVinc, setBuscaVinc] = useState('')
  const [selecionado, setSelecionado] = useState<VinculoData | null>(null)

  const { data: usuarios, isLoading: loadingUsers } = useQuery({
    queryKey: ['usuarios'],
    queryFn: usuarioService.listar,
  })

  const { data: vinculos, isLoading: loadingVinc } = useQuery({
    queryKey: ['vinculos'],
    queryFn: () => vinculoService.listar(),
  })

  const { data: empresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const res = await api.get('/empresas')
      return res.data as { id: number; razao_social: string; nome_fantasia: string | null }[]
    },
  })

  const criarMutation = useMutation({
    mutationFn: usuarioService.criar,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); resetForm() },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail
      const status = e?.response?.status
      const msg = detail || (status ? `Erro ${status}: ${e.message}` : `Erro de rede: ${e.message}`)
      setErroUser(msg)
    },
  })

  const atualizarMutation = useMutation({
    mutationFn: ({ id, ...payload }: any) => usuarioService.atualizar(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); resetForm() },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail
      const status = e?.response?.status
      const msg = detail || (status ? `Erro ${status}: ${e.message}` : `Erro de rede: ${e.message}`)
      setErroUser(msg)
    },
  })

  const deletarUserMutation = useMutation({
    mutationFn: usuarioService.deletar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  const deletarVincMutation = useMutation({
    mutationFn: vinculoService.deletar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vinculos'] }),
  })

  const resetForm = () => {
    setShowForm(false)
    setEditUser(null)
    setFormNome('')
    setFormEmail('')
    setFormSenha('')
    setFormPerfil('comercial')
    setFormFranquiaId(null)
    setErroUser('')
  }

  const openEdit = (u: UsuarioData) => {
    setEditUser(u)
    setFormNome(u.nome)
    setFormEmail(u.email)
    setFormSenha('')
    setFormPerfil(u.perfil)
    setFormFranquiaId(u.franquia_id ?? null)
    setShowForm(true)
    setErroUser('')
  }

  const handleSubmitUser = () => {
    setErroUser('')
    if (!formNome.trim() || !formEmail.trim()) {
      setErroUser('Nome e email sao obrigatorios')
      return
    }
    if (formPerfil === 'franquia' && !formFranquiaId) {
      setErroUser('Selecione a franquia para este usuario')
      return
    }
    if (editUser) {
      const payload: any = { id: editUser.id, nome: formNome, email: formEmail, perfil: formPerfil, franquia_id: formPerfil === 'franquia' ? formFranquiaId : null }
      if (formSenha) payload.senha = formSenha
      atualizarMutation.mutate(payload)
    } else {
      if (!formSenha) { setErroUser('Senha e obrigatoria'); return }
      criarMutation.mutate({ nome: formNome, email: formEmail, senha: formSenha, perfil: formPerfil, franquia_id: formPerfil === 'franquia' ? formFranquiaId : null })
    }
  }

  const filteredUsers = usuarios?.filter(u => {
    if (!buscaUser) return true
    const t = buscaUser.toLowerCase()
    return u.nome.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)
  })

  const filteredVinc = vinculos?.filter(v => {
    if (!buscaVinc) return true
    const t = buscaVinc.toLowerCase()
    return v.numero_pedido.toLowerCase().includes(t) || v.nome_cliente.toLowerCase().includes(t) || v.franquia_nome.toLowerCase().includes(t)
  })

  return (
    <div className="space-y-6">
      {/* ════════════════ USUARIOS ════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">Usuarios</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={buscaUser}
                onChange={(e) => setBuscaUser(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 w-48"
              />
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Novo
            </button>
          </div>
        </div>

        {/* Form criar/editar */}
        {showForm && (
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-600">{editUser ? 'Editar Usuario' : 'Novo Usuario'}</p>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <input
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
              <input
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="Email"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
              <input
                type="password"
                value={formSenha}
                onChange={(e) => setFormSenha(e.target.value)}
                placeholder={editUser ? 'Nova senha (opcional)' : 'Senha'}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
              <div className="flex gap-2">
                <select
                  value={formPerfil}
                  onChange={(e) => { setFormPerfil(e.target.value); setFormFranquiaId(null) }}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="comercial">Comercial</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="ti">TI</option>
                  <option value="admin">Admin</option>
                  <option value="franquia">Franquia</option>
                </select>
                <button
                  onClick={handleSubmitUser}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-4 rounded-lg transition-colors"
                >
                  {editUser ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
            {formPerfil === 'franquia' && (
              <div className="mt-3">
                <select
                  value={formFranquiaId ?? ''}
                  onChange={(e) => setFormFranquiaId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="">Selecione a franquia...</option>
                  {empresas?.map(e => (
                    <option key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</option>
                  ))}
                </select>
              </div>
            )}
            {erroUser && <p className="text-red-500 text-xs mt-2">{erroUser}</p>}
          </div>
        )}

        {/* Tabela usuarios */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Nome</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Email</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Perfil</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Franquia</th>
              <th className="text-right px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-24">Acoes</th>
            </tr>
          </thead>
        </table>
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {loadingUsers && (
                <tr><td colSpan={5} className="px-5 py-6 text-center text-xs text-slate-400">Carregando...</td></tr>
              )}
              {filteredUsers?.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-slate-800">{u.nome}</td>
                  <td className="px-5 py-2.5 text-slate-600">{u.email}</td>
                  <td className="px-5 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${perfilColors[u.perfil] || 'bg-slate-100 text-slate-600'}`}>
                      {perfilLabels[u.perfil] || u.perfil}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-slate-500 text-xs">
                    {u.franquia_id
                      ? (empresas?.find(e => e.id === u.franquia_id)?.nome_fantasia || empresas?.find(e => e.id === u.franquia_id)?.razao_social || `#${u.franquia_id}`)
                      : '—'}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Deletar usuario "${u.nome}"?`)) deletarUserMutation.mutate(u.id) }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers && filteredUsers.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-6 text-center text-xs text-slate-400">Nenhum usuario encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">{filteredUsers?.length || 0} usuario(s)</p>
        </div>
      </div>

      {/* ════════════════ VINCULOS ════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">Vinculos</h3>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar pedido..."
              value={buscaVinc}
              onChange={(e) => setBuscaVinc(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 w-48"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">N. Pedido</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Franquia</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Valor</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider w-20">Acoes</th>
            </tr>
          </thead>
        </table>
        <div className="max-h-[230px] overflow-y-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {loadingVinc && (
                <tr><td colSpan={6} className="px-5 py-6 text-center text-xs text-slate-400">Carregando...</td></tr>
              )}
              {filteredVinc?.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td
                    className="px-5 py-2.5 font-medium text-slate-800 cursor-pointer hover:text-blue-600"
                    onClick={() => setSelecionado(v)}
                  >
                    {v.numero_pedido}
                  </td>
                  <td className="px-5 py-2.5 text-slate-600">{v.franquia_nome}</td>
                  <td className="px-5 py-2.5 text-slate-600">{v.nome_cliente}</td>
                  <td className="px-5 py-2.5 text-slate-600">
                    R$ {Number(v.valor_pedido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[v.status] || 'bg-slate-100 text-slate-600'}`}>
                      {statusLabels[v.status] || v.status}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <button
                      onClick={() => { if (confirm(`Deletar pedido "${v.numero_pedido}"?`)) deletarVincMutation.mutate(v.id) }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deletar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVinc && filteredVinc.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-6 text-center text-xs text-slate-400">Nenhum vinculo encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">{filteredVinc?.length || 0} registro(s)</p>
        </div>
      </div>

      {selecionado && (
        <VinculoModal
          vinculo={selecionado}
          onClose={() => setSelecionado(null)}
          modo="visualizar"
        />
      )}
    </div>
  )
}
