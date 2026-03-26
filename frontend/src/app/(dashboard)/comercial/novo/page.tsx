'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { vinculoService, uploadService } from '@/services/vinculo'
import { MotivoSelect } from '@/components/motivo-select'
import api from '@/lib/api'

const schema = z.object({
  numero_pedido: z.string().min(1, 'Obrigatorio'),
  franquia_id: z.coerce.number().min(1, 'Selecione a franquia'),
  nome_cliente: z.string().min(1, 'Obrigatorio'),
  valor_pedido: z.coerce.number().positive('Deve ser positivo'),
  data_pedido: z.string().min(1, 'Obrigatorio'),
  necessario_validacao: z.boolean(),
})

type FormData = z.infer<typeof schema>

export default function NovoPedidoPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [arquivos, setArquivos] = useState<File[]>([])
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const { data: empresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const res = await api.get('/empresas/')
      return res.data
    },
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      necessario_validacao: false,
    },
  })

  const criarMutation = useMutation({
    mutationFn: vinculoService.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculos'] })
      router.push('/comercial')
    },
  })

  const onSubmit = async (data: FormData) => {
    setEnviando(true)
    setErro('')
    try {
      // Upload dos anexos primeiro
      const anexoUrls: string[] = []
      for (const arq of arquivos) {
        const result = await uploadService.upload(arq)
        anexoUrls.push(result.url)
      }

      await criarMutation.mutateAsync({
        ...data,
        motivo: motivo || undefined,
        anexos: anexoUrls,
      })
    } catch (e: any) {
      setErro(e?.response?.data?.detail || 'Erro ao criar pedido')
    } finally {
      setEnviando(false)
    }
  }

  const adicionarArquivo = (file: File) => {
    setArquivos(prev => [...prev, file])
  }

  const removerArquivo = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push('/comercial')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">Novo Pedido de Vinculo</h3>
          <p className="text-xs text-slate-400 mt-1">Preencha os dados do pedido</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Numero do Pedido */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                N. do Pedido
              </label>
              <input
                {...register('numero_pedido')}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
                placeholder="PED-006"
              />
              {errors.numero_pedido && <p className="text-red-500 text-xs mt-1">{errors.numero_pedido.message}</p>}
            </div>

            {/* Franquia */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Franquia
              </label>
              <select
                {...register('franquia_id')}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all bg-white"
              >
                <option value="">Selecione...</option>
                {empresas?.map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.nome_fantasia || e.razao_social}
                  </option>
                ))}
              </select>
              {errors.franquia_id && <p className="text-red-500 text-xs mt-1">{errors.franquia_id.message}</p>}
            </div>
          </div>

          {/* Nome do Cliente */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Nome do Cliente
            </label>
            <input
              {...register('nome_cliente')}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
              placeholder="Nome completo do cliente"
            />
            {errors.nome_cliente && <p className="text-red-500 text-xs mt-1">{errors.nome_cliente.message}</p>}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Motivo
            </label>
            <MotivoSelect value={motivo} onChange={setMotivo} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Valor */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Valor do Pedido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('valor_pedido')}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
                placeholder="0,00"
              />
              {errors.valor_pedido && <p className="text-red-500 text-xs mt-1">{errors.valor_pedido.message}</p>}
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Data do Pedido
              </label>
              <input
                type="date"
                {...register('data_pedido')}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
              />
              {errors.data_pedido && <p className="text-red-500 text-xs mt-1">{errors.data_pedido.message}</p>}
            </div>
          </div>

          {/* Necessario Validacao */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              id="validacao"
              {...register('necessario_validacao')}
              className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-300"
            />
            <label htmlFor="validacao" className="text-sm text-slate-700">
              Necessario validacao do Financeiro
            </label>
            <span className="text-xs text-slate-400 ml-auto">
              Se marcado, o pedido ira para o Financeiro antes do TI
            </span>
          </div>

          {/* Anexos */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Anexos (opcional)
            </label>
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
                    Array.from(e.target.files).forEach(adicionarArquivo)
                  }
                  e.target.value = ''
                }}
              />
            </label>
            {arquivos.length > 0 && (
              <div className="mt-2 space-y-1">
                {arquivos.map((arq, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="flex-1 truncate">{arq.name}</span>
                    <button type="button" onClick={() => removerArquivo(i)} className="text-slate-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {erro}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/comercial')}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 transition-colors disabled:opacity-50"
            >
              {enviando ? 'Salvando...' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
