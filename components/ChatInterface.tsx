import React, { useState, useRef, useEffect } from 'react';
import { initializePersonaChat } from '../services/geminiService';
import { GenerateContentResponse, Chat } from "@google/genai";

interface ChatInterfaceProps {
    persona: {
        name: string;
        bio: string;
        archetype: string;
    };
    onClose: () => void;
}

interface Message {
    sender: 'user' | 'model';
    text: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ persona, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'model', text: `You've unlocked a connection with ${persona.name}. Say hello.` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Chat on mount
    useEffect(() => {
        try {
            const chat = initializePersonaChat(persona);
            setChatSession(chat);
        } catch (e) {
            setMessages(prev => [...prev, { sender: 'model', text: "Connection error: API Key required." }]);
        }
    }, [persona]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || !chatSession) return;
        
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setIsTyping(true);

        try {
            const result: GenerateContentResponse = await chatSession.sendMessage({ message: userMsg });
            if (result.text) {
                setMessages(prev => [...prev, { sender: 'model', text: result.text as string }]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { sender: 'model', text: "..." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md bg-davinci-ink text-davinci-paper border border-davinci-gold shadow-2xl rounded-sm overflow-hidden flex flex-col h-[600px] relative">
                
                {/* Header */}
                <div className="p-4 border-b border-davinci-gold/30 flex justify-between items-center bg-black/20">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <div>
                            <h3 className="font-serif text-lg leading-none text-davinci-gold">{persona.name}</h3>
                            <p className="text-[9px] uppercase tracking-widest opacity-60">{persona.archetype}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
                </div>

                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-black/50 to-transparent">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 text-sm font-serif ${
                                msg.sender === 'user' 
                                ? 'bg-davinci-gold text-black rounded-l-lg rounded-tr-lg' 
                                : 'bg-white/10 text-white rounded-r-lg rounded-tl-lg border border-white/5'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white/10 px-3 py-2 rounded-full flex space-x-1 items-center">
                                <div className="w-1.5 h-1.5 bg-davinci-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-davinci-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-davinci-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-davinci-gold/30 bg-black/20">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..." 
                            className="flex-grow bg-white/5 border border-davinci-gold/30 p-3 text-sm text-white focus:border-davinci-gold outline-none rounded-sm font-serif placeholder:italic placeholder:opacity-30"
                            autoFocus
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="bg-davinci-gold text-black px-4 font-bold uppercase text-xs tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                        >
                            SEND
                        </button>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-[9px] text-gray-600 uppercase tracking-widest">
                            Warning: AI Persona can be unpredictable.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;