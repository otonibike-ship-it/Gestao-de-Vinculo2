import api from '@/lib/api'

export type Perfil = 'comercial' | 'financeiro' | 'ti' | 'admin' | 'franquia'

const REDIRECT_MAP: Record<Perfil, string> = {
  comercial: '/comercial',
  financeiro: '/financeiro',
  ti: '/ti',
  admin: '/comercial',
  franquia: '/franquia',
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
    if (data.franquia_id) {
      localStorage.setItem('franquia_id', String(data.franquia_id))
    } else {
      localStorage.removeItem('franquia_id')
    }
    return data
  },

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('perfil')
    localStorage.removeItem('nome')
    localStorage.removeItem('franquia_id')
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

  getFranquiaId(): number | null {
    const id = localStorage.getItem('franquia_id')
    return id ? Number(id) : null
  },

  getRedirectPath(): string {
    const perfil = this.getPerfil()
    return REDIRECT_MAP[perfil] || '/comercial'
  },
}
