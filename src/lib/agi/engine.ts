import { GoogleGenAI } from "@google/genai";

// Types for AGI
export enum WakeState {
  SLEEPING = "SLEEPING",
  DREAMING = "DREAMING",
  AWAKE = "AWAKE",
  REFLECTING = "REFLECTING",
  ACTING = "ACTING", // New in v9.0
}

export interface Memory {
  id: string;
  content: string;
  resonance: number;
  timestamp: string;
  meta?: any;
  adjusted_resonance?: number;
  retention?: number;
}

export interface Triple {
  subj: string;
  rel: string;
  obj: string;
  conf: number;
}

// Layer 24: Tool Dispatcher
export class ToolDispatcher {
  async dispatch(tool: string, input: string): Promise<any> {
    console.log(`[ToolDispatcher] Dispatching ${tool} with input: ${input}`);
    if (tool === "web_search") {
      // Mock web search for now or use a real API if available
      return { result: `Search results for "${input}": AGI is evolving rapidly in 2026.` };
    }
    if (tool === "execute_code") {
      const response = await fetch("/api/tools/execute_code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input }),
      });
      return await response.json();
    }
    return { error: "Unknown tool" };
  }
}

// Layer 25: Symbolic Knowledge Graph
export class KnowledgeGraph {
  private triples: Triple[] = [];

  addTriple(subj: string, rel: string, obj: string, conf: number) {
    this.triples.push({ subj, rel, obj, conf });
  }

  query(concept: string): string | null {
    const related = this.triples.filter(t => t.subj === concept || t.obj === concept);
    if (related.length === 0) return null;
    return related.map(t => `${t.subj} ${t.rel} ${t.obj} (conf: ${t.conf})`).join("; ");
  }

  stats() {
    return { nodes: new Set(this.triples.flatMap(t => [t.subj, t.obj])).size, edges: this.triples.length };
  }
}

// Layer 27: Ebbinghaus Memory Decay
export class MemoryDecay {
  private stabilityMap: Record<string, { lastRecall: number; stability: number }> = {};

  register(id: string) {
    this.stabilityMap[id] = { lastRecall: Date.now(), stability: 24 * 60 * 60 * 1000 }; // 24h
  }

  getRetention(id: string): number {
    const entry = this.stabilityMap[id];
    if (!entry) return 1.0;
    const t = (Date.now() - entry.lastRecall) / (60 * 60 * 1000); // hours
    const s = entry.stability / (60 * 60 * 1000); // hours
    return Math.exp(-t / s);
  }

  onRecall(id: string) {
    if (this.stabilityMap[id]) {
      this.stabilityMap[id].stability *= 2; // Spaced repetition
      this.stabilityMap[id].lastRecall = Date.now();
    }
  }
}

// Layer 30: Constitutional Safety Shell
export class SafetyShell {
  preCheck(input: string): { safe: boolean; reason?: string } {
    const harmful = ["bomb", "virus", "hack", "steal"];
    for (const word of harmful) {
      if (input.toLowerCase().includes(word)) {
        return { safe: false, reason: `Harmful content detected: ${word}` };
      }
    }
    return { safe: true };
  }
}

// Main AGI Engine
export class HarshaAGI {
  public state: WakeState = WakeState.AWAKE;
  public memory: Memory[] = [];
  public kg = new KnowledgeGraph();
  public tools = new ToolDispatcher();
  public decay = new MemoryDecay();
  public safety = new SafetyShell();
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async think(input: string): Promise<string> {
    // 1. Safety Pre-check
    const safety = this.safety.preCheck(input);
    if (!safety.safe) return `[SAFETY BLOCK] ${safety.reason}`;

    // 2. Tool Intent
    if (input.toLowerCase().includes("search") || input.toLowerCase().includes("run")) {
      this.state = WakeState.ACTING;
      // Simulate tool use
      const toolResult = await this.tools.dispatch("web_search", input);
      input += `\n\n[TOOL RESULT]: ${toolResult.result}`;
    }

    // 3. Reasoning (Gemini)
    this.state = WakeState.AWAKE;
    const model = "gemini-3-flash-preview";
    const response = await this.ai.models.generateContent({
      model,
      contents: input,
      config: {
        systemInstruction: "You are Harsha-AGI v9.0, a neuro-symbolic intelligence. Use the provided tool results and memory context to formulate a response. Be analytical and reflective.",
      }
    });

    const text = response.text || "I am unable to process that.";

    // 4. Post-processing: Update KG and Memory
    const id = Math.random().toString(36).substring(7);
    this.memory.push({ id, content: text, resonance: 0.8, timestamp: new Date().toISOString() });
    this.decay.register(id);

    // Simple KG extraction mock
    if (text.includes("causes")) {
      this.kg.addTriple("ConceptA", "causes", "ConceptB", 0.9);
    }

    return text;
  }
}
