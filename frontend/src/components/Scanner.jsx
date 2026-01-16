import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

const Scanner = ({ onScanStart }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onScanStart(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
        onScanStart(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div 
        className={`glass-panel rounded-3xl p-1 border-2 border-dashed transition-all duration-300 relative group cursor-pointer ${isDragging ? 'border-cyber-neonGreen bg-cyber-neonGreen/10 scale-105' : 'border-cyber-cyan/30 hover:border-cyber-cyan'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
    >
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect} 
            accept="image/*"
        />
        <div className="bg-black/40 rounded-[20px] p-20 flex flex-col items-center justify-center text-center h-96 transition-all duration-300 group-hover:bg-black/60">
            <div className={`p-6 rounded-full bg-cyber-cyan/10 mb-6 transition-all duration-500 ${isDragging ? 'shadow-neon-green' : 'group-hover:shadow-neon-blue'}`}>
                <Upload className={`w-12 h-12 ${isDragging ? 'text-cyber-neonGreen' : 'text-cyber-cyan'}`} />
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-white group-hover:text-cyber-cyan transition-colors">
                INITIATE SCAN
            </h2>
            <p className="text-gray-400 max-w-xs mx-auto">
                Drag & Drop chart image or <span className="text-cyber-neonGreen underline">browse files</span>
            </p>
            
            <div className="mt-8 flex gap-4 text-xs font-mono text-gray-500">
                <span className="px-2 py-1 border border-white/10 rounded">.JPG</span>
                <span className="px-2 py-1 border border-white/10 rounded">.PNG</span>
                <span className="px-2 py-1 border border-white/10 rounded">MIN 1080p</span>
            </div>
        </div>
        
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-cyan opacity-50"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-cyan opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-cyan opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-cyan opacity-50"></div>
    </div>
  );
};

export default Scanner;
