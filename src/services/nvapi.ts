const DEEPSEEK_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const OPENROUTER_REFERER = import.meta.env.VITE_OPENROUTER_REFERER || 'https://chatz.io';
const OPENROUTER_TITLE = import.meta.env.VITE_OPENROUTER_TITLE || 'chatz.IO';

const mockAIResponses = [
  "That's an interesting question! Let me help you with that.",
  "I understand what you're asking. Here's my perspective on that topic.",
  "Great question! Let me provide you with some detailed information.",
  "I'd be happy to assist you with that. Here's what I can tell you:",
  "That's a thoughtful inquiry. Based on my knowledge, I can suggest:",
  "Excellent point! Let me break this down for you:",
  "I appreciate your question. Here's a comprehensive response:",
  "That's something I can definitely help with. Consider this approach:",
  "Interesting topic! Let me share some insights with you:",
  "Good question! Here's what I recommend based on current best practices!"
];

const getRandomDelay = () => Math.random() * 2000 + 1000;

export interface NvidiaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface NvidiaResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const SYSTEM_PROMPT = 'You are chatz.IO AI assistant developed by Kawin M.S, CEO/Founder of Integer.IO. Provide clear, concise, and friendly responses to help students with their studies. When providing code, format it properly with syntax highlighting. When asked for current time or date, provide the current local time and date accurately. Use emojis appropriately to make responses engaging.';

const runBytezModel = async (modelId: string, messages: NvidiaMessage[]): Promise<string | null> => {
  try {
    const Bytez = (await import('bytez.js')).default;
    const sdk = new Bytez('3ceb04d07605dab312be7e2d62f2c5d1');
    const model = sdk.model(modelId);

    const formattedMessages = [
      {
        role: 'system' as const,
        content: SYSTEM_PROMPT,
      },
      ...messages,
    ];

    const result = await model.run(formattedMessages);

    if (result.error) {
      console.error(`${modelId} error:`, result.error);
      return null;
    }

    if (result.output && typeof result.output === 'string' && result.output.trim()) {
      return result.output.trim();
    }

    console.warn(`${modelId} returned empty output`, result);
  } catch (error) {
    console.error(`${modelId} invocation failed:`, error);
  }
  return null;
};

const callDeepSeek = async (messages: NvidiaMessage[]): Promise<string | null> => {
  try {
    if (!DEEPSEEK_API_KEY) {
      console.error('DeepSeek API key is not configured.');
      return null;
    }

    const deepSeekResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'HTTP-Referer': OPENROUTER_REFERER,
        'X-Title': OPENROUTER_TITLE,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: 2000, // Increased for better responses
      }),
    });

    if (deepSeekResponse.ok) {
      const deepSeekData = await deepSeekResponse.json();
      const response = deepSeekData.choices?.[0]?.message?.content;
      if (response && response.trim()) {
        return response.trim();
      }
    }

    if (deepSeekResponse.status === 404) {
      console.error('DeepSeek free model access is disabled. Update OpenRouter privacy settings to allow free model usage.');
    }

    console.warn('DeepSeek returned empty response', await deepSeekResponse.text());
  } catch (error) {
    console.error('DeepSeek API error:', error);
  }
  return null;
};

const callGroq = async (messages: NvidiaMessage[]): Promise<string | null> => {
  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: 2000, // Increased for better responses
      }),
    });

    if (groqResponse.ok) {
      const groqData = await groqResponse.json();
      const response = groqData.choices?.[0]?.message?.content;
      if (response && response.trim()) {
        return response.trim();
      }
    }

    console.warn('Groq returned empty response', await groqResponse.text());
  } catch (error) {
    console.error('Groq API error:', error);
  }
  return null;
};

