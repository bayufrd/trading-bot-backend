import { initDatabase } from '../database/database'; // Pastikan Anda mengimpornya
import { saveConfig, getConfig } from '../controllers/configController';

export default async function handler(req, res) {
    try {
        await initDatabase();  // Inisialisasi database setiap kali ada permintaan

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