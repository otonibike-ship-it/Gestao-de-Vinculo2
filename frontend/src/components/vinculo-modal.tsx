'use client'

import { useState, useEffect } from 'react'
import { X, Check, XCircle, Upload, FileText, Image as ImageIcon, Pencil, Send } from 'lucide-react'
import { VinculoData, vinculoService, uploadService } from '@/services/vinculo'
import { MotivoSelect } from '@/components/motivo-select'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

interface VinculoModalProps {
  vinculo: VinculoData
  onClose: () => void
  modo: 'financeiro' | 'ti' | 'comercial' | 'visualizar'
}

const statusLabels: Record<string, string> = {
  aberto: 'Aberto',
  validacao_financeiro: 'Validacao Financeiro',
  tarefa_ti: 'Tarefa TI',
  fechado: 'Fechado',
}

const statusColors: Record<string, string> = {
  aberto: 'bg-blue-100 text-blue-700',
  validacao_financeiro: 'bg-amber-100 text-amber-700',
  tarefa_ti: 'bg-purple-100 text-purple-700',
  fechado: 'bg-green-100 text-green-700',
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export function VinculoModal({ vinculo, onClose, modo }: VinculoModalProps) {
  const queryClient = useQueryClient()
  const [justificativa, setJustificativa] = useState('')
  const [mostrarReprovar, setMostrarReprovar] = useState(false)
  const [arquivosAprovacao, setArquivosAprovacao] = useState<File[]>([])
  const [enviando, setEnviando] = useState(false)

  // Estado de edicao (comercial editando pedido reprovado)
  const [editando, setEditando] = useState(false)
  const [formFranquiaId, setFormFranquiaId] = useState(vinculo.franquia_id)
  const [formCliente, setFormCliente] = useState(vinculo.nome_cliente)
  const [formValor, setFormValor] = useState(String(vinculo.valor_pedido))
  const [formData, setFormData] = useState(vinculo.data_pedido)
  const [formMotivo, setFormMotivo] = useState(vinculo.motivo || '')
  const [formValidacao, setFormValidacao] = useState(vinculo.necessario_validacao)
  const [formAnexos, setFormAnexos] = useState<string[]>(vinculo.anexos || [])
  const [novosArquivos, setNovosArquivos] = useState<File[]>([])

  const { data: empresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const res = await api.get('/empresas')
      return res.data
    },
    enabled: editando,
  })

  const podeEditar = modo === 'comercial' && vinculo.status === 'aberto' && !!vinculo.justificativa_reprovacao

  const aprovarMutation = useMutation({
    mutationFn: async () => {
      const anexoUrls: string[] = []
      for (const arq of arquivosAprovacao) {
        const result = await uploadService.upload(arq)
        anexoUrls.push(result.url)
      }
      return vinculoService.aprovar(vinculo.id, anexoUrls)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculos'] })
      onClose()
    },
  })

  const reprovarMutation = useMutation({
    mutationFn: () => vinculoService.reprovar(vinculo.id, justificativa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculos'] })
      onClose()
    },
  })

  const reenviarMutation = useMutation({
    mutationFn: async () => {
      // Upload novos arquivos
      const uploadedUrls: string[] = []
      for (const arq of novosArquivos) {
        const result = await uploadService.upload(arq)
        uploadedUrls.push(result.url)
      }
      const todosAnexos = [...formAnexos, ...uploadedUrls]

      return vinculoService.reenviar(vinculo.id, {
        franquia_id: formFranquiaId,
        nome_cliente: formCliente,
        valor_pedido: Number(formValor),
        data_pedido: formData,
        motivo: formMotivo || undefined,
        necessario_validacao: formValidacao,
        anexos: todosAnexos,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculos'] })
      onClose()
    },
  })

  const handleAprovar = async () => {
    setEnviando(true)
    try {
      await aprovarMutation.mutateAsync()
    } finally {
      setEnviando(false)
    }
  }

  const handleReprovar = async () => {
    if (!justificativa.trim()) return
    setEnviando(true)
    try {
      await reprovarMutation.mutateAsync()
    } finally {
      setEnviando(false)
    }
  }

  const handleReenviar = async () => {
    if (!formCliente.trim() || !formValor || !formData) return
    setEnviando(true)
    try {
      await reenviarMutation.mutateAsync()
    } finally {
      setEnviando(false)
    }
  }

  const podeAprovarReprovar = (modo === 'financeiro' || modo === 'ti') && (
    (modo === 'financeiro' && vinculo.status === 'validacao_financeiro') ||
    (modo === 'ti' && vinculo.status === 'tarefa_ti')
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Pedido {vinculo.numero_pedido}
              {editando && <span className="text-sm font-normal text-amber-600 ml-2">- Editando</span>}
            </h3>
            <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[vinculo.status] || 'bg-slate-100 text-slate-600'}`}>
              {statusLabels[vinculo.status] || vinculo.status}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Justificativa de reprovacao (sempre visivel se existir) */}
          {vinculo.justificativa_reprovacao && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-red-600 mb-1">Motivo da Reprovacao</p>
              <p className="text-sm text-red-700">{vinculo.justificativa_reprovacao}</p>
            </div>
          )}

          {editando ? (
            /* ===== MODO EDICAO ===== */
            <div className="space-y-4">
              {/* Franquia */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Franquia</label>
                <select
                  value={formFranquiaId}
                  onChange={(e) => setFormFranquiaId(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all bg-white"
                >
                  <option value="">Selecione...</option>
                  {empresas?.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.nome_fantasia || e.razao_social}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome do Cliente</label>
                <input
                  value={formCliente}
                  onChange={(e) => setFormCliente(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Motivo</label>
                <MotivoSelect value={formMotivo} onChange={setFormMotivo} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
                  />
                </div>

                {/* Data */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Data do Pedido</label>
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
                  />
                </div>
              </div>

              {/* Validacao */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  id="edit-validacao"
                  checked={formValidacao}
                  onChange={(e) => setFormValidacao(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-300"
                />
                <label htmlFor="edit-validacao" className="text-sm text-slate-700">
                  Necessario validacao do Financeiro
                </label>
              </div>

              {/* Anexos existentes */}
              {formAnexos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Anexos atuais</p>
                  <div className="space-y-1">
                    {formAnexos.map((anexo, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                        <FileText size={14} className="text-slate-400" />
                        <span className="flex-1 text-sm text-slate-600 truncate">{anexo.split('/').pop()}</span>
                        <button
                          type="button"
                          onClick={() => setFormAnexos(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload novos arquivos */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Adicionar Anexos</label>
                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                  <Upload size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-400">Selecionar arquivos...</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setNovosArquivos(prev => [...prev, ...Array.from(e.target.files!)])
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
                {novosArquivos.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {novosArquivos.map((arq, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-green-50 rounded-lg px-3 py-2">
                        <span className="text-xs text-green-600 font-medium">NOVO</span>
                        <span className="flex-1 truncate">{arq.name}</span>
                        <button
                          type="button"
                          onClick={() => setNovosArquivos(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ===== MODO VISUALIZACAO ===== */
            <>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Franquia" valor={vinculo.franquia_nome} />
                <Campo label="Cliente" valor={vinculo.nome_cliente} />
                <Campo label="Valor" valor={`R$ ${Number(vinculo.valor_pedido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Campo label="Data do Pedido" valor={vinculo.data_pedido ? new Date(vinculo.data_pedido + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} />
                <Campo label="Validacao Necessaria" valor={vinculo.necessario_validacao ? 'Sim' : 'Nao'} />
                <Campo label="Criado em" valor={vinculo.criado_em ? new Date(vinculo.criado_em).toLocaleDateString('pt-BR') : '—'} />
              </div>

              {/* Motivo */}
              {vinculo.motivo && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Motivo</p>
                  <p className="text-sm text-slate-700">{vinculo.motivo}</p>
                </div>
              )}

              {/* Anexos */}
              {vinculo.anexos && vinculo.anexos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Anexos</p>
                  <div className="space-y-2">
                    {vinculo.anexos.map((anexo, i) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(anexo)
                      const url = `${API_URL}${anexo}`
                      return (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border border-slate-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                        >
                          {isImage ? (
                            <div className="relative">
                              <img
                                src={url}
                                alt={`Anexo ${i + 1}`}
                                className="w-full max-h-48 object-contain bg-slate-50"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full shadow transition-opacity">
                                  Abrir em nova aba
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors">
                              <FileText size={16} />
                              {anexo.split('/').pop()}
                            </div>
                          )}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Upload de anexos ao aprovar (financeiro) */}
              {podeAprovarReprovar && modo === 'financeiro' && !mostrarReprovar && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Anexar documentos (opcional)</p>
                  <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                    <Upload size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-400">Selecionar arquivos...</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setArquivosAprovacao(prev => [...prev, ...Array.from(e.target.files!)])
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {arquivosAprovacao.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {arquivosAprovacao.map((arq, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                          <ImageIcon size={14} className="text-green-500 shrink-0" />
                          <span className="flex-1 truncate">{arq.name}</span>
                          <button
                            type="button"
                            onClick={() => setArquivosAprovacao(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Campo justificativa para reprovar */}
              {podeAprovarReprovar && mostrarReprovar && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Justificativa da Reprovacao</p>
                  <textarea
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    placeholder="Descreva o motivo da reprovacao..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all resize-none"
                    rows={3}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - botoes de acao */}
        <div className="px-6 py-4 border-t border-slate-100">
          {editando ? (
            /* Botoes modo edicao */
            <div className="flex gap-3">
              <button
                onClick={() => setEditando(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReenviar}
                disabled={enviando || !formCliente.trim() || !formValor || !formData}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {enviando ? 'Reenviando...' : 'Reenviar Pedido'}
              </button>
            </div>
          ) : podeAprovarReprovar ? (
            /* Botoes aprovar/reprovar */
            <div className="flex gap-3">
              {mostrarReprovar ? (
                <>
                  <button
                    onClick={() => setMostrarReprovar(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReprovar}
                    disabled={!justificativa.trim() || enviando}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    {enviando ? 'Reprovando...' : 'Confirmar Reprovacao'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setMostrarReprovar(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Reprovar
                  </button>
                  <button
                    onClick={handleAprovar}
                    disabled={enviando}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    {enviando ? 'Aprovando...' : 'Aprovar'}
                  </button>
                </>
              )}
            </div>
          ) : podeEditar ? (
            /* Botao editar (comercial com pedido reprovado) */
            <button
              onClick={() => setEditando(true)}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              <Pencil size={16} />
              Editar e Reenviar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-slate-700 mt-0.5">{valor}</p>
    </div>
  )
}
