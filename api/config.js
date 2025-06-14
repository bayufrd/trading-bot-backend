import { initDatabase } from '../database/database'; 
import { saveConfig, getConfig } from '../controllers/configController';
import { runCors } from '../middleware/cors'; 

export default async function handler(req, res) {
    try {
        await runCors(req, res); 
        await initDatabase();  

        if (req.method === 'POST') {
            return await saveConfig(req, res);
        } else if (req.method === 'GET') {
            return await getConfig(req, res);
        }

        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error) {
        console.error('Database initialization failed:', error);
        res.status(500).json({ success: false, message: 'Database initialization failed' });
    }
}