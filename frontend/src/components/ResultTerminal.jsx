import React from 'react';
import { ShieldCheck, Target, TrendingUp, AlertTriangle } from 'lucide-react';

const ResultTerminal = ({ result, onReset }) => {
  const isBuy = result.signal === 'BUY';
  const signalColor = isBuy ? 'text-cyber-neonGreen' : 'text-cyber-neonRed';
  const borderColor = isBuy ? 'border-cyber-neonGreen' : 'border-cyber-neonRed';

  return (
    <div className="w-full animate-fadeIn">
        <div className={`glass-panel border-l-4 ${borderColor} rounded-r-xl p-6 mb-6 flex justify-between items-center bg-black/80`}>
            <div>
                <h3 className="text-gray-400 text-xs font-mono mb-1">SIGNAL STATUS</h3>
                <div className={`text-4xl font-bold ${signalColor} flex items-center gap-3`}>
                    <div className={`w-3 h-3 rounded-full ${isBuy ? 'bg-cyber-neonGreen shadow-neon-green' : 'bg-cyber-neonRed shadow-neon-red'} animate-pulse`}></div>
                    {result.signal} CONFIRMED
                </div>
            </div>
            <div className="text-right">
                <div className="text-cyber-cyan text-xl font-bold">{result.confidence}%</div>
                <div className="text-xs text-gray-500">CONFIDENCE SCORE</div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Entry Card */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
                    <Target size={16} /> ENTRY PRICE
                </div>
                <div className="text-2xl font-mono text-white">{result.entry.toFixed(2)}</div>
            </div>

            {/* SL Card */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyber-neonRed/10 rounded-bl-full -mr-8 -mt-8"></div>
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
                    <AlertTriangle size={16} className="text-cyber-neonRed" /> STOP LOSS
                </div>
                <div className="text-2xl font-mono text-cyber-neonRed">{result.sl.toFixed(2)}</div>
            </div>

            {/* TP Card */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyber-neonGreen/10 rounded-bl-full -mr-8 -mt-8"></div>
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
                    <TrendingUp size={16} className="text-cyber-neonGreen" /> TAKE PROFIT
                </div>
                <div className="text-2xl font-mono text-cyber-neonGreen">{result.tp.toFixed(2)}</div>
            </div>
        </div>

        <div className="glass-panel p-6 rounded-xl mb-6">
            <h4 className="text-cyber-cyan mb-4 font-mono text-sm border-b border-white/10 pb-2">PATTERN ANALYSIS</h4>
            <p className="text-gray-300 leading-relaxed font-light">
                <span className="text-white font-semibold">{result.pattern}</span> detected on the current timeframe. 
                Price action indicates strong rejection from support levels. 
                RSI divergence confirms momentum shift.
            </p>
        </div>

        <button 
            onClick={onReset}
            className="w-full py-4 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan hover:text-black font-bold tracking-widest transition-all duration-300 uppercase"
        >
            New Scan Analysis
        </button>
    </div>
  );
};

export default ResultTerminal;
