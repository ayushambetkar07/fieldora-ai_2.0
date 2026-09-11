import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getAssistantResponse } from '../../services/aiService';
import { AIAssistantMessage } from '../../types';
import { MOCK_MARKET_PRICES } from '../../data/mockData';
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  ArrowRight,
  RotateCcw,
  Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, cn } from '../ui';

// Simple Markdown formatting renderer
function FormattedMessageContent({ content }: { content: string }) {
  // Split lines
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Parse bold segments **text**
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const formattedParts = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={pIdx} className="italic text-secondary">{part.slice(1, -1)}</em>;
          }
          return part;
        });

        // Bullet line
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 text-[12px] sm:text-xs">
              <span className="text-primary font-bold">•</span>
              <span className="flex-1">{formattedParts}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-[12px] sm:text-xs">
            {formattedParts}
          </p>
        );
      })}
    </div>
  );
}

export const AIAssistantDrawer: React.FC = () => {
  const {
    isAssistantOpen,
    setIsAssistantOpen,
    userRole,
    currentFarmer,
    currentBuyer,
    currentUser,
    produceList,
    ordersList,
    requirementsList
  } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const initialWelcome = userRole === 'farmer'
    ? `Hello ${currentFarmer.name} 👋 I am your Fieldora AI assistant. I have live access to your harvest listings, active escrow orders, and current APMC Mandi price benchmarks from Supabase. How can I help you today?`
    : `Hello ${currentBuyer.name} 👋 I am your Fieldora Procurement AI assistant. I have real-time access to verified harvest lots, open RFQs, APMC mandi rates, and escrow contract status in Supabase. What can I help you analyze or source?`;

  const initialActions = userRole === 'farmer'
    ? ['What is the current tomato price?', 'Find buyers for my harvest', 'Show my pending orders', 'टोमॅटोचा आजचा बाजारभाव काय आहे?']
    : ['Find Grade A+ produce lots', 'What are current market prices?', 'Show my pending orders', 'Compare mandi prices across markets'];

  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      timestamp: 'Just now',
      content: initialWelcome,
      suggestedActions: initialActions
    }
  ]);

  if (!isAssistantOpen) return null;

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg-' + Date.now(),
        sender: 'assistant',
        timestamp: 'Just now',
        content: initialWelcome,
        suggestedActions: initialActions
      }
    ]);
  };

  const handleSend = async (text?: string) => {
    const query = text || inputQuery.trim();
    if (!query || isLoading) return;

    const userMsg: AIAssistantMessage = {
      id: 'msg-u-' + Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: query
    };

    setMessages(prev => [...prev, userMsg]);
    if (!text) setInputQuery('');
    setIsLoading(true);

    try {
      const userData = userRole === 'farmer' ? currentFarmer : currentBuyer;

      const resp = await getAssistantResponse(
        query, 
        {
          userRole,
          userData: { 
            ...userData, 
            id: currentUser?.id || (userRole === 'farmer' ? 'FARMER-01' : 'BUYER-01'),
            email: currentUser?.email 
          },
          marketData: MOCK_MARKET_PRICES,
          produceList,
          ordersList,
          requirementsList
        }, 
        messages.map(m => ({ sender: m.sender as 'user' | 'assistant', content: m.content }))
      );

      setMessages(prev => [...prev, resp]);
    } catch {
      setMessages(prev => [...prev, {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: 'I had trouble connecting to the AI service. Please make sure the backend server is running and check your connection.',
        suggestedActions: ['Try again', 'What is the current tomato price?']
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity" 
        onClick={() => setIsAssistantOpen(false)}
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 w-full max-w-md bg-card border-l border-border h-full shadow-drawer flex flex-col justify-between animate-slide-in-right">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-border bg-[#F7F9F6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-card">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-main flex items-center gap-1.5">
                ✦ Fieldora AI Intelligence
              </h3>
              <span className="text-[11px] text-secondary flex items-center gap-1">
                <Bot className="w-3 h-3 text-primary" />
                Live Supabase & Groq LLM Decision Support
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              title="Reset conversation"
              className="p-1.5 text-secondary hover:text-main rounded-button hover:bg-[#EAEFEA] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAssistantOpen(false)}
              className="p-1.5 text-secondary hover:text-main rounded-button hover:bg-[#EAEFEA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn("flex flex-col space-y-2", msg.sender === 'user' ? "items-end" : "items-start")}
            >
              <div 
                className={cn(
                  "max-w-[90%] p-3.5 rounded-card text-xs sm:text-sm leading-relaxed space-y-2 shadow-2xs",
                  msg.sender === 'user'
                    ? "bg-primary text-white font-medium"
                    : "bg-[#F7F9F6] text-main border border-border"
                )}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <FormattedMessageContent content={msg.content} />
                )}

                {msg.structuredData?.type === 'market_price' && (
                  <div className="bg-card border border-border p-3 rounded-input space-y-2 mt-2 shadow-card text-main">
                    <div className="flex items-center justify-between border-b border-border pb-1.5">
                      <span className="font-bold text-xs text-primary">{msg.structuredData.data.crop} ({msg.structuredData.data.mandi || 'APMC Mandi'})</span>
                      <span className="font-bold text-sm text-primary font-mono">₹{msg.structuredData.data.currentPrice || msg.structuredData.data.current_price || msg.structuredData.data.average_price}/q</span>
                    </div>
                    <p className="text-[11px] text-secondary leading-normal">{msg.structuredData.data.insightSummary || msg.structuredData.data.insight_summary || 'Live verified APMC modal rate'}</p>
                    <Link 
                      to="/farmer/market-prices" 
                      onClick={() => setIsAssistantOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline pt-1"
                    >
                      <span>View 30-Day Mandi Price Chart</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {msg.structuredData?.type === 'buyer_matches' && (
                  <div className="space-y-2 mt-2">
                    {msg.structuredData.data.slice(0, 2).map((req: any) => (
                      <div key={req.id || Math.random()} className="bg-card border border-border p-2.5 rounded-input text-main space-y-1 shadow-card">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{req.companyName || req.company_name || req.buyer_name || 'Verified Buyer'}</span>
                          <span className="text-accent font-mono">{req.matchingScore || req.matching_score || 92}% Match</span>
                        </div>
                        <p className="text-[11px] text-secondary">Looking for {req.quantity || req.required_quantity} {req.unit || 'quintals'} {req.crop || req.crop_name} @ ₹{req.targetPrice || req.target_price}/q</p>
                      </div>
                    ))}
                    <Link 
                      to="/farmer/requirements" 
                      onClick={() => setIsAssistantOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <span>Browse all buyer requirements</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {msg.structuredData?.type === 'produce_list' && (
                  <div className="space-y-2 mt-2">
                    {msg.structuredData.data.slice(0, 2).map((prod: any) => (
                      <div key={prod.id || Math.random()} className="bg-card border border-border p-2.5 rounded-input text-main flex items-center justify-between gap-2 shadow-card">
                        <div>
                          <div className="font-bold text-xs">{prod.crop} ({prod.variety || 'Standard'})</div>
                          <div className="text-[11px] text-secondary">{prod.farmerName || prod.farmer_name || 'Verified Farmer'} • {prod.location}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-xs text-primary font-mono">₹{prod.expectedPrice || prod.expected_price}/q</div>
                          <div className="text-[10px] text-muted">{prod.quantity} {prod.unit || 'q'}</div>
                        </div>
                      </div>
                    ))}
                    <Link 
                      to="/buyer/marketplace" 
                      onClick={() => setIsAssistantOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <span>Open Marketplace search</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {msg.structuredData?.type === 'order_summary' && (
                  <div className="space-y-2 mt-2">
                    {msg.structuredData.data.slice(0, 2).map((ord: any) => (
                      <div key={ord.id || Math.random()} className="bg-card border border-border p-2.5 rounded-input text-main space-y-1 shadow-card">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>Order #{ord.orderNumber || ord.order_number || 'ORD'} ({ord.crop})</span>
                          <span className="text-info text-[11px] font-medium">{ord.status}</span>
                        </div>
                        <div className="text-[11px] text-secondary">₹{Number(ord.totalAmount || ord.total_amount || 0).toLocaleString('en-IN')} • Escrow: {ord.paymentStatus || ord.payment_status || 'Pending'}</div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {msg.suggestedActions && msg.suggestedActions.length > 0 && !isLoading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(action)}
                      className="text-[11px] bg-white border border-border text-secondary hover:text-primary hover:border-primary px-2.5 py-1 rounded-full transition-colors shadow-2xs text-left"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="max-w-[88%] p-3.5 rounded-card text-xs sm:text-sm bg-[#F7F9F6] border border-border text-main flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Querying Supabase database & analyzing with Groq AI...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border bg-[#F7F9F6]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about mandi rates, buyer matches, escrow orders..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 bg-card border border-border rounded-input text-xs sm:text-sm text-main placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <Button type="submit" size="sm" variant="primary" className="px-3" disabled={isLoading || !inputQuery.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>

      </aside>
    </div>
  );
};
