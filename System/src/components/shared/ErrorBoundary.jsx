import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-card p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-primary/10 rounded-xll flex items-center justify-center mx-auto mb-8 border border-primary/20">
                <AlertTriangle size={40} className="text-primary" strokeWidth={1.5} />
              </div>
              
              <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                Ops! Algo deu errado
              </h1>
              
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Ocorreu um erro inesperado nesta página. Nossa equipe foi notificada (no console). Tente recarregar ou voltar para o início.
              </p>

              {this.state.error && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xll p-6 mb-8 text-left animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400 opacity-60">Log do Erro</p>
                  </div>
                  <p className="text-[11px] font-mono text-red-300 leading-relaxed font-bold">
                    {this.state.error?.name}: {this.state.error?.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReload}
                  className="btn-primary w-full py-4 rounded-xll flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  <RefreshCw size={16} strokeWidth={2.5} />
                  Recarregar Sistema
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full py-4 rounded-xll flex items-center justify-center gap-3 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Home size={16} />
                  Ir para o Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

