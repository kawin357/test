
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Message, ChatSession } from '@/types/chat';
import { sendToNvidiaAPI as generateAIResponse } from '@/services/nvapi';
import { generateChatTitle, saveChatToHistory } from '@/services/chatHistory';
import ChatInterface from '@/components/ChatInterface';
import ChatHistory from '@/components/ChatHistory';
import AuthModal from '@/components/AuthModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WelcomeScreen from '@/components/WelcomeScreen';
import BackgroundAnimation from '@/components/BackgroundAnimation';

import { AIModel } from '@/components/ModelSelector';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChatting, setHasStartedChatting] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('int');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);

      if (user) {
        setMessages([]);
        setHasStartedChatting(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!currentSessionId) {
      setCurrentSessionId(Date.now().toString());
    }

    setHasStartedChatting(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date(),
      userId: user.uid
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Transform Message[] to NvidiaMessage[] by mapping type to role
      const nvidiaMessages = updatedMessages.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : msg.type === 'ai' ? 'assistant' as const : 'system' as const,
        content: msg.content
      }));
      
      const aiResponse = await generateAIResponse(nvidiaMessages, selectedModel);

      // Check if this is a duplicate response (same content as last AI message)
      const lastAIMessage = messages.filter(m => m.type === 'ai').pop();
      if (lastAIMessage && lastAIMessage.content === aiResponse) {
        console.log('Duplicate response detected, skipping...');
        setIsLoading(false);
        return;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        type: 'ai',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      const sessionToSave: ChatSession = {
        id: currentSessionId || Date.now().toString(),
        userId: user.uid,
        title: generateChatTitle(finalMessages),
        messages: finalMessages,
        createdAt: new Date(parseInt(currentSessionId) || Date.now()),
        updatedAt: new Date(),
      };

      saveChatToHistory(sessionToSave);
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset showThinking in ChatInterface if needed
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse-glow text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            chatz.IO
          </div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  const handleGoToWelcome = () => {
    setHasStartedChatting(false);
    setMessages([]);
    setCurrentSessionId('');
  };

  const handleNewChat = () => {
    setMessages([]);
    setHasStartedChatting(false);
    setCurrentSessionId('');
  };

  const handleLoadChat = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setHasStartedChatting(true);
  };

  return (
    <div className="flex flex-col h-screen relative overflow-x-hidden">
      {/* Enhanced 3D Background Animation - Hidden when contact is open */}
      {!isContactOpen && <BackgroundAnimation />}
      <Header
        user={user} 
        onAuthClick={() => setShowAuthModal(true)} 
        onGoToWelcome={handleGoToWelcome} 
        isChatActive={hasStartedChatting}
        isWelcomeScreen={!hasStartedChatting}
        onNewChat={handleNewChat}
        onOpenHistory={() => setShowHistoryModal(true)}
        isHidden={(showHistoryModal && !hasStartedChatting) || isContactOpen}
        onContactOpen={setIsContactOpen}
      />

      <ChatHistory
        onLoadChat={handleLoadChat}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      {!isContactOpen && (
        <>
          <main className="flex-1 flex flex-col w-full">
            {!hasStartedChatting ? (
              <WelcomeScreen 
                user={user} 
                onSendMessage={handleSendMessage}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            ) : (
              <ChatInterface
                onSendMessage={handleSendMessage}
                messages={messages}
                isLoading={isLoading}
                isAuthenticated={!!user}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onNewChat={handleNewChat}
              />
            )}
          </main>

          <Footer isVisible={!hasStartedChatting} />
        </>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Index;
