import { render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { h } from 'preact';
import htm from 'htm';

import { GoogleGenAI, Chat } from "@google/genai";

const html = htm.bind(h);

declare var VANTA: any;
declare var THREE: any;
declare var marked: { parse: (text: string, options?: any) => string };
declare var hljs: any;

const API_KEY = process.env.API_KEY;

const VantaBackground = () => {
    const vantaRef = useRef(null);
    useEffect(() => {
        let vantaEffect;
        if (VANTA) {
            vantaEffect = VANTA.NET({
                el: vantaRef.current,
                THREE: THREE,
                mouseControls: true,
                touchControls: true,
                gyrocontrols: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                color: 0x6366f1,
                backgroundColor: 0x0a0a0a,
                points: 10.00,
                maxDistance: 22.00,
                spacing: 18.00
            });
        }
        return () => {
            if (vantaEffect) vantaEffect.destroy();
        };
    }, []);

    return html`<div id="vanta-bg" ref=${vantaRef} />`;
};

const Message = ({ message }) => {
    useEffect(() => {
        if (message.sender === 'bot') {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }, [message.text]);

    const createMarkup = (text) => {
        const parsedHtml = marked.parse(text, { gfm: true, breaks: true });
        return { __html: parsedHtml };
    };

    return html`
        <div class="message ${message.sender}">
            <div 
                class="message-content"
                dangerouslySetInnerHTML=${message.sender === 'bot' ? createMarkup(message.text) : null}
            >
                ${message.sender === 'user' ? message.text : null}
            </div>
        </div>
    `;
};


const ChatPage = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm a professional AI assistant. How can I help you today?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatHistoryRef = useRef(null);
    const chatRef = useRef<Chat | null>(null);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages]);
    
    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
            });
        } catch(e) {
            console.error(e);
            setMessages(prev => [...prev, { id: Date.now(), text: "Error: Could not initialize AI. Please check the API key.", sender: 'bot'}]);
        }
    }, []);

    const getCannedResponse = (prompt) => {
        const lowerCasePrompt = prompt.toLowerCase().trim();
        const ceoKeywords = ['ceo', 'kawin', 'founder'];
        const companyKeywords = ['company', 'integer.io', 'integer io'];

        if (ceoKeywords.some(kw => lowerCasePrompt.includes(kw))) {
            return `**📱 Connect With Kawin:**
 + 🌐 <a href="https://kawin-portfolio.netlify.app/" target="_blank" rel="noopener noreferrer">Personal Portfolio</a>
 + 💼 <a href="https://www.linkedin.com/in/kawin-m-s-570961285/" target="_blank" rel="noopener noreferrer">LinkedIn Profile</a>
 + 📸 <a href="https://www.instagram.com/https_kawin.19?igsh=MXZ0cmsxNWRucnVzNA==" target="_blank" rel="noopener noreferrer">Instagram @https_kawin.19</a>
 + 📺 <a href="https://www.youtube.com/@integer.io" target="_blank" rel="noopener noreferrer">YouTube Channel</a>

 + **🏢 His Company:**
 + 🌐 <a href="https://integer-io.netlify.app/" target="_blank" rel="noopener noreferrer">Visit Integer.IO</a>

 + 💬 **"Technology should empower, educate, and inspire. That's what we build at Integer.IO."** - Kawin M.S`;
        }

        if (companyKeywords.some(kw => lowerCasePrompt.includes(kw))) {
            return `🔗 <a href="https://integer-io.netlify.app/" target="_blank" rel="noopener noreferrer">Official Website</a>
 + 📧 <a href="mailto:integer.ai.io@gmail.com" target="_blank" rel="noopener noreferrer">Email: integer.ai.io@gmail.com</a>
 + 📸 <a href="https://www.instagram.com/integer.io/" target="_blank" rel="noopener noreferrer">Instagram @integer.io</a>
 + 💼 <a href="https://www.linkedin.com/company/integer-io-services/" target="_blank" rel="noopener noreferrer">LinkedIn Company Page</a>
 + 📺 <a href="https://www.youtube.com/@integer.io" target="_blank" rel="noopener noreferrer">YouTube Channel</a>

 + **👤 Meet Our Founder:**
 + 📱 <a href="https://kawin-portfolio.netlify.app/" target="_blank" rel="noopener noreferrer">Kawin M.S Portfolio</a>
 + 💼 <a href="https://www.linkedin.com/in/kawin-m-s-570961285/" target="_blank" rel="noopener noreferrer">LinkedIn Profile</a>
 + 📸 <a href="https://www.instagram.com/https_kawin.19?igsh=MXZ0cmsxNWRucnVzNA==" target="_blank" rel="noopener noreferrer">Instagram @https_kawin.19</a>

 + 🌟 **Join us in transforming education through technology!**`;
        }
        return null;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const cannedResponse = getCannedResponse(input);
        if (cannedResponse) {
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now() + 1, text: cannedResponse, sender: 'bot' }]);
                setIsLoading(false);
            }, 500);
            return;
        }

        try {
            if (!chatRef.current) {
                throw new Error("Chat not initialized");
            }
            const stream = await chatRef.current.sendMessageStream({ message: input });
            
            let fullResponse = '';
            const botMessageId = Date.now() + 1;
            setMessages(prev => [...prev, { id: botMessageId, text: '', sender: 'bot' }]);

            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId ? { ...msg, text: fullResponse } : msg
                ));
            }

        } catch (error) {
            console.error(error);
            const errorMessage = { id: Date.now() + 1, text: "Sorry, I encountered an error. Please try again.", sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return html`
        <div class="chat-page">
            <div class="chat-history" ref=${chatHistoryRef}>
                ${messages.map(msg => html`<${Message} key=${msg.id} message=${msg} />`)}
                ${isLoading && html`
                    <div class="message bot">
                        <div class="message-content">
                            <div class="loading-indicator">
                                Thinking
                                <div class="dot"></div>
                                <div class="dot"></div>
                                <div class="dot"></div>
                            </div>
                        </div>
                    </div>
                `}
            </div>
            <form class="chat-form" onSubmit=${handleSendMessage}>
                <input
                    type="text"
                    value=${input}
                    onInput=${(e) => setInput(e.currentTarget.value)}
                    placeholder="Ask me anything..."
                    disabled=${isLoading}
                    aria-label="Chat input"
                />
                <button type="submit" disabled=${isLoading}>Send</button>
            </form>
        </div>
    `;
};

const ContactPage = () => {
    return html`
        <div class="contact-page">
            <h1>Contact Us</h1>
            <p>
                We're always excited to connect with new people. Whether you have a question about our services, a project proposal, or just want to say hello, feel free to reach out.
            </p>
            <p>
                <strong>Email:</strong> <a href="mailto:integer.ai.io@gmail.com">integer.ai.io@gmail.com</a>
            </p>
            <p>
                You can also connect with us on our social platforms, which are linked in the chat when you ask about our company!
            </p>
        </div>
    `;
};

const App = () => {
    const [page, setPage] = useState('chat');

    const renderPage = () => {
        switch (page) {
            case 'chat':
                return html`<${ChatPage} />`;
            case 'contact':
                return html`<${ContactPage} />`;
            default:
                return html`<${ChatPage} />`;
        }
    };

    return html`
        <div class="app-container">
            <${VantaBackground} />
            <header>
                <nav>
                    <a 
                        href="#" 
                        onClick=${(e) => { e.preventDefault(); setPage('chat'); }} 
                        class=${page === 'chat' ? 'active' : ''}
                    >
                        Chat
                    </a>
                    <a 
                        href="#" 
                        onClick=${(e) => { e.preventDefault(); setPage('contact'); }}
                        class=${page === 'contact' ? 'active' : ''}
                    >
                        Contact
                    </a>
                </nav>
            </header>
            <main>
                ${renderPage()}
            </main>
        </div>
    `;
};

render(html`<${App} />`, document.getElementById('root'));
