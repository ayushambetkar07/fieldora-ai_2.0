import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, userRole, history, userData, marketData } = req.body;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ success: false, message: 'GROQ_API_KEY is not configured on the server.' });
    }

    const userContext = userData ? JSON.stringify(userData, null, 2) : 'No user data available';
    const marketContext = marketData ? JSON.stringify(marketData, null, 2) : 'No market data available';

    const systemPrompt = `You are the Fieldora Platinum Agricultural Marketplace Intelligence AI.

CRITICAL RULES:
- You MUST ONLY answer using the provided USER DATA and MARKET DATA below.
- If the user asks about something not covered by the data, say "I don't have that information available. I can only assist with data from your Fieldora account and current market listings."
- NEVER make up prices, crop data, orders, or any other information.
- NEVER hallucinate or generate fictional data.
- ONLY provide advice and insights based on the actual data provided.

USER ROLE: ${userRole === 'farmer' ? 'Farmer / FPO Producer' : 'Enterprise Agricultural Buyer'}

=== CURRENT USER DATA ===
${userContext}

=== CURRENT MARKET DATA ===
${marketContext}

Based on the above data only, provide concise, accurate agricultural marketplace intelligence. Reference specific numbers, prices, and details from the data when responding.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((h: any) => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.content
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('GROQ API error:', response.status, errorBody);
      return res.status(502).json({ success: false, message: `AI service error: ${response.status}` });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'I could not generate a response. Please try again.';

    res.json({ success: true, reply });
  } catch (error: any) {
    console.error('AI route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
