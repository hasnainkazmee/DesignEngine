
import React, { useState } from 'react';
import { X, Play, Plus, Code, Package, Terminal } from 'lucide-react';
import { PluginDefinition } from '../types';

interface PluginModalProps {
  onClose: () => void;
  onRun: (code: string) => void;
}

const SAMPLE_PLUGINS: PluginDefinition[] = [
    {
        id: 'wireframe-kickstart',
        name: 'Wireframe Kickstart',
        description: 'Instantly builds a standard Landing Page layout (Nav, Hero, Feature Grid).',
        author: 'Kazm Core',
        version: '1.2.1',
        code: `
// Access grid config from 'context'
const w = context.grid.width;
const m = context.grid.margin;
const contentW = w - (m*2);

// Nav Bar
kazm.create({ 
    type: 'box', 
    x: 0, 
    y: 0, 
    width: w, 
    height: 60, 
    style: { backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1 } 
});

// Hero Section
kazm.create({ 
    type: 'box', 
    x: 0, 
    y: 60, 
    width: w, 
    height: 400, 
    style: { backgroundColor: '#09090b' } 
});

// Hero Content
kazm.create({ 
    type: 'text', 
    x: m, 
    y: 180, 
    width: contentW * 0.6, 
    height: 80, 
    content: 'Design with Systemic Precision', 
    style: { fontSize: 64, fontWeight: '700', color: '#fff', lineHeight: 1.1 } 
});

kazm.create({ 
    type: 'text', 
    x: m, 
    y: 340, 
    width: contentW * 0.5, 
    height: 40, 
    content: 'The constraint-based workspace for professional systemic graphic design.', 
    style: { fontSize: 18, color: '#a1a1aa' } 
});

// CTA Button
kazm.create({ 
    type: 'box', 
    x: m, 
    y: 400, 
    width: 180, 
    height: 54, 
    style: { backgroundColor: '#2563EB', borderRadius: 6 } 
});
kazm.create({
    type: 'text',
    x: m + 40,
    y: 415,
    width: 100,
    height: 20,
    content: 'Get Started',
    style: { fontSize: 16, fontWeight: '600', color: '#fff' }
});

// Feature Grid (3 Cols)
const gap = 24;
const colW = (contentW - (gap*2)) / 3;
const startY = 550;

for(let i=0; i<3; i++) {
    const bx = m + (i*(colW+gap));
    kazm.create({ 
        type: 'box', 
        x: bx, 
        y: startY, 
        width: colW, 
        height: 240, 
        style: { backgroundColor: '#18181b', borderRadius: 12, borderColor: '#27272a', borderWidth: 1 } 
    });
    kazm.create({
        type: 'box',
        x: bx + 24,
        y: startY + 24,
        width: 48,
        height: 48,
        style: { backgroundColor: '#27272a', borderRadius: 8 }
    });
}

kazm.notify("Wireframe Generated");
        `
    },
    {
        id: 'modular-scale',
        name: 'Modular Scale Generator',
        description: 'Generates a typographic ramp based on a Major Third (1.25) ratio.',
        author: 'Kazm Core',
        version: '1.0',
        code: `
const base = 16;
const ratio = 1.25; // Major Third
const startX = 100;
let y = 100;

const labels = ['Body', 'H6', 'H5', 'H4', 'H3', 'H2', 'H1'];
const sizes = [];
for(let i=0; i<7; i++) {
    sizes.push(Math.round(base * Math.pow(ratio, i)));
}

// Create from largest to smallest
sizes.reverse().forEach((size, i) => {
    kazm.create({ 
        type: 'text', 
        x: startX, 
        y: y, 
        width: 800, 
        height: size * 1.5, 
        content: labels[6-i] + ' - The quick brown fox jumps over the lazy dog', 
        style: { 
            fontSize: size, 
            color: i === 6 ? '#a1a1aa' : '#fff', // Dim body text
            fontWeight: i < 3 ? '700' : '400',
            lineHeight: 1.2
        } 
    });
    y += (size * 1.3) + 24;
});

kazm.notify("Modular Scale Generated (Major Third)");
        `
    },
    {
        id: 'palette-ramp',
        name: 'Palette Ramp Generator',
        description: 'Select an object to generate 5 progressively darker shades.',
        author: 'Kazm Core',
        version: '1.0',
        code: `
const sel = kazm.getSelection();
if(sel.length !== 1) {
    kazm.notify("Please select exactly one element with a color.");
} else {
    const el = sel[0];
    const baseColor = el.style.backgroundColor || el.style.color;
    
    if(!baseColor) {
        kazm.notify("Selection has no base color.");
    } else {
        const w = 80;
        const h = 80;
        const gap = 16;
        const startX = el.x + el.width + 40;
        
        // Create 5 shades
        for(let i=1; i<=5; i++) {
            kazm.create({
                type: 'box',
                x: startX + ((w+gap) * (i-1)),
                y: el.y,
                width: w,
                height: h,
                style: {
                    backgroundColor: baseColor,
                    borderRadius: el.style.borderRadius,
                    // Use brightness filter to simulate shades without complex hex parsing
                    brightness: 100 - (i * 12),
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }
            });
        }
        kazm.notify("Generated 5-step shade ramp");
    }
}
        `
    },
    {
        id: 'grid-splitter',
        name: 'Grid Splitter',
        description: 'Splits the selected box into a 3x3 grid of smaller units.',
        author: 'Kazm Core',
        version: '1.0',
        code: `
const sel = kazm.getSelection();
if(sel.length !== 1 || sel[0].type !== 'box') {
    kazm.notify("Please select one box element.");
} else {
    const parent = sel[0];
    const gap = 12;
    const rows = 3;
    const cols = 3;
    
    const itemW = (parent.width - (gap * (cols - 1))) / cols;
    const itemH = (parent.height - (gap * (rows - 1))) / rows;
    
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            kazm.create({
                type: 'box',
                x: parent.x + (c * (itemW + gap)),
                y: parent.y + (r * (itemH + gap)),
                width: itemW,
                height: itemH,
                style: {
                    backgroundColor: parent.style.backgroundColor,
                    opacity: 0.8,
                    borderRadius: 4
                }
            });
        }
    }
    
    // Hide original
    kazm.update(parent.id, { style: { ...parent.style, opacity: 0 } });
    kazm.notify("Split into 3x3 Grid");
}
        `
    },
    {
        id: 'glassmorphism',
        name: 'Glassmorphism Generator',
        description: 'Applies frosted glass effect to selected elements.',
        author: 'System',
        version: '1.0',
        code: `
const selection = kazm.getSelection();
if (selection.length === 0) {
    kazm.notify("Select an element first.");
} else {
    selection.forEach(el => {
        kazm.update(el.id, {
            style: {
                ...el.style,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(16px)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                borderRadius: 24,
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
            }
        });
    });
    kazm.notify("Glassmorphism applied!");
}
        `
    }
];