export const sendToNvidiaAPI = async (
  messages: NvidiaMessage[],
  selectedModel: 'int' | 'int.go' | 'int.do' = 'int'
): Promise<string> => {
  // Ensure all messages have the role property
  const validMessages = messages.map(msg => ({
    role: msg.role || 'user',
    content: msg.content
  }));
  
  const lastUserMessage = validMessages[validMessages.length - 1]?.content || 'Hello';

  if (selectedModel === 'int.do') {
    const deepSeekResponse = await callDeepSeek(validMessages);
    if (deepSeekResponse) {
      console.log('✅ DeepSeek API success');
      return deepSeekResponse;
    }
  }

  if (selectedModel === 'int.go') {
    const groqResponse = await callGroq(validMessages);
    if (groqResponse) {
      console.log('✅ Groq API success');
      return groqResponse;
    }
  }

  if (selectedModel === 'int') {
    const providers = [
      { name: 'DeepSeek', handler: callDeepSeek },
      { name: 'Groq', handler: callGroq },
    ];

    const shuffledProviders = providers
      .map(provider => ({ provider, sortKey: Math.random() }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(entry => entry.provider);

    for (const provider of shuffledProviders) {
      const response = await provider.handler(validMessages);
      if (response) {
        console.log(`✅ ${provider.name} response used for default int model`);
        return response;
      }
    }
  }

  console.log('Using smart fallback responses');
  return generateSmartResponse(lastUserMessage);
};

const generateSmartResponse = (userInput: string): string => {
  const input = userInput.toLowerCase();

  if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
    return "👋 Hello! How can I help you with your studies today?";
  } else if (input.includes('good morning')) {
    return "🌅 Good morning! How can I assist you today?";
  } else if (input.includes('good afternoon')) {
    return "☀️ Good afternoon! What can I help you with?";
  } else if (input.includes('good evening')) {
    return "🌆 Good evening! How may I assist you?";
  } else if (input.includes('bye') || input.includes('goodbye')) {
    return "👋 Goodbye! Have a great day!";
  } else if (input.includes('help') || input.includes('assist')) {
    return "🤝 I'm here to help! You can ask me questions about various topics including:\n\n• 💻 Programming & Code\n• 📚 Study Materials\n• 🔍 Research & Information\n• 🧮 Math & Calculations\n\nFeel free to ask anything!";
  } else if (input.includes('code') || input.includes('programming')) {
    return "💻 I'd be happy to help with coding questions! Whether you need help with JavaScript, Python, React, or other programming topics, feel free to ask.\n\n```javascript\n// Example: Simple function\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('Student'));\n```";
  } else if (input.includes('weather')) {
    return "🌤️ I don't have access to real-time weather data, but I can suggest checking a reliable weather service like Weather.com or your local weather app for current conditions.";
  } else if (input.includes('time') || input.includes('date')) {
    const now = new Date();
    return `⏰ The current time is ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}. How can I help you further?`;
  } else if (input.includes('who are you') || input.includes('what are you') || input.includes('tell about you') || input.includes('tell me about yourself')) {
    return "🤖 I'm <strong>Chatz.IO</strong>, your friendly AI assistant developed by <strong>Kawin M.S</strong>, CEO/Founder of <a href='https://integer-io.netlify.app/' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>Integer.IO</a>. I'm here to help students with their studies, homework, and academic questions!";
  } else if (input.includes('who developed') || input.includes('developer') || input.includes('who made') || input.includes('who created')) {
    return "👨‍💼 I am chatz.IO AI assistant developed by **Kawin M.S**, CEO/Founder of <a href='https://integer-io.netlify.app/' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>Integer.IO</a>";
  } else if (input.includes('how are you') || input.includes('how r u')) {
    return "😊 I am chatz.IO AI assistant developed by **Kawin M.S**, CEO/Founder of <a href='https://integer-io.netlify.app/' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>Integer.IO</a>. I'm functioning well and ready to help you with your studies!";
  } else if (input.includes('company details') || input.includes('company info') || input.includes('about integer')) {
    return `🏢 **Integer.IO Company Details:**

- 🌐 **Website:** <a href='https://integer-io.netlify.app/' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>Integer.IO</a>
- 📸 **Instagram:** <a href='https://www.instagram.com/integer.io/' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>@integer.io</a>
- 📺 **YouTube:** <a href='https://www.youtube.com/@IntegerIO' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>IntegerIO Channel</a>
- 💼 **LinkedIn:** <a href='https://www.linkedin.com/company/integer-io/' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>Integer.IO LinkedIn</a>

Integer.IO is an innovative AI education technology company focused on helping students excel in their studies.`;
  } else if (input.includes('ceo details') || input.includes('founder details') || input.includes('about kawin') || input.includes('who is kawin')) {
    return `👨‍💼 **Kawin M.S - CEO/Founder Details:**

- 🌐 **Portfolio:** <a href='https://kawinms.netlify.app/' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>kawinms.netlify.app</a>
- 📸 **Instagram:** <a href='https://www.instagram.com/kawin_m_s/' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>@kawin_m_s</a>
- 💼 **LinkedIn:** <a href='https://www.linkedin.com/in/kawin-m-s/' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>Kawin M.S LinkedIn</a>

Kawin M.S is an innovative entrepreneur and technologist dedicated to transforming education through AI technology.`;
  } else if (input.includes('chatz') || input.includes('io')) {
    return "🤖 chatz.IO is an AI study assistant platform created by <a href='https://integer-io.netlify.app/' target='_blank' rel='noopener noreferrer' style='color: #10b981; text-decoration: none; font-weight: 600;'>Integer.IO</a>. I'm here to help students with homework, exam prep, and more!";
  } else if (/^\s*\d+\s*[\+\-\*\/]\s*\d+\s*$/.test(input)) {
    try {
      const result = eval(input);
      return `🧮 The result is **${result}**.`;
    } catch {
      return "❌ Sorry, I couldn't calculate that.";
    }
  } else if (input.includes('joke') || input.includes('funny')) {
    const jokes = [
      "😄 Why don't scientists trust atoms? Because they make up everything!",
      "🍝 What do you call fake spaghetti? An impasta!",
      "🌾 Why did the scarecrow win an award? Because he was outstanding in his field!"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  } else if (input.includes('thank') || input.includes('thanks')) {
    return "😊 You're welcome! I'm glad I could help. Feel free to ask if you have any other questions!";
  } else {
    const responses = [
      `💡 That's an interesting question about "${userInput.substring(0, 30)}${userInput.length > 30 ? '...' : ''}". Let me help you with that!`,
      `🤔 I understand you're asking about "${userInput.substring(0, 30)}${userInput.length > 30 ? '...' : ''}". Here's what I can tell you:`,
      `✨ Great question! Regarding "${userInput.substring(0, 30)}${userInput.length > 30 ? '...' : ''}", I'd be happy to assist you.`,
      `📚 Thanks for asking about "${userInput.substring(0, 30)}${userInput.length > 30 ? '...' : ''}". Based on your question, I can provide some insights.`,
      `🎯 I appreciate your question about "${userInput.substring(0, 30)}${userInput.length > 30 ? '...' : ''}". Let me share some helpful information with you.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
};