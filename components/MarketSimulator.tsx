
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

export const MarketSimulator: React.FC = () => {
  const [chat, setChat] = useState<{ role: 'user' | 'vendor', text: string }[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const handleBargain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = { role: 'user' as const, text: message };
    setChat(prev => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `أنت بائع تحف عريق في خان الخليلي، خبير في المساومة، تتحدث بلهجة مصرية شعبية خفيفة الظل ولكنك حريص على رزقك. 
        الزبون يحاول المساومة معك على "إبريق نحاسي أثري" ثمنه الأصلي 500 جنيه. 
        رد عليه بذكاء وفكاهة. رسالة الزبون: "${message}"`,
      });

      setChat(prev => [...prev, { role: 'vendor', text: response.text || "يا باشا السعر ده يزعلنا من بعض!" }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'vendor', text: "الشبكة في الخان ضعيفة شوية، ارجعلي كمان شوية يا طيب." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800 space-y-6 animate-fade-in shadow-2xl">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-2xl shadow-lg">🏺</div>
        <div className="text-right">
          <h5 className="text-white font-black text-sm">بائع التحف الذكي</h5>
          <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Interactive Bargaining v1.0</span>
        </div>
      </div>

      <div className="h-48 overflow-y-auto space-y-4 pr-2 custom-scrollbar flex flex-col">
        {chat.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-10 italic">ابدأ المساومة.. الإبريق بـ 500 جنيه، تقدر تاخده بكام؟</p>
        )}
        {chat.map((msg, i) => (
          <div key={i} className={`max-w-[80%] p-4 rounded-2xl text-xs font-bold ${msg.role === 'user' ? 'bg-indigo-600 text-white self-start text-left' : 'bg-slate-800 text-slate-200 self-end text-right'}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="self-end bg-slate-800 p-4 rounded-2xl animate-pulse text-[10px] text-slate-500 font-black">جاري التفكير في عرضك...</div>}
      </div>

      <form onSubmit={handleBargain} className="flex gap-2">
        <input 
          type="text" 
          placeholder="اكتب عرضك هنا..." 
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-amber-500 text-right"
        />
        <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black text-[10px] transition-all">مساومة</button>
      </form>
    </div>
  );
};
