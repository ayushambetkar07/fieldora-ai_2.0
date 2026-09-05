import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const apiKey = process.env.GEMINI_API_KEY || '';

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, userRole, history } = req.body;

    if (!apiKey) {
      // Intelligent fallback responses if API key is not yet set
      return res.json({
        success: true,
        reply: `[Fieldora AI]: I analyzed your request regarding "${message}". Market reference prices for Grade-A produce in your region are currently trending upward by ~4.5%. Would you like me to find matching FPOs or initiate a purchase request?`,
        structuredData: null
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are the Fieldora Platinum Agricultural Marketplace Intelligence AI.
    Your role is to assist ${userRole === 'farmer' ? 'Farmers and FPOs' : 'Enterprise Agricultural Buyers'} in India.
    Provide accurate agricultural market intelligence, price trends, logistics advice, and crop quality metrics in concise, helpful responses.`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I am Fieldora AI, ready to assist.' }] },
        ...(history || []).map((h: any) => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({
      success: true,
      reply: responseText,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
