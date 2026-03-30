import api from '@/lib/api'

export interface VinculoData {
  id: number
  numero_pedido: string
  franquia_id: number
  franquia_nome: string
  nome_cliente: string
  valor_pedido: number
  data_pedido: string
  motivo: string | null
  necessario_validacao: boolean
  status: 'aberto' | 'validacao_financeiro' | 'tarefa_ti' | 'fechado'
  anexos: string[]
  justificativa_reprovacao: string | null
  criado_em: string
  atualizado_em: string
}

export interface VinculoCreatePayload {
  numero_pedido: string
  franquia_id: number
  nome_cliente: string
  valor_pedido: number
  data_pedido: string
  motivo?: string
  necessario_validacao: boolean
  anexos?: string[]
}

export const vinculoService = {
  async listar(status?: string) {
    const params: Record<string, string> = {}
    if (status) params.status = status
    const { data } = await api.get('/vinculos', { params })
    return data as VinculoData[]
  },

  async obter(id: number) {
    const { data } = await api.get(`/vinculos/${id}`)
    return data as VinculoData
  },

  async criar(payload: VinculoCreatePayload) {
    const { data } = await api.post('/vinculos', payload)
    return data as VinculoData
  },

  async aprovar(id: number, anexos: string[] = []) {
    const { data } = await api.put(`/vinculos/${id}/aprovar`, { anexos })
    return data as VinculoData
  },

  async reprovar(id: number, justificativa: string) {
    const { data } = await api.put(`/vinculos/${id}/reprovar`, { justificativa })
    return data as VinculoData
  },

  async reenviar(id: number, payload: Omit<VinculoCreatePayload, 'numero_pedido'>) {
    const { data } = await api.put(`/vinculos/${id}/reenviar`, payload)
    return data as VinculoData
  },

  async deletar(id: number) {
    await api.delete(`/vinculos/${id}`)
  },
}

export const uploadService = {
  async upload(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data as { filename: string; url: string }
  },
}
