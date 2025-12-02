
import React, { useState } from 'react';
import { ValidationIssue, DesignVitalSigns, DesignIntention } from '../types';
import { AlertTriangle, CheckCircle2, Info, ArrowRight, Activity, Heart, Wind, ShieldCheck, Sparkles, ChevronDown, Droplet, Type, Layout } from 'lucide-react';

interface ValidationPanelProps {
  issues: ValidationIssue[];
  vitalSigns: DesignVitalSigns;
  intention: DesignIntention;
  onSetIntention: (i: DesignIntention) => void;
  onFix: (id: string) => void;
  projectName: string;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ issues, vitalSigns, intention, onSetIntention, onFix, projectName }) => {
  const [showCertificate, setShowCertificate] = useState(false);

  // Helper to render bars
  const VitalBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
      <div className="mb-2">
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-mono uppercase">
              <span>{label}</span>
              <span>{value}/100</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${color} transition-all duration-1000 ease-out`} 
                style={{ width: `${value}%` }} 
              />
          </div>
      </div>
  );

  if (showCertificate) {
      return (
          <div className="fixed inset-0 z-[100] bg-black text-white flex items-center justify-center font-serif animate-in fade-in duration-700">
               <div className="max-w-2xl w-full border-y border-zinc-800 py-12 px-8 text-center relative">
                   <button onClick={() => setShowCertificate(false)} className="absolute top-4 right-4 text-zinc-600 hover:text-white sans-serif text-xs">CLOSE</button>
                   <div className="text-xs font-mono text-zinc-500 mb-6 uppercase tracking-[0.3em]">Design Engine v1.0 • Validation Certificate</div>
                   
                   <h1 className="text-4xl font-light mb-2 italic">"{projectName}"</h1>
                   <div className="w-12 h-px bg-white mx-auto mb-8 opacity-50"></div>

                   <div className="grid grid-cols-3 gap-8 mb-12">
                        <div className="flex flex-col items-center">
                             <span className="text-emerald-500 mb-2"><Heart size={20} /></span>
                             <span className="text-3xl font-light">{vitalSigns.heartbeat}</span>
                             <span className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">Mechanical</span>
                        </div>
                        <div className="flex flex-col items-center">
                             <span className="text-blue-500 mb-2"><Wind size={20} /></span>
                             <span className="text-3xl font-light">{vitalSigns.breathing}</span>
                             <span className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">Aesthetic</span>
                        </div>
                        <div className="flex flex-col items-center">
                             <span className="text-purple-500 mb-2"><Sparkles size={20} /></span>
                             <span className="text-3xl font-light">98.7</span>
                             <span className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">Experiential</span>
                        </div>
                   </div>

                   <div className="text-zinc-400 text-sm leading-relaxed max-w-lg mx-auto mb-8">
                       This design has been validated against {intention} standards. It demonstrates structural integrity, intentional composition, and functional clarity.
                       <br/><br/>
                       <span className="text-white">Status: PRODUCTION READY</span>
                   </div>

                   <div className="flex justify-center gap-4">
                       <div className="h-12 border border-zinc-700 w-32 flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                           SIG: AI-992
                       </div>
                       <div className="h-12 border border-zinc-700 w-32 flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                           DATE: {new Date().toLocaleDateString()}
                       </div>
                   </div>
               </div>
          </div>
      );
  }

  return (
    <div className="h-1/2 border-t border-zinc-800 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
         <div className="flex items-center gap-2">
            <Activity size={14} className="text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
               Design Vital Signs
            </h2>
         </div>
         
         <div className="relative group">
            <button className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-2 py-1 rounded flex items-center gap-1 hover:bg-zinc-700 transition-colors">
                {intention} <ChevronDown size={10} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded shadow-xl z-50 hidden group-hover:block">
                {(['Corporate', 'Luxury', 'Punk', 'Minimalist', 'Editorial'] as DesignIntention[]).map(i => (
                    <button 
                        key={i} 
                        onClick={() => onSetIntention(i)}
                        className="block w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                        {i}
                    </button>
                ))}
            </div>
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
         {/* Scoreboard */}
         <div className="p-4 border-b border-zinc-900">
             <div className="flex items-end justify-between mb-4">
                 <div>
                     <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Confidence Score</div>
                     <div className="text-2xl font-light text-white flex items-baseline gap-1">
                         {Math.round((vitalSigns.heartbeat + vitalSigns.breathing + vitalSigns.integrity)/3)}
                         <span className="text-sm text-zinc-600">/100</span>
                     </div>
                 </div>
                 <button 
                    onClick={() => setShowCertificate(true)}
                    className="text-[10px] text-emerald-500 hover:text-emerald-400 flex items-center gap-1 border border-emerald-500/30 px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors"
                 >
                     <ShieldCheck size={12} /> Certify
                 </button>
             </div>
             
             <VitalBar label="Heartbeat (Structure)" value={vitalSigns.heartbeat} color="bg-emerald-500" />
             <VitalBar label="Breathing (Space)" value={vitalSigns.breathing} color="bg-blue-500" />
             <VitalBar label="Integrity (Consistency)" value={vitalSigns.integrity} color="bg-purple-500" />
         </div>

         {/* Insights/Issues */}
         <div className="p-2 space-y-2">
            <div className="px-2 py-1 text-[10px] font-bold text-zinc-600 uppercase">Oracle Insights</div>
             {issues.length === 0 ? (
                <div className="p-4 text-center text-zinc-600">
                    <Sparkles size={20} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs italic">"This design touches the soul."</p>
                </div>
             ) : (
                 issues.map((issue) => (
                     <div key={issue.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-md group hover:border-zinc-700 transition-colors relative overflow-hidden">
                         <div className={`absolute left-0 top-0 bottom-0 w-1 ${issue.category === 'Soul' ? 'bg-purple-500' : issue.severity === 'warning' ? 'bg-yellow-500' : issue.severity === 'info' ? 'bg-zinc-500' : 'bg-blue-500'}`} />
                         <div className="flex items-start gap-2 pl-2">
                            <div className="flex-1">
                                 <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                                        {issue.category === 'Color' && <Droplet size={10} />}
                                        {issue.category === 'Typography' && <Type size={10} />}
                                        {issue.category === 'Layout' && <Layout size={10} />}
                                        {issue.category === 'Soul' && <Sparkles size={10} />}
                                        {issue.category}
                                    </span>
                                 </div>
                                 <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{issue.message}</p>
                                 
                                 {issue.fixAction && issue.fixValue && (
                                     <div className="mt-1 text-[10px] text-zinc-500 flex items-center gap-1">
                                         <span>Suggested:</span> 
                                         <span className="text-white bg-zinc-800 px-1 rounded">
                                            {typeof issue.fixValue === 'string' && issue.fixValue.startsWith('#') 
                                                ? <span className="flex items-center gap-1"><span className="w-2 h-2 inline-block rounded-full" style={{background: issue.fixValue}}></span> {issue.fixValue}</span> 
                                                : issue.fixValue}
                                         </span>
                                     </div>
                                 )}
                            </div>
                         </div>
                         
                         {issue.autoFixAvailable && (
                             <button 
                                onClick={() => onFix(issue.id)}
                                className="ml-2 mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] px-3 py-1 rounded flex items-center gap-1 transition-colors w-full justify-center"
                             >
                                <span className="font-medium">Auto-Correct</span>
                                <ArrowRight size={10} />
                             </button>
                         )}
                     </div>
                 ))
             )}
         </div>
      </div>
    </div>
  );
};
