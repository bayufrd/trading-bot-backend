import Cors from 'cors';

const cors = Cors({
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
    origin: ['https://trading-bot-frontend-rho.vercel.app'],
});

export function runCors(req, res) {
    return new Promise((resolve, reject) => {
        cors(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}