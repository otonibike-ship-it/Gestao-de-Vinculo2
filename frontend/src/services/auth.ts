import api from '@/lib/api'

export type Perfil = 'comercial' | 'financeiro' | 'ti' | 'admin'

const REDIRECT_MAP: Record<Perfil, string> = {
  comercial: '/comercial',
  financeiro: '/financeiro',
  ti: '/ti',
  admin: '/comercial',
}

export const authService = {
  async login(email: string, senha: string) {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', senha)

    const { data } = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('perfil', data.perfil)
    localStorage.setItem('nome', data.nome)
    return data
  },

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('perfil')
    localStorage.removeItem('nome')
    window.location.href = '/login'
  },

  isLoggedIn() {
    return !!localStorage.getItem('access_token')
  },

  getPerfil(): Perfil {
    return (localStorage.getItem('perfil') as Perfil) || 'comercial'
  },

  getNome(): string {
    return localStorage.getItem('nome') || 'Usuário'
  },

  getRedirectPath(): string {
    const perfil = this.getPerfil()
    return REDIRECT_MAP[perfil] || '/comercial'
  },
}
