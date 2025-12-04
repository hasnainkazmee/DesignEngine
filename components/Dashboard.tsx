
import React, { useState } from 'react';
import { Project, ARTBOARD_PRESETS, ComponentItem } from '../types';
import { Plus, Clock, MoreVertical, File, Monitor, Sparkles, ArrowRight, Library, Image as ImageIcon } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  components: ComponentItem[];
  onCreateProject: (name: string, width: number, height: number) => void;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
}

const KazmLogo = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="currentColor"/>
        <path d="M7 5H14V14.5L21.5 6H29.5L19.5 16L29.5 26H21.5L14 17.5V26H7V5Z" fill="white"/>
    </svg>
);

export const Dashboard: React.FC<DashboardProps> = ({ projects, components, onCreateProject, onSelectProject, onDeleteProject }) => {
  const [activeTab, setActiveTab] = useState<'recents' | 'new' | 'library'>('recents');
  
  // New Project State
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0); // Index of preset
  const [customWidth, setCustomWidth] = useState(ARTBOARD_PRESETS[0].width);
  const [customHeight, setCustomHeight] = useState(ARTBOARD_PRESETS[0].height);

  const handleCreateClick = () => {
      if (!newProjectName.trim()) {
          alert("Please name your project");
          return;
      }
      onCreateProject(newProjectName, customWidth, customHeight);
  };

  const handlePresetSelect = (idx: number) => {
      setSelectedPreset(idx);
      setCustomWidth(ARTBOARD_PRESETS[idx].width);
      setCustomHeight(ARTBOARD_PRESETS[idx].height);
  };

  const formatDate = (ts: number) => {
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
       {/* Top Bar */}
       <div className="h-16 border-b border-zinc-800 flex items-center px-8 justify-between shrink-0 bg-zinc-900/50 backdrop-blur">
          <div className="flex items-center gap-3">
             <div className="text-blue-600">
                 <KazmLogo size={32} />
             </div>
             <div>
                 <h1 className="font-bold tracking-tight text-xl leading-none font-mono">KAZM</h1>
                 <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Design Workspace v1.0</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  System Online
              </div>
          </div>
       </div>

       <div className="flex-1 flex overflow-hidden">
           {/* Sidebar */}
           <div className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-6 bg-zinc-950">
               <div>
                   <button 
                      onClick={() => setActiveTab('new')}
                      className={`w-full py-3 rounded-md flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-lg
                      ${activeTab === 'new' ? 'bg-blue-600 text-white shadow-blue-900/30' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                   >
                       <Plus size={16} /> New Project
                   </button>
               </div>

               <div className="space-y-1">
                   <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Library</div>
                   <button 
                      onClick={() => setActiveTab('recents')}
                      className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors ${activeTab === 'recents' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'}`}
                   >
                       <Clock size={16} /> Recent Projects
                   </button>
                   <button 
                      onClick={() => setActiveTab('library')}
                      className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors ${activeTab === 'library' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'}`}
                   >
                       <Library size={16} /> Components
                   </button>
                   <button className="w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 transition-colors">
                       <Sparkles size={16} /> Templates <span className="ml-auto text-[9px] bg-zinc-800 px-1 rounded text-zinc-500">SOON</span>
                   </button>
               </div>
               
               <div className="mt-auto">
                   <div className="p-4 bg-zinc-900 rounded border border-zinc-800">
                       <div className="text-xs font-bold text-zinc-400 mb-1">Pro Tip</div>
                       <p className="text-[10px] text-zinc-500 leading-relaxed">
                           Use the Validation Engine to check your designs against "Luxury" or "Punk" intentions.
                       </p>
                   </div>
               </div>
           </div>

           {/* Content Area */}
           <div className="flex-1 overflow-y-auto bg-black p-8">
               
               {/* --- RECENT PROJECTS --- */}
               {activeTab === 'recents' && (
                   <div className="max-w-6xl mx-auto">
                       <h2 className="text-2xl font-light mb-6 flex items-center gap-3">
                           Recent Projects 
                           <span className="text-sm text-zinc-600 font-mono bg-zinc-900 px-2 py-0.5 rounded-full">{projects.length}</span>
                       </h2>
                       
                       {projects.length === 0 ? (
                           <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center flex flex-col items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                               <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                   <div className="text-zinc-600">
                                       <KazmLogo size={32} />
                                   </div>
                               </div>
                               <h3 className="text-lg font-medium text-zinc-300">No projects yet</h3>
                               <p className="text-zinc-500 text-sm mb-6 max-w-xs">Start by creating a new design system or opening a template.</p>
                               <button onClick={() => setActiveTab('new')} className="text-blue-400 hover:text-blue-300 text-sm font-medium">Create New Project &rarr;</button>
                           </div>
                       ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {projects.map(project => (
                                   <div 
                                      key={project.id} 
                                      className="group bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-lg p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-blue-900/10 flex flex-col h-64 relative"
                                      onClick={() => onSelectProject(project.id)}
                                   >
                                       <div className="flex justify-between items-start mb-4">
                                           <div className="w-10 h-10 bg-zinc-950 rounded border border-zinc-800 flex items-center justify-center group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-colors text-zinc-600">
                                               {project.gridConfig.width > project.gridConfig.height ? <Monitor size={20} /> : <File size={20} />}
                                           </div>
                                           <div className="relative" onClick={e => e.stopPropagation()}>
                                               <button onClick={() => onDeleteProject(project.id)} className="p-1 hover:bg-zinc-800 rounded text-zinc-600 hover:text-red-400 transition-colors">
                                                   <MoreVertical size={16} />
                                               </button>
                                           </div>
                                       </div>

                                       <h3 className="font-bold text-zinc-200 text-lg mb-1 truncate group-hover:text-blue-400 transition-colors">{project.name}</h3>
                                       <div className="text-xs text-zinc-500 font-mono mb-4">
                                           {project.gridConfig.width} x {project.gridConfig.height} • {formatDate(project.lastModified)}
                                       </div>

                                       {/* Mini Vital Signs */}
                                       <div className="mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-4">
                                           <div>
                                               <div className="text-[9px] text-zinc-600 uppercase mb-1">Heartbeat</div>
                                               <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                   <div className="h-full bg-emerald-500" style={{ width: `${project.vitalSigns.heartbeat}%` }}/>
                                               </div>
                                           </div>
                                           <div>
                                               <div className="text-[9px] text-zinc-600 uppercase mb-1">Breathing</div>
                                               <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                   <div className="h-full bg-blue-500" style={{ width: `${project.vitalSigns.breathing}%` }}/>
                                               </div>
                                           </div>
                                           <div>
                                               <div className="text-[9px] text-zinc-600 uppercase mb-1">Soul</div>
                                               <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                   <div className="h-full bg-purple-500" style={{ width: `${project.vitalSigns.intentionMatch}%` }}/>
                                               </div>
                                           </div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               )}
               
               {/* --- COMPONENT LIBRARY --- */}
               {activeTab === 'library' && (
                   <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl font-light mb-6 flex items-center gap-3">
                           Component Library
                           <span className="text-sm text-zinc-600 font-mono bg-zinc-900 px-2 py-0.5 rounded-full">{components.length}</span>
                        </h2>
                        {components.length === 0 ? (
                           <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                               No components saved. Create them in the editor.
                           </div>
                        ) : (
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                               {components.map(comp => (
                                   <div key={comp.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 group hover:border-zinc-600 transition-all">
                                       <div className="aspect-square bg-zinc-950 rounded border border-zinc-800/50 mb-3 flex items-center justify-center overflow-hidden relative">
                                            {/* Mini Render of the Component */}
                                            <div 
                                                className="scale-[0.4] origin-center"
                                                style={{
                                                    width: comp.element.width,
                                                    height: comp.element.height,
                                                    backgroundColor: comp.element.style?.backgroundColor || 'transparent',
                                                    color: comp.element.style?.color,
                                                    borderRadius: comp.element.style?.borderRadius,
                                                    border: comp.element.style?.borderWidth ? `${comp.element.style.borderWidth}px solid ${comp.element.style.borderColor}` : 'none',
                                                    boxShadow: comp.element.style?.boxShadow,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {comp.element.type === 'text' && <span className="text-3xl whitespace-nowrap">{comp.element.content || 'Aa'}</span>}
                                                {comp.element.type === 'image' && <ImageIcon size={48} className="text-zinc-600" />}
                                            </div>
                                       </div>
                                       <div className="text-xs font-bold text-zinc-300 truncate">{comp.name}</div>
                                       <div className="text-[10px] text-zinc-500">{comp.element.width}x{comp.element.height}</div>
                                   </div>
                               ))}
                           </div>
                        )}
                   </div>
               )}

               {/* --- NEW PROJECT WIZARD --- */}
               {activeTab === 'new' && (
                   <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                       <h2 className="text-3xl font-light mb-2">Initialize Project</h2>
                       <p className="text-zinc-500 mb-12">Define the constraints of your canvas before you begin.</p>

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                           {/* Left Column: Details */}
                           <div className="space-y-8">
                               <div>
                                   <label className="block text-sm font-medium text-zinc-300 mb-2">Project Name</label>
                                   <input 
                                      type="text" 
                                      placeholder="e.g. Summer Campaign 2024"
                                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                      value={newProjectName}
                                      onChange={(e) => setNewProjectName(e.target.value)}
                                      autoFocus
                                   />
                               </div>

                               <div>
                                   <label className="block text-sm font-medium text-zinc-300 mb-4">Start from Preset</label>
                                   <div className="grid grid-cols-2 gap-3 mb-6">
                                       {ARTBOARD_PRESETS.map((preset, idx) => (
                                           <button
                                              key={idx}
                                              onClick={() => handlePresetSelect(idx)}
                                              className={`
                                                flex flex-col items-start p-3 rounded-lg border transition-all
                                                ${selectedPreset === idx 
                                                    ? 'bg-blue-600/10 border-blue-500 text-blue-100' 
                                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800'}
                                              `}
                                           >
                                               <span className="text-xs font-bold uppercase tracking-wider mb-1">{preset.name}</span>
                                               <span className="text-[10px] opacity-60 font-mono">{preset.label}</span>
                                           </button>
                                       ))}
                                   </div>

                                   <label className="block text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                                       <div className={`w-3 h-3 rounded-full border border-zinc-500 ${selectedPreset === null ? 'bg-blue-500 border-blue-500' : ''}`} />
                                       Or Define Custom Size
                                   </label>
                                   
                                   <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 grid grid-cols-2 gap-4 transition-all ${selectedPreset !== null ? 'opacity-50 grayscale' : 'opacity-100'}`} onClick={() => setSelectedPreset(null)}>
                                       <div>
                                           <label className="block text-xs text-zinc-500 mb-1">Width (px)</label>
                                           <input 
                                              type="number" 
                                              value={customWidth}
                                              onChange={(e) => { setCustomWidth(parseInt(e.target.value)); setSelectedPreset(null); }}
                                              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white font-mono focus:border-blue-500 outline-none" 
                                           />
                                       </div>
                                       <div>
                                           <label className="block text-xs text-zinc-500 mb-1">Height (px)</label>
                                           <input 
                                              type="number" 
                                              value={customHeight}
                                              onChange={(e) => { setCustomHeight(parseInt(e.target.value)); setSelectedPreset(null); }}
                                              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white font-mono focus:border-blue-500 outline-none" 
                                           />
                                       </div>
                                   </div>
                               </div>
                           </div>

                           {/* Right Column: Confirmation */}
                           <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 flex flex-col">
                               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-6">Configuration Summary</h3>
                               
                               <div className="space-y-4 mb-8">
                                   <div className="flex justify-between border-b border-zinc-800 pb-2">
                                       <span className="text-sm text-zinc-400">Dimensions</span>
                                       <span className="text-sm text-white font-mono">{customWidth} x {customHeight}</span>
                                   </div>
                                   <div className="flex justify-between border-b border-zinc-800 pb-2">
                                       <span className="text-sm text-zinc-400">Grid System</span>
                                       <span className="text-sm text-white">12 Column (Auto)</span>
                                   </div>
                                   <div className="flex justify-between border-b border-zinc-800 pb-2">
                                       <span className="text-sm text-zinc-400">Color Profile</span>
                                       <span className="text-sm text-white">sRGB</span>
                                   </div>
                                   <div className="flex justify-between border-b border-zinc-800 pb-2">
                                       <span className="text-sm text-zinc-400">System</span>
                                       <span className="text-sm text-white">Brew & Bean Master</span>
                                   </div>
                               </div>

                               <div className="mt-auto">
                                   <button 
                                      onClick={handleCreateClick}
                                      className="w-full py-4 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                   >
                                       Launch Workspace <ArrowRight size={16} />
                                   </button>
                               </div>
                           </div>
                       </div>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};