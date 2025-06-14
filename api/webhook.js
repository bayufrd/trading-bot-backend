import { processWebhook } from '../controllers/webhookController';
import { runCors } from '../middleware/cors'; 

export default async function handler(req, res) {
    
    await runCors(req, res); 

    if (req.method === 'POST') {
        return await processWebhook(req, res);
    }
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}