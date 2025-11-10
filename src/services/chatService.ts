import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { Message, ChatSession } from '@/types/chat';
import { sendToNvidiaAPI, NvidiaMessage } from './nvapi';

// HTML entity decoder with extended support
const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®');
};

// Enhanced web search function with comprehensive website database
const searchOnline = async (query: string): Promise<string> => {
  try {
    // Check if query is about a specific website
    const websiteMatch = query.match(/tell\s+(me\s+)?(about|information|details|facts)\s+(on|about)?\s+([a-zA-Z0-9\s]+)(\s+website)?/i);
    const websiteDirectMatch = query.match(/what\s+is\s+([a-zA-Z0-9\s.]+)(\s+website)?/i);

    if (websiteMatch || websiteDirectMatch) {
      const websiteName = (websiteMatch ? websiteMatch[4] : websiteDirectMatch ? websiteDirectMatch[1] : '').trim().toLowerCase();

      // Comprehensive website database with detailed information
      const websites: Record<string, { 
        name: string; 
        url: string; 
        description: string; 
        category: string;
        features?: string[];
      }> = {
        'wikipedia': {
          name: 'Wikipedia',
          url: 'https://www.wikipedia.org/',
          description: 'Wikipedia is a free online encyclopedia created and edited by volunteers around the world. It contains information on virtually any topic and is available in multiple languages.',
          category: 'Education & Reference',
          features: ['Free content', 'Multiple languages', 'Community-edited', 'Extensive articles']
        },
        'google': {
          name: 'Google',
          url: 'https://www.google.com/',
          description: 'Google is the world\'s most popular search engine, helping users find information, images, videos, and other content across the web. It also offers various services like Gmail, Google Drive, and Google Maps.',
          category: 'Search Engine',
          features: ['Web search', 'Gmail', 'Google Drive', 'Google Maps', 'YouTube']
        },
        'youtube': {
          name: 'YouTube',
          url: 'https://www.youtube.com/',
          description: 'YouTube is a video-sharing platform where users can watch, like, share, comment and upload their own videos. It offers a wide variety of user-generated and corporate media content.',
          category: 'Video Streaming',
          features: ['Video sharing', 'Live streaming', 'Subscriptions', 'Monetization']
        },
        'facebook': {
          name: 'Facebook',
          url: 'https://www.facebook.com/',
          description: 'Facebook is a social networking site that allows users to connect with friends, family, and other people they know, share photos, videos, and updates about their lives.',
          category: 'Social Media',
          features: ['Social networking', 'Photo sharing', 'Groups', 'Marketplace', 'Messenger']
        },
        'twitter': {
          name: 'Twitter (X)',
          url: 'https://twitter.com/',
          description: 'Twitter (now X) is a social networking service where users post and interact with messages known as "tweets". It\'s known for its real-time, short-form communication.',
          category: 'Social Media',
          features: ['Microblogging', 'Real-time updates', 'Trending topics', 'Direct messaging']
        },
        'instagram': {
          name: 'Instagram',
          url: 'https://www.instagram.com/',
          description: 'Instagram is a photo and video sharing social networking service owned by Meta. Users can upload media that can be edited with filters and organized by hashtags and geographical tagging.',
          category: 'Social Media',
          features: ['Photo sharing', 'Stories', 'Reels', 'IGTV', 'Shopping']
        },
        'amazon': {
          name: 'Amazon',
          url: 'https://www.amazon.com/',
          description: 'Amazon is an online marketplace that sells a vast selection of products, from books and electronics to clothing and household items. It also offers services like Amazon Prime, AWS, and streaming.',
          category: 'E-commerce',
          features: ['Online shopping', 'Prime membership', 'AWS', 'Kindle', 'Alexa']
        },
        'netflix': {
          name: 'Netflix',
          url: 'https://www.netflix.com/',
          description: 'Netflix is a subscription-based streaming service that allows members to watch TV shows and movies on an internet-connected device without commercials.',
          category: 'Entertainment',
          features: ['Streaming', 'Original content', 'Multiple profiles', 'Offline viewing']
        },
        'linkedin': {
          name: 'LinkedIn',
          url: 'https://www.linkedin.com/',
          description: 'LinkedIn is a business and employment-oriented social media platform that works through websites and mobile apps. It\'s mainly used for professional networking and career development.',
          category: 'Professional Network',
          features: ['Professional networking', 'Job search', 'Company pages', 'Learning courses']
        },
        'reddit': {
          name: 'Reddit',
          url: 'https://www.reddit.com/',
          description: 'Reddit is a social news aggregation, web content rating, and discussion website. Registered members submit content such as links, text posts, images, and videos, which are then voted up or down by other members.',
          category: 'Social News',
          features: ['Communities (subreddits)', 'Upvoting/downvoting', 'AMAs', 'Discussion threads']
        },
        'github': {
          name: 'GitHub',
          url: 'https://github.com/',
          description: 'GitHub is a web-based hosting service for version control using Git. It is primarily used for computer code. It offers the distributed version control and source code management functionality of Git.',
          category: 'Development',
          features: ['Version control', 'Code hosting', 'Collaboration', 'CI/CD', 'Open source']
        },
        'stackoverflow': {
          name: 'Stack Overflow',
          url: 'https://stackoverflow.com/',
          description: 'Stack Overflow is a question and answer website for professional and enthusiast programmers. It features questions and answers on a wide range of topics in computer programming.',
          category: 'Development',
          features: ['Q&A format', 'Reputation system', 'Tags', 'Code snippets', 'Community moderation']
        },
        'medium': {
          name: 'Medium',
          url: 'https://medium.com/',
          description: 'Medium is an online publishing platform where amateur and professional people can publish their writing on any subject. It\'s known for its clean interface and high-quality content.',
          category: 'Publishing',
          features: ['Article publishing', 'Reading lists', 'Partner program', 'Publications']
        },
        'whatsapp': {
          name: 'WhatsApp',
          url: 'https://www.whatsapp.com/',
          description: 'WhatsApp is a free, cross-platform messaging service owned by Meta. It allows users to send text messages, voice messages, make voice and video calls, and share media and documents.',
          category: 'Messaging',
          features: ['Instant messaging', 'Voice/video calls', 'Groups', 'Status', 'End-to-end encryption']
        },
        'tiktok': {
          name: 'TikTok',
          url: 'https://www.tiktok.com/',
          description: 'TikTok is a short-form video hosting service where users can create and share videos up to 10 minutes long, often featuring music, filters, and creative effects.',
          category: 'Social Media',
          features: ['Short videos', 'Music integration', 'Filters & effects', 'For You page', 'Duets']
        },
        'spotify': {
          name: 'Spotify',
          url: 'https://www.spotify.com/',
          description: 'Spotify is a digital music streaming service that gives users access to millions of songs, podcasts, and playlists from artists all over the world.',
          category: 'Music Streaming',
          features: ['Music streaming', 'Podcasts', 'Playlists', 'Offline mode', 'Discover Weekly']
        },
        'discord': {
          name: 'Discord',
          url: 'https://discord.com/',
          description: 'Discord is a VoIP and instant messaging platform designed for creating communities. Users can communicate with voice calls, video calls, text messaging, and media sharing.',
          category: 'Communication',
          features: ['Voice channels', 'Text channels', 'Servers', 'Bots', 'Screen sharing']
        },
        'zoom': {
          name: 'Zoom',
          url: 'https://zoom.us/',
          description: 'Zoom is a cloud-based video conferencing service used for virtual meetings, webinars, and collaborative work. It became widely popular for remote work and online learning.',
          category: 'Video Conferencing',
          features: ['Video meetings', 'Webinars', 'Screen sharing', 'Breakout rooms', 'Recording']
        },
        'pinterest': {
          name: 'Pinterest',
          url: 'https://www.pinterest.com/',
          description: 'Pinterest is a visual discovery and bookmarking platform where users can find and save creative ideas through images and videos (called "pins") organized on boards.',
          category: 'Social Media',
          features: ['Visual bookmarking', 'Boards', 'Pins', 'Shopping', 'Idea discovery']
        }
      };

      // Check if we have information about the requested website
      for (const [key, site] of Object.entries(websites)) {
        if (websiteName.includes(key)) {
          let response = `🌐 **${site.name}**\n\n${site.description}\n\n📁 **Category:** ${site.category}\n`;
          
          if (site.features && site.features.length > 0) {
            response += `\n✨ **Key Features:**\n`;
            site.features.forEach(feature => {
              response += `• ${feature}\n`;
            });
          }
          
          response += `\n🔗 **Website:** <a href="${site.url}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">${site.url}</a>\n\n📱 You can visit ${site.name} directly by clicking the link above.`;
          
          return response;
        }
      }

      // If website not in our database, provide search links
      return `🔍 **Information about ${websiteName}**\n\n` +
        `I don't have specific details about ${websiteName} in my database, but you can find information through these search links:\n\n` +
        `🔗 <a href="https://www.google.com/search?q=${encodeURIComponent(websiteName + ' website')}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Search for ${websiteName} on Google</a>\n` +
        `🔗 <a href="https://www.bing.com/search?q=${encodeURIComponent(websiteName + ' website')}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Search for ${websiteName} on Bing</a>\n` +
        `🔗 <a href="https://www.duckduckgo.com/?q=${encodeURIComponent(websiteName + ' website')}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Search for ${websiteName} on DuckDuckGo</a>\n\n` +
        `Click the links above to get the most current and accurate information about ${websiteName}.`;
    }

    // For general search queries with enhanced options
    return `🔍 **Searching for: "${query}"**\n\n` +
      `I'm searching for the latest information online. Here are multiple search engines to help you:\n\n` +
      `🔗 <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Search on Google</a>\n` +
      `🔗 <a href="https://www.bing.com/search?q=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Search on Bing</a>\n` +
      `🔗 <a href="https://www.duckduckgo.com/?q=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Search on DuckDuckGo</a>\n` +
      `🔗 <a href="https://www.brave.com/search/?q=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Search on Brave</a>\n\n` +
      `💡 **Tip:** Click any link above to get the most current and accurate information about your query.`;
  } catch (error) {
    console.error('Error searching online:', error);
    return `❌ I apologize, but I'm unable to search for current information at the moment. Please try searching online directly for "${query}".`;
  }
};

