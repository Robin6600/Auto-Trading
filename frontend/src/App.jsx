import React, { useState, useEffect } from 'react';
import Scanner from './components/Scanner';
import ResultTerminal from './components/ResultTerminal';
import { Lock, Key } from 'lucide-react';

const API_URL = 'http://localhost:8000';

function App() {
  const [appState, setAppState] = useState('IDLE'); // IDLE, SCANNING, RESULT
  const [scanResult, setScanResult] = useState(null);
  const [trialCount, setTrialCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');

  // Valid keys for demo
  const VALID_KEYS = ['SNIPER-PRO-2026', 'ADMIN-X-99'];

  useEffect(() => {
    const savedTrials = parseInt(localStorage.getItem('sniperTrials') || '0');
    setTrialCount(savedTrials);
    const hasValidLicense = localStorage.getItem('sniperLicense');
    
    if (savedTrials >= 3 && !hasValidLicense) {
        setIsLocked(true);
    }
  }, []);

  const handleScanStart = async (file) => {
    if (isLocked) {
        setShowLicenseModal(true);
        return;
    }

    setAppState('SCANNING');

    // Simulate scan sound if we had one
    // const audio = new Audio('/scan_sound.mp3');
    // audio.play();

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Analysis Failed');
        }

        const data = await response.json();
        
        // Simulating the "Scanning" delay for effect even if API is fast
        setTimeout(() => {
            setScanResult(data);
            setAppState('RESULT');

            // 🤖 Robotic Voice Effect
            const utterance = new SpeechSynthesisUtterance("Analysis Complete. Trade Opportunity Detected.");
            utterance.pitch = 0.8;
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
            
            // Increment trial count
            if (!localStorage.getItem('sniperLicense')) {
                const newCount = trialCount + 1;
                setTrialCount(newCount);
                localStorage.setItem('sniperTrials', newCount.toString());
                if (newCount >= 3) {
                    setIsLocked(true);
                }
            }
        }, 2000);

    } catch (error) {
        console.error(error);
        setAppState('IDLE');
        alert("Server Error: Ensure Backend is running on Port 8000");
    }
  };

  const verifyLicense = () => {
    if (VALID_KEYS.includes(licenseKey)) {
        localStorage.setItem('sniperLicense', 'TRUE');
        setIsLocked(false);
        setShowLicenseModal(false);
        alert("ACCESS GRANTED: WELCOME SNIPER PRO");
    } else {
        alert("ACCESS DENIED: INVALID KEY");
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center relative font-mono text-white">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      {/* License Warning/Status */}
      <div className="absolute top-4 right-4 text-xs font-mono">
        {isLocked ? (
            <div className="text-cyber-neonRed flex items-center gap-2 cursor-pointer" onClick={() => setShowLicenseModal(true)}>
                <Lock size={14} /> TRIAL EXPIRED
            </div>
        ) : (
            <div className="text-cyber-neonGreen flex items-center gap-2">
                <ShieldIcon /> SYSTEM RELIABLE
            </div>
        )}
      </div>

      <header className="mb-12 text-center relative z-10 animate-fadeDown">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-cyan to-cyber-neonGreen pb-2 filter drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
          SNIPER TRADER PRO
        </h1>
        <p className="text-cyber-cyan/70 tracking-[0.3em] text-sm uppercase">Expert Chart Analyzer</p>
      </header>

      <main className="w-full max-w-4xl relative z-10 flex flex-col gap-8">
        
        {appState === 'IDLE' && (
            <div className="relative">
                 {isLocked && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                        <button 
                            onClick={() => setShowLicenseModal(true)}
                            className="bg-cyber-neonRed text-black px-6 py-3 font-bold rounded hover:shadow-neon-red transition-all"
                        >
                            UNLOCK FULL VERSION
                        </button>
                    </div>
                )}
                <Scanner onScanStart={handleScanStart} />
                 <div className="text-center mt-4 text-gray-500 text-xs">
                    FREE TRIALS REMAINING: {Math.max(0, 3 - trialCount)}
                </div>
            </div>
        )}

        {appState === 'SCANNING' && (
             <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center h-96 relative overflow-hidden border border-cyber-neonGreen/30 shadow-neon-green">
                <div className="laser-beam"></div>
                <div className="text-4xl font-bold text-cyber-neonGreen animate-pulse mt-8 tracking-widest text-center">
                    ANALYZING DATA STREAM...
                </div>
                <div className="mt-4 text-cyber-cyan font-mono text-sm">
                    {/* Fake terminal output */}
                    <div className="animate-pulse">Connecting to Neural Net... OK</div>
                    <div className="animate-pulse delay-75">Fetching Price Action... OK</div>
                    <div className="animate-pulse delay-150">Calculating Fibonacci... OK</div>
                </div>
                <div className="absolute top-4 right-4 text-xs font-mono text-cyber-cyan/50 flex flex-col gap-1 items-end">
                    <span>Target: INPUT_IMAGE_001</span>
                    <span>Algorithm: GPT-4o Vision</span>
                    <span>Secure Connection: ENCRYPTED</span>
                </div>
             </div>
        )}

        {appState === 'RESULT' && scanResult && (
            <ResultTerminal result={scanResult} onReset={() => setAppState('IDLE')} />
        )}

      </main>

      {/* License Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-black border border-cyber-neonRed shadow-neon-red p-8 rounded-lg max-w-md w-full relative">
                <button 
                    onClick={() => setShowLicenseModal(false)}
                    className="absolute top-2 right-2 text-cyber-neonRed hover:text-white"
                >
                    X
                </button>
                <div className="flex justify-center mb-6 text-cyber-neonRed">
                    <Lock size={48} />
                </div>
                <h2 className="text-2xl font-bold text-center text-white mb-2">ACCESS RESTRICTED</h2>
                <p className="text-center text-gray-400 mb-6 text-sm">
                    Your free trial has expired. meaningful trading requires commitment.
                    <br/>Enter your license key to continue.
                </p>
                <input 
                    type="text" 
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full bg-white/5 border border-white/20 rounded p-3 text-center text-cyber-cyan mb-4 focus:outline-none focus:border-cyber-cyan"
                />
                <button 
                    onClick={verifyLicense}
                    className="w-full py-3 bg-cyber-neonRed text-black font-bold rounded hover:bg-white transition-colors"
                >
                    VALIDATE LICENSE
                </button>
            </div>
        </div>
      )}

      <footer className="mt-16 text-center text-gray-500 text-xs relative z-10">
        <p>SYSTEM DEVELOPED BY SHEIKH RASEL ROBIN</p>
        <p className="mt-2 text-[10px] opacity-50">Trading involves risk. Use as a secondary tool.</p>
      </footer>
    </div>
  )
}

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
)

export default App
