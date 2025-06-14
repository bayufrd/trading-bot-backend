import { getOrders, getOrdersBySymbol, updateOrderStatus } from '../controllers/orderController';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        if (req.query.symbol) {
            return await getOrdersBySymbol(req, res);
        }
        return await getOrders(req, res);
    } else if (req.method === 'PUT') {
        return await updateOrderStatus(req, res);
    }
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}