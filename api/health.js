import { runCors } from '../middleware/cors'; 

export default async function handler(req, res) {
    await runCors(req, res); 

    res.json({

        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
}