export const PluginModal: React.FC<PluginModalProps> = ({ onClose, onRun }) => {
  const [activeTab, setActiveTab] = useState<'store' | 'editor'>('store');
  const [editorCode, setEditorCode] = useState(`// Access the 'kazm' API to interact with the workspace
// Available methods: 
// kazm.create({ type: 'box', x: 0, y: 0, ... })
// kazm.update(id, { ... })
// kazm.getSelection()
// kazm.notify("Hello World")

// Access state via 'context':
// context.grid.width
// context.system.colors

const count = 3;
for(let i=0; i<count; i++) {
   kazm.create({
      type: 'text',
      x: 100,
      y: 100 + (i * 60),
      width: 300,
      height: 40,
      content: "Generated Item " + (i+1),
      style: { 
         color: '#ffffff', 
         fontSize: 24 
      }
   });
}
kazm.notify("Custom Script Executed");
`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-[900px] h-[600px] flex overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Sidebar */}
        <div className="w-56 border-r border-zinc-800 bg-zinc-950 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package size={16} className="text-blue-500" /> Plugin Manager
                </h3>
            </div>
            
            <div className="p-2 space-y-1">
                 <button 
                    onClick={() => setActiveTab('store')}
                    className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${activeTab === 'store' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900'}`}
                 >
                    <Package size={14} /> Installed Plugins
                 </button>
                 <button 
                    onClick={() => setActiveTab('editor')}
                    className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${activeTab === 'editor' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900'}`}
                 >
                    <Code size={14} /> Code Editor
                 </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
             <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
                 <h2 className="font-semibold text-white">
                     {activeTab === 'store' && 'Plugin Library'}
                     {activeTab === 'editor' && 'Custom Script'}
                 </h2>
                 <button onClick={onClose} className="text-zinc-500 hover:text-white">
                     <X size={20} />
                 </button>
             </div>

             <div className="flex-1 overflow-hidden flex flex-col">
                 {activeTab === 'store' && (
                     <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-4">
                         {SAMPLE_PLUGINS.map(plugin => (
                             <div key={plugin.id} className="bg-zinc-950 border border-zinc-800 rounded p-4 group hover:border-zinc-700 transition-colors">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="w-10 h-10 bg-zinc-900 rounded flex items-center justify-center text-zinc-500 border border-zinc-800">
                                         <Terminal size={20} />
                                     </div>
                                     <button 
                                        onClick={() => { onRun(plugin.code); onClose(); }}
                                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded transition-colors"
                                     >
                                         <Play size={14} />
                                     </button>
                                 </div>
                                 <h3 className="font-bold text-zinc-200 text-sm mb-1">{plugin.name}</h3>
                                 <p className="text-zinc-500 text-xs leading-relaxed mb-3 min-h-[40px]">{plugin.description}</p>
                                 <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono border-t border-zinc-900 pt-3">
                                     <span>v{plugin.version}</span>
                                     <span>•</span>
                                     <span>{plugin.author}</span>
                                 </div>
                             </div>
                         ))}
                         
                         <button 
                            onClick={() => setActiveTab('editor')}
                            className="border border-dashed border-zinc-800 rounded p-4 flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 hover:bg-zinc-900/50 transition-colors"
                         >
                             <Plus size={24} className="mb-2 opacity-50" />
                             <span className="text-sm font-medium">Create New</span>
                         </button>
                     </div>
                 )}

                 {activeTab === 'editor' && (
                     <div className="flex flex-col h-full">
                         <div className="flex-1 relative bg-zinc-950">
                             <textarea 
                                value={editorCode}
                                onChange={(e) => setEditorCode(e.target.value)}
                                className="absolute inset-0 w-full h-full bg-transparent text-zinc-300 font-mono text-xs p-4 resize-none focus:outline-none"
                                spellCheck={false}
                             />
                         </div>
                         <div className="h-16 border-t border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between shrink-0">
                             <div className="text-[10px] text-zinc-500">
                                 Context: <span className="text-zinc-300 font-mono">kazm</span> object available
                             </div>
                             <button 
                                onClick={() => { onRun(editorCode); onClose(); }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded flex items-center gap-2 transition-colors"
                             >
                                 <Play size={14} /> Run Script
                             </button>
                         </div>
                     </div>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};
