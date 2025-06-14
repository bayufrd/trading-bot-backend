import { processWebhook } from '../controllers/webhookController';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        return await processWebhook(req, res);
    }
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}