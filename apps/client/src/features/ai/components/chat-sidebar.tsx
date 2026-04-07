import { useState, useCallback, useRef, useEffect } from "react";
import { X, MessageSquare, Sparkles, Send } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
} from "@/core/components/ui/sidebar";
import { Button } from "@/core/components/ui/button";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { Textarea } from "@/core/components/ui/textarea";
import AIConversation, { type Message } from "@/core/components/ui/ai-conversation";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ChatInput({ onSend, disabled }: { onSend: (message: string) => void; disabled?: boolean }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask me anything about your finances..."
        className="min-h-[80px] resize-none"
        disabled={disabled}
      />
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          Press {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"} + Enter to send
        </p>
        <Button type="submit" size="sm" disabled={!input.trim() || disabled}>
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
    </form>
  );
}

function ChatSidebarContent({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      setIsStreaming(true);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I received your message: "${content}"\n\nThis is a demo response. To enable real AI responses, you'll need to connect this to your AI service backend.\n\n**Some features you could implement:**\n- Financial insights and analysis\n- Budget recommendations\n- Transaction categorization help\n- Spending pattern analysis\n- Goal tracking assistance`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setTimeout(() => {
        setIsStreaming(false);
      }, 1000);
    }, 2000);
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: "Hello! 👋 I'm your financial assistant. I can help you with:\n\n- **Analyzing** your spending patterns\n- **Categorizing** transactions\n- **Planning** budgets and recommendations\n- **Providing** financial insights and trends\n- **Answering** questions about your finances\n\nHow can I assist you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">AI Assistant</h2>
              <p className="text-muted-foreground text-xs">Your financial copilot</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close chat sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col p-0">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <AIConversation
            messages={messages}
            isThinking={isThinking}
            isStreaming={isStreaming}
            className="border-0 shadow-none"
            maxHeight="calc(100vh - 280px)"
          />
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <ChatInput onSend={handleSendMessage} disabled={isThinking} />
      </SidebarFooter>
    </>
  );
}

export function ChatSidebar({ open, onOpenChange }: ChatSidebarProps) {
  return (
    <SidebarProvider open={open} onOpenChange={onOpenChange} className="w-auto">
      <div
        style={
          {
            "--sidebar-width": "30rem",
            "--sidebar-width-mobile": "100vw",
          } as React.CSSProperties
        }
      >
        <Sidebar
          side="right"
          variant="floating"
          collapsible="offcanvas"
          className={cn(
            "border-l",
            "data-[state=collapsed]:translate-x-full",
            "transition-transform duration-300 ease-in-out"
          )}
        >
          <ChatSidebarContent onClose={() => onOpenChange(false)} />
        </Sidebar>
      </div>
    </SidebarProvider>
  );
}

export function ChatSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
      aria-label="Open AI chat"
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
}
