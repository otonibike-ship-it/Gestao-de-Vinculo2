'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '@/services/auth'

const loginSchema = z.object({
  email: z.string().email('E-mail invalido'),
  senha: z.string().min(6, 'Minimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

const credenciais = [
  { perfil: 'Comercial', email: 'comercial@vinculo.com', senha: '123456' },
  { perfil: 'Financeiro', email: 'financeiro@vinculo.com', senha: '123456' },
  { perfil: 'TI', email: 'ti@vinculo.com', senha: '123456' },
  { perfil: 'Admin', email: 'admin@vinculo.com', senha: 'admin123' },
]

export default function LoginPage() {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setCarregando(true)
    setErro('')
    try {
      await authService.login(data.email, data.senha)
      router.push(authService.getRedirectPath())
    } catch {
      setErro('E-mail ou senha invalidos.')
    } finally {
      setCarregando(false)
    }
  }

  const preencherCredencial = (email: string, senha: string) => {
    setValue('email', email)
    setValue('senha', senha)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10">
          {/* Titulo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Gestao de Vinculos
            </h1>
            <p className="text-sm text-slate-400 mt-1">SenseBike</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* E-mail */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                E-mail
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-400 transition-all"
                placeholder="seu.email@sensebike.com.br"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Senha
              </label>
              <input
                type="password"
                {...register('senha')}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-400 transition-all"
                placeholder="Digite sua senha"
              />
              {errors.senha && <p className="text-red-500 text-xs mt-1.5">{errors.senha.message}</p>}
            </div>

            {/* Erro */}
            {erro && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl text-center">
                {erro}
              </div>
            )}

            {/* Botao */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-slate-300/30 disabled:opacity-60"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Credenciais de teste */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">Credenciais de teste</p>
            <div className="grid grid-cols-2 gap-2">
              {credenciais.map((c) => (
                <button
                  key={c.perfil}
                  type="button"
                  onClick={() => preencherCredencial(c.email, c.senha)}
                  className="text-left px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <p className="text-xs font-medium text-slate-600">{c.perfil}</p>
                  <p className="text-[10px] text-slate-400 truncate">{c.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
