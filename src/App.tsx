import React, { useState, useEffect, useRef } from 'react';
import { HarshaAGI, WakeState, Memory } from './lib/agi/engine';
import { 
  Brain, 
  Zap, 
  Database, 
  ShieldAlert, 
  Activity, 
  MessageSquare, 
  Terminal, 
  Search,
  Cpu,
  Layers,
  History,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'agi'; content: string }[]>([]);
  const [agi, setAgi] = useState<HarshaAGI | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [stats, setStats] = useState({
    memoryCount: 0,
    kgNodes: 0,
    kgEdges: 0,
    state: WakeState.AWAKE,
    confidence: 0.95
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      setAgi(new HarshaAGI(apiKey));
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !agi) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    try {
      const response = await agi.think(userMsg);
      setMessages(prev => [...prev, { role: 'agi', content: response }]);
      
      // Update stats
      setStats({
        memoryCount: agi.memory.length,
        kgNodes: agi.kg.stats().nodes,
        kgEdges: agi.kg.stats().edges,
        state: agi.state,
        confidence: Math.random() * 0.2 + 0.8 // Simulated confidence
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'agi', content: "Error in cognitive processing." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono selection:bg-[#F27D26] selection:text-black">
      {/* Header / Status Bar */}
      <header className="border-b border-[#222] p-4 flex justify-between items-center bg-[#0d0d0d] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F27D26] rounded flex items-center justify-center text-black">
            <Brain size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tighter uppercase">Harsha-AGI <span className="text-[#F27D26]">v9.0</span></h1>
            <p className="text-[10px] opacity-50 uppercase tracking-widest">Floor 8: Action & Truth Engine</p>
          </div>
        </div>
        
        <div className="flex gap-6 items-center">
          <div className="flex flex-col items-end">
            <span className="text-[10px] opacity-40 uppercase">Wake State</span>
            <span className={`text-xs font-bold ${stats.state === WakeState.ACTING ? 'text-blue-400' : 'text-[#F27D26]'}`}>
              {stats.state}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-[#222]" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] opacity-40 uppercase">Confidence</span>
            <span className="text-xs font-bold">{(stats.confidence * 100).toFixed(1)}%</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[1fr_350px] h-[calc(100vh-73px)]">
        {/* Chat Area */}
        <div className="flex flex-col border-r border-[#222] relative overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                <Cpu size={64} />
                <p className="max-w-xs text-sm italic">
                  "I am Harsha-AGI. I am currently in a state of wakeful readiness. 
                  Awaiting input to initiate cognitive cycles."
                </p>
              </div>
            )}
            
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded border ${
                    msg.role === 'user' 
                      ? 'bg-[#111] border-[#333] text-white' 
                      : 'bg-[#1a1a1a] border-[#F27D26]/30 text-[#ccc]'
                  }`}>
                    <div className="flex items-center gap-2 mb-2 opacity-40 text-[10px] uppercase tracking-widest">
                      {msg.role === 'user' ? <History size={12} /> : <Zap size={12} />}
                      {msg.role === 'user' ? 'User Input' : 'AGI Response'}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] border border-[#F27D26]/20 p-4 rounded animate-pulse flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#F27D26] rounded-full animate-bounce" />
                  <span className="text-xs opacity-50 uppercase tracking-widest">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[#222] bg-[#0d0d0d]">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Enter command or query..."
                className="w-full bg-[#111] border border-[#333] rounded p-4 pr-12 text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
              />
              <button 
                onClick={handleSend}
                disabled={isThinking}
                className="absolute right-2 p-2 text-[#F27D26] hover:bg-[#F27D26] hover:text-black rounded transition-all disabled:opacity-30"
              >
                <Terminal size={20} />
              </button>
            </div>
            <div className="mt-2 flex gap-4 text-[9px] opacity-30 uppercase tracking-tighter">
              <span>[CMD] search: &lt;query&gt;</span>
              <span>[CMD] run: &lt;code&gt;</span>
              <span>[CMD] status</span>
            </div>
          </div>
        </div>

        {/* Sidebar / Internal State */}
        <aside className="bg-[#0d0d0d] overflow-y-auto p-6 space-y-8">
          {/* Cognitive Layers */}
          <section>
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <Layers size={16} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Active Layers</h2>
            </div>
            <div className="space-y-2">
              {[
                { id: 24, name: 'Tool Dispatcher', status: stats.state === WakeState.ACTING ? 'ACTIVE' : 'IDLE' },
                { id: 25, name: 'Symbolic KG', status: 'SYNCED' },
                { id: 26, name: 'Hallucination Det.', status: 'MONITORING' },
                { id: 27, name: 'Memory Decay', status: 'DECAYING' },
                { id: 30, name: 'Constitutional Safety', status: 'GUARDED' },
              ].map(layer => (
                <div key={layer.id} className="flex justify-between items-center p-2 bg-[#111] border border-[#222] rounded text-[10px]">
                  <span className="opacity-40">L{layer.id}</span>
                  <span className="font-bold">{layer.name}</span>
                  <span className={`px-1 rounded ${
                    layer.status === 'ACTIVE' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'
                  }`}>
                    {layer.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Memory Stats */}
          <section>
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <Database size={16} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Memory Matrix</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111] p-3 border border-[#222] rounded">
                <span className="text-[10px] opacity-40 block uppercase mb-1">Episodic</span>
                <span className="text-xl font-bold text-[#F27D26]">{stats.memoryCount}</span>
              </div>
              <div className="bg-[#111] p-3 border border-[#222] rounded">
                <span className="text-[10px] opacity-40 block uppercase mb-1">KG Triples</span>
                <span className="text-xl font-bold text-[#F27D26]">{stats.kgEdges}</span>
              </div>
            </div>
          </section>

          {/* Real-time Activity */}
          <section>
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <Activity size={16} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Neural Activity</h2>
            </div>
            <div className="h-24 bg-[#111] border border-[#222] rounded relative overflow-hidden">
              <div className="absolute inset-0 flex items-end gap-[2px] p-2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: `${Math.random() * 80 + 10}%` }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                    className="flex-1 bg-[#F27D26]/40 rounded-t"
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Safety Guardrails */}
          <section className="p-4 bg-red-900/10 border border-red-900/30 rounded">
            <div className="flex items-center gap-2 mb-2 text-red-400">
              <ShieldAlert size={16} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Safety Shell</h2>
            </div>
            <p className="text-[10px] opacity-60 leading-tight">
              Constitutional alignment active. All outputs filtered for benevolence and honesty.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
}
