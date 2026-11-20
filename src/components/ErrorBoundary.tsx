import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Active Theory Uncaught App Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#020205] text-white font-mono select-none">
          <div className="max-w-md w-full p-8 rounded-3xl border border-red-500/40 bg-[#07050a] shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center space-y-5">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <div className="text-[10px] tracking-[0.25em] text-red-400 uppercase">
                CRITICAL STAGE RECOVERY // AUTO-INTERCEPT
              </div>
              <h2 className="text-xl font-display font-black text-white uppercase">
                SYSTEM INTERCEPTED EXCEPTION
              </h2>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              A runtime exception was intercepted by the Active Theory Sentinel. The 3D viewport state has been isolated.
            </p>

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-full bg-white text-black hover:bg-cyan-400 font-bold text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <RotateCcw size={14} />
              <span>RE-ENGAGE GATEWAY [RESET]</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