// Firebase chat session management
export const saveChatSession = async (userId: string, messages: Message[]): Promise<string> => {
  try {
    const chatSessionData = {
      userId,
      title: messages[0]?.content.substring(0, 50) + '...' || 'New Chat',
      messages: messages.map(msg => ({
        ...msg,
        timestamp: serverTimestamp()
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'chatSessions'), chatSessionData);
    console.log('✅ Chat session saved:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving chat session:', error);
    throw error;
  }
};

export const updateChatSession = async (sessionId: string, messages: Message[]): Promise<void> => {
  try {
    const sessionRef = doc(db, 'chatSessions', sessionId);
    await updateDoc(sessionRef, {
      messages: messages.map(msg => ({
        ...msg,
        timestamp: serverTimestamp()
      })),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Chat session updated:', sessionId);
  } catch (error) {
    console.error('❌ Error updating chat session:', error);
    throw error;
  }
};

export const getUserChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatSession[];
    
    console.log(`✅ Retrieved ${sessions.length} chat sessions`);
    return sessions;
  } catch (error) {
    console.error('❌ Error getting chat sessions:', error);
    throw error;
  }
};

export const saveMessage = async (sessionId: string, message: Message): Promise<void> => {
  try {
    await addDoc(collection(db, 'messages'), {
      ...message,
      sessionId,
      timestamp: serverTimestamp()
    });
    console.log('✅ Message saved to session:', sessionId);
  } catch (error) {
    console.error('❌ Error saving message:', error);
    throw error;
  }
};

// Main AI response generator with enhanced features
export const generateAIResponse = async (
  messages: Message[],
  selectedModel: 'int' | 'int.go' | 'int.do' = 'int'
): Promise<string> => {
  try {
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content?.toLowerCase() || '';

    // Enhanced time query handling with multiple formats
    if ((userQuery.includes('time') || userQuery.includes('what is the time') || userQuery.includes('current time') || userQuery.includes('what time is it')) && !userQuery.includes('date')) {
      const now = new Date();
      const timeResponse = `⏰ **Current Time:**\n\n` +
        `🕐 The current time is **${now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })}**\n\n` +
        `🌍 **Timezone:** ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n` +
        `📅 **Day:** ${now.toLocaleDateString('en-US', { weekday: 'long' })}\n` +
        `🌐 **UTC Time:** ${now.toUTCString()}\n\n` +
        `💡 **Note:** This is your local time based on your device's timezone settings.`;
      return timeResponse;
    }

    // Enhanced date query handling with more information
    if ((userQuery.includes('date') || userQuery.includes('what is the date') || userQuery.includes('today') || userQuery.includes('current date') || userQuery.includes('what day is it')) && !userQuery.includes('time')) {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - startOfYear.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      
      const dateResponse = `📅 **Current Date:**\n\n` +
        `📆 Today is **${now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}**\n\n` +
        `🗓️ **Week:** Week ${Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)} of ${now.toLocaleDateString('en-US', { month: 'long' })}\n` +
        `📊 **Day of Year:** Day ${dayOfYear} of ${now.getFullYear()}\n` +
        `🌍 **Timezone:** ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n\n` +
        `💡 **Fun Fact:** ${365 - dayOfYear} days remaining in ${now.getFullYear()}!`;
      return dateResponse;
    }

    // Enhanced date and time query handling
    if ((userQuery.includes('date') && userQuery.includes('time')) || userQuery.includes('date and time') || userQuery.includes('current date and time')) {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - startOfYear.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      
      const dateTimeResponse = `📅 **Current Date & Time:**\n\n` +
        `🗓️ **Date:** ${now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}\n\n` +
        `⏰ **Time:** ${now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })}\n\n` +
        `🌍 **Timezone:** ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n` +
        `📊 **Day of Year:** Day ${dayOfYear} of ${now.getFullYear()}\n` +
        `🌐 **UTC:** ${now.toUTCString()}\n\n` +
        `🔍 **Need online time?** <a href="https://www.google.com/search?q=current+date+and+time" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Check Current Date & Time Online</a>`;
      return dateTimeResponse;
    }

    // Enhanced "who are you" response with more personality
    if (userQuery.includes('who are you') || userQuery.includes('what are you') || userQuery.includes('your name') || userQuery.includes('introduce yourself')) {
      return `🤖 **I am Chatz.IO - Your Professional AI Coding Assistant**\n\n` +
        `Hello! I'm your dedicated AI assistant, here to help you succeed in programming and technology. Think of me as your coding companion available 24/7!\n\n` +
        `**💼 What I Can Do For You:**\n\n` +
        `• **💻 Code Debugging** - Identify and fix errors efficiently\n` +
        `• **📚 Concept Explanation** - Break down complex topics clearly\n` +
        `• **🎯 Project Guidance** - Help structure and build applications\n` +
        `• **✨ Best Practices** - Share industry-standard approaches\n` +
        `• **🔍 Research Assistance** - Find relevant information quickly\n` +
        `• **📝 Documentation Help** - Write clear, professional docs\n` +
        `• **🧪 Testing Strategies** - Improve code quality and reliability\n` +
        `• **🚀 Performance Tips** - Optimize your applications\n\n` +
        `**👨‍💼 Created By:**\n` +
        `Developed by **Kawin M.S**, Founder & CEO of Integer.IO - a company dedicated to empowering developers with intelligent tools and innovative educational technology.\n\n` +
        `🌐 Learn more: <a href="https://integer-io.netlify.app/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Visit Integer.IO</a>\n\n` +
        `💬 **Let's start coding!** What would you like help with today?`;
    }

    // Enhanced developer/CEO queries with more detail
    if (userQuery.includes('who developed') || userQuery.includes('who created') || userQuery.includes('who made') || userQuery.includes('developer') || userQuery.includes('ceo') || userQuery.includes('founder')) {
      if (userQuery.includes('company') || userQuery.includes('organization') || userQuery.includes('integer')) {
        // Enhanced company details response
        return `🏢 **About Integer.IO - Building Tomorrow's Technology Today**\n\n` +
          `Integer.IO is a cutting-edge technology company revolutionizing how students and developers learn, work, and excel in programming. We're not just building tools; we're creating the future of education technology.\n\n` +
          `**🎯 Our Mission:**\n` +
          `Empower every student and developer with AI-powered tools that make learning programming accessible, engaging, and highly effective. We believe technology should enhance human potential, not replace it.\n\n` +
          `**💡 What Makes Us Special:**\n` +
          `• **AI-First Approach:** Advanced artificial intelligence that adapts to your learning style\n` +
          `• **Student-Focused:** Designed specifically for educational success\n` +
          `• **Real-World Ready:** Skills that matter in today's tech industry\n` +
          `• **Community Driven:** Built with feedback from thousands of developers\n\n` +
          `**🚀 Our Products:**\n` +
          `• **Chatz.IO:** AI coding assistant for students\n` +
          `• **Learning Platforms:** Interactive programming courses\n` +
          `• **Developer Tools:** Productivity boosters for coders\n` +
          `• **Study Resources:** Comprehensive educational materials\n\n` +
          `**👨‍💼 Leadership:**\n` +
          `Founded and led by **Kawin M.S**, an innovative entrepreneur passionate about merging AI with education. His vision drives our commitment to democratizing programming education.\n\n` +
          `**🌐 Connect With Us:**\n` +
          `🔗 <a href="https://integer-io.netlify.app/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Official Website</a>\n` +
          `📧 <a href="mailto:integer.ai.io@gmail.com" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Email: integer.ai.io@gmail.com</a>\n` +
          `📸 <a href="https://www.instagram.com/integer.io/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Instagram @integer.io</a>\n` +
          `💼 <a href="https://www.linkedin.com/company/integer-io-services/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">LinkedIn Company Page</a>\n` +
          `📺 <a href="https://www.youtube.com/@integer.io" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">YouTube Channel</a>\n\n` +
          `**👤 Meet Our Founder:**\n` +
          `📱 <a href="https://kawin-portfolio.netlify.app/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Kawin M.S Portfolio</a>\n` +
          `💼 <a href="https://www.linkedin.com/in/kawin-m-s-570961285/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">LinkedIn Profile</a>\n` +
          `📸 <a href="https://www.instagram.com/https_kawin.19?igsh=MXZ0cmsxNWRucnVzNA==" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Instagram @https_kawin.19</a>\n\n` +
          `🌟 **Join us in transforming education through technology!**`;
      } else {
        // Enhanced developer/CEO only response
        return `👨‍💼 **Meet Kawin M.S - Visionary Tech Entrepreneur**\n\n` +
          `Kawin M.S is the innovative mind behind Chatz.IO and the Founder & CEO of Integer.IO. With an unwavering passion for technology and education, he's on a mission to revolutionize how people learn to code.\n\n` +
          `**🎯 His Vision:**\n` +
          `"Make programming accessible to everyone through intelligent AI-powered tools that understand and adapt to each learner's unique journey."\n\n` +
          `**💡 What Drives Him:**\n` +
          `• **Innovation:** Pushing boundaries of what's possible with AI in education\n` +
          `• **Accessibility:** Breaking down barriers to quality programming education\n` +
          `• **Impact:** Empowering the next generation of developers worldwide\n` +
          `• **Excellence:** Delivering tools that genuinely help students succeed\n\n` +
          `**🚀 Key Achievements:**\n` +
          `• Founded Integer.IO - Leading ed-tech company\n` +
          `• Created Chatz.IO - AI coding assistant used by students globally\n` +
          `• Built innovative learning platforms that adapt to student needs\n` +
          `• Mentored countless developers in their coding journey\n\n` +
          `**🌟 Expertise:**\n` +
          `• Artificial Intelligence & Machine Learning\n` +
          `• Educational Technology Development\n` +
          `• Full-Stack Development\n` +
          `• Product Strategy & Innovation\n` +
          `• Community Building & Mentorship\n\n` +
          `**📱 Connect With Kawin:**\n` +
          `🌐 <a href="https://kawin-portfolio.netlify.app/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Personal Portfolio</a>\n` +
          `💼 <a href="https://www.linkedin.com/in/kawin-m-s-570961285/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">LinkedIn Profile</a>\n` +
          `📸 <a href="https://www.instagram.com/https_kawin.19?igsh=MXZ0cmsxNWRucnVzNA==" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Instagram @https_kawin.19</a>\n` +
          `📺 <a href="https://www.youtube.com/@integer.io" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">YouTube Channel</a>\n\n` +
          `**🏢 His Company:**\n` +
          `🌐 <a href="https://integer-io.netlify.app/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Visit Integer.IO</a>\n\n` +
          `💬 **"Technology should empower, educate, and inspire. That's what we build at Integer.IO."** - Kawin M.S`;
      }
    }

    // Enhanced company queries with comprehensive information
    if (userQuery.includes('company') || userQuery.includes('organization') || userQuery.includes('integer') || userQuery.includes('about us')) {
      return `🏢 **Integer.IO - Pioneering the Future of Code Education**\n\n` +
        `We're not just a tech company – we're a movement to transform how the world learns to code. Integer.IO combines cutting-edge AI with deep educational expertise to create tools that truly make a difference.\n\n` +
        `**🎯 Our Mission:**\n` +
        `Democratize programming education by creating intelligent, adaptive tools that help every student reach their full potential, regardless of their background or experience level.\n\n` +
        `**💡 Why Choose Integer.IO:**\n` +
        `• **AI-Powered Learning:** Our tools adapt to your unique learning style\n` +
        `• **Real Results:** Students see measurable improvement in their coding skills\n` +
        `• **Always Available:** 24/7 support for your learning journey\n` +
        `• **Industry Relevant:** Learn skills that employers actually want\n` +
        `• **Community First:** Built with and for the developer community\n\n` +
        `**🚀 Our Product Ecosystem:**\n\n` +
        `**1. Chatz.IO** 🤖\n` +
        `Your personal AI coding assistant that helps with debugging, explanations, and project guidance.\n\n` +
        `**2. Learning Platforms** 📚\n` +
        `Interactive courses designed to take you from beginner to professional developer.\n\n` +
        `**3. Developer Tools** 🛠️\n` +
        `Productivity-enhancing utilities that streamline your coding workflow.\n\n` +
        `**4. Study Resources** 📖\n` +
        `Comprehensive materials covering everything from basics to advanced topics.\n\n` +
        `**🌟 What Sets Us Apart:**\n` +
        `• **Personalized Experience:** Every learner gets a unique, tailored experience\n` +
        `• **Instant Feedback:** Real-time help when you need it most\n` +
        `• **Proven Methods:** Based on educational research and real-world testing\n` +
        `• **Continuous Innovation:** Always improving, always evolving\n\n` +
        `**👨‍💼 Our Leadership:**\n` +
        `Founded by **Kawin M.S**, a visionary entrepreneur who believes technology can unlock human potential. His leadership drives our commitment to excellence and innovation.\n\n` +
        `**📊 Our Impact:**\n` +
        `• Thousands of students helped worldwide\n` +
        `• Countless hours of coding challenges solved\n` +
        `• Growing community of passionate developers\n` +
        `• Continuous innovation in ed-tech\n\n` +
        `**🌐 Connect With Integer.IO:**\n` +
        `🔗 <a href="https://integer-io.netlify.app/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Official Website</a>\n` +
        `📧 <a href="mailto:integer.ai.io@gmail.com" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Contact Us: integer.ai.io@gmail.com</a>\n` +
        `📸 <a href="https://www.instagram.com/integer.io/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Instagram @integer.io</a>\n` +
        `💼 <a href="https://www.linkedin.com/company/integer-io-services/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">LinkedIn Company</a>\n` +
        `📺 <a href="https://www.youtube.com/@integer.io" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">YouTube Channel</a>\n\n` +
        `**👤 Meet Our Founder:**\n` +
        `📱 <a href="https://kawin-portfolio.netlify.app/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Kawin M.S - Portfolio</a>\n` +
        `💼 <a href="https://www.linkedin.com/in/kawin-m-s-570961285/" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">LinkedIn</a>\n` +
        `📸 <a href="https://www.instagram.com/https_kawin.19?igsh=MXZ0cmsxNWRucnVzNA==" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Instagram</a>\n` +
        `📺 <a href="https://www.youtube.com/@integer.io" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: 600;">YouTube</a>\n\n` +
        `🚀 **Ready to transform your coding journey? Let's get started!**`;
    }

    // Enhanced help and capabilities query
    if (userQuery.includes('what can you do') || userQuery.includes('your capabilities') || userQuery.includes('how can you help')) {
      return `🌟 **My Capabilities - How I Can Help You Succeed**\n\n` +
        `I'm your comprehensive AI coding assistant with a wide range of capabilities designed to support your learning and development journey!\n\n` +
        `**💻 Programming & Development:**\n` +
        `• Debug code across multiple languages (JavaScript, Python, Java, C++, etc.)\n` +
        `• Explain complex programming concepts in simple terms\n` +
        `• Help design and architect software projects\n` +
        `• Review code and suggest improvements\n` +
        `• Write clean, efficient, and well-documented code\n` +
        `• Provide best practices and design patterns\n\n` +
        `**📚 Learning & Education:**\n` +
        `• Break down difficult topics step-by-step\n` +
        `• Create personalized learning paths\n` +
        `• Provide practice problems and solutions\n` +
        `• Explain algorithms and data structures\n` +
        `• Help with homework and assignments\n` +
        `• Prepare you for technical interviews\n\n` +
        `**🔍 Research & Information:**\n` +
        `• Find relevant documentation and resources\n` +
        `• Explain APIs and libraries\n` +
        `• Compare different technologies and frameworks\n` +
        `• Stay updated with programming trends\n` +
        `• Suggest tools and resources for specific needs\n\n` +
        `**🛠️ Project Assistance:**\n` +
        `• Help plan and structure projects\n` +
        `• Assist with Git and version control\n` +
        `• Guide through deployment processes\n` +
        `• Troubleshoot errors and bugs\n` +
        `• Optimize performance and efficiency\n` +
        `• Write documentation and comments\n\n` +
        `**🌐 Web Development:**\n` +
        `• HTML, CSS, JavaScript mastery\n` +
        `• React, Vue, Angular frameworks\n` +
        `• Backend with Node.js, Python, etc.\n` +
        `• Database design and queries\n` +
        `• API development and integration\n` +
        `• Responsive design and accessibility\n\n` +
        `**📱 And Much More:**\n` +
        `• Mobile app development guidance\n` +
        `• Database design and optimization\n` +
        `• Testing strategies and methodologies\n` +
        `• DevOps and CI/CD practices\n` +
        `• Security best practices\n` +
        `• Career advice and skill development\n\n` +
        `💬 **Just ask me anything!** I'm here 24/7 to help you learn, build, and succeed in your coding journey.`;
    }

    // Enhanced current/real-time questions that need web search
    const currentInfoKeywords = [
      'current', 'latest', 'today', 'now', 'recent', 'this year', '2024', '2025',
      'prime minister', 'pm of', 'president of',
      'chief minister', 'cm of', 'governor of', 'minister of',
      'who is the', 'what is the current',
      'season', 'weather', 'news', 'winner', 'champion',
      'trending', 'popular now', 'viral'
    ];

    // Check for website information requests
    const isWebsiteInfoRequest = userQuery.match(/tell\s+(me\s+)?(about|information|details|facts)\s+(on|about)?\s+([a-zA-Z0-9\s]+)(\s+website)?/i) ||
      userQuery.match(/what\s+is\s+([a-zA-Z0-9\s.]+)(\s+website)?/i);

    const needsWebSearch = isWebsiteInfoRequest || (
      currentInfoKeywords.some(keyword => userQuery.includes(keyword)) &&
      (
        userQuery.includes('india') || userQuery.includes('world') ||
        userQuery.includes('country') || userQuery.includes('state') ||
        userQuery.includes('minister') || userQuery.includes('president') ||
        userQuery.includes('pm') || userQuery.includes('cm') ||
        userQuery.includes('season') || userQuery.includes('weather') ||
        userQuery.includes('news') || userQuery.includes('election') ||
        userQuery.match(/who is (the )?(current )?/i) ||
        userQuery.match(/what is (the )?(current )?/i)
      )
    );

    if (needsWebSearch) {
      return await searchOnline(lastMessage?.content || userQuery);
    }

    // Convert messages to API format
    const nvidiaMessages: NvidiaMessage[] = messages
      .filter(msg => msg.type !== 'system')
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Get AI response from API
    let aiResponse = await sendToNvidiaAPI(nvidiaMessages, selectedModel);

    // Enhanced emoji and formatting for better readability
    if (aiResponse.length > 200) {
      aiResponse = aiResponse
        .replace(/\b(example|for instance|e\.g\.|eg)\b/gi, '📝 Example')
        .replace(/\b(note|important|attention)\b/gi, '⚠️ Note')
        .replace(/\b(step \d+|first step|second step|third step|next step)\b/gi, (match) => `🔸 ${match}`)
        .replace(/\b(conclusion|summary|in summary)\b/gi, '📋 Summary')
        .replace(/\b(advantage|benefit|pro)\b/gi, '✅ Advantage')
        .replace(/\b(disadvantage|drawback|con)\b/gi, '❌ Disadvantage')
        .replace(/\b(tip|hint|pro tip)\b/gi, '💡 Tip')
        .replace(/\b(warning|caution|careful)\b/gi, '⚠️ Warning')
        .replace(/\b(question|query)\b/gi, '❓ Question')
        .replace(/\b(solution|answer|fix)\b/gi, '✨ Solution')
        .replace(/\b(remember|keep in mind|don't forget)\b/gi, '🎯 Remember')
        .replace(/\b(best practice|recommended)\b/gi, '⭐ Best Practice')
        .replace(/\b(error|mistake|problem)\b/gi, '🐛 Error')
        .replace(/\b(success|correct|right)\b/gi, '✅ Success')
        .replace(/\b(code|programming|development)\b/gi, '💻 Code')
        .replace(/\b(reference|documentation|docs)\b/gi, '📚 Reference');
    }

    // Clean up HTML tags except for links
    aiResponse = aiResponse.replace(/<span[^>]*>(.+?)<\/span>/g, '$1');

    // Decode HTML entities to ensure proper rendering
    aiResponse = decodeHtmlEntities(aiResponse);

    // Log successful response
    console.log(`✅ AI Response generated (${aiResponse.length} characters)`);

    return aiResponse;
  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    
    // Return a friendly fallback message
    return `🤖 **I'm here to help!**\n\n` +
      `I encountered a temporary issue processing your request, but don't worry! Here are some things I can definitely help you with:\n\n` +
      `• 💻 **Programming Questions** - Ask me about any coding topic\n` +
      `• 🐛 **Debug Code** - Share your code and I'll help find issues\n` +
      `• 📚 **Learn Concepts** - I'll explain any programming concept\n` +
      `• 🎯 **Project Help** - Get guidance on your projects\n` +
      `• 🔍 **Research** - Find information and resources\n\n` +
      `Please try asking your question again, and I'll do my best to assist you!\n\n` +
      `💡 **Tip:** Try being specific about what you need help with for the best results.`;
  }
};