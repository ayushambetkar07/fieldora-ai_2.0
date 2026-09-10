import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import produceRoutes from './routes/produceRoutes.js';
import buyerRequirementRoutes from './routes/buyerRequirementRoutes.js';
import demandAlertRoutes from './routes/demandAlertRoutes.js';
import purchaseRequestRoutes from './routes/purchaseRequestRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import marketPriceRoutes from './routes/marketPriceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
dotenv.config();
const app = express();
// Middleware: Standard CORS and JSON body parser
app.use(cors());
app.use(express.json());
// Health Check Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'Fieldora Backend API',
        mode: process.env.NETLIFY ? 'serverless-function' : 'standalone-server',
        timestamp: new Date().toISOString()
    });
});
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'Fieldora Backend API',
        mode: process.env.NETLIFY ? 'serverless-function' : 'standalone-server',
        timestamp: new Date().toISOString()
    });
});
// Module API Routes
app.use('/api/produce', produceRoutes);
app.use('/api/produce-listings', produceRoutes);
app.use('/api/buyer-requirements', buyerRequirementRoutes);
app.use('/api/requirements', buyerRequirementRoutes); // Legacy alias support
app.use('/api/demand-alerts', demandAlertRoutes);
app.use('/api/purchase-requests', purchaseRequestRoutes);
app.use('/api/requests', purchaseRequestRoutes); // Alias support
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/demand-intelligence', demandAlertRoutes);
app.use('/api/ai', aiRoutes);
// Direct function path fallback if Netlify invokes /.netlify/functions/api/... directly
app.use('/.netlify/functions/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'Fieldora Backend API (Serverless)',
        timestamp: new Date().toISOString()
    });
});
app.use('/.netlify/functions/api/produce', produceRoutes);
app.use('/.netlify/functions/api/produce-listings', produceRoutes);
app.use('/.netlify/functions/api/buyer-requirements', buyerRequirementRoutes);
app.use('/.netlify/functions/api/requirements', buyerRequirementRoutes);
app.use('/.netlify/functions/api/demand-alerts', demandAlertRoutes);
app.use('/.netlify/functions/api/demand-intelligence', demandAlertRoutes);
app.use('/.netlify/functions/api/purchase-requests', purchaseRequestRoutes);
app.use('/.netlify/functions/api/requests', purchaseRequestRoutes);
app.use('/.netlify/functions/api/orders', orderRoutes);
app.use('/.netlify/functions/api/reviews', reviewRoutes);
app.use('/.netlify/functions/api/market-prices', marketPriceRoutes);
app.use('/.netlify/functions/api/ai', aiRoutes);
export default app;
