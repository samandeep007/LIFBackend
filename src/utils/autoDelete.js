import { Message } from '../lib.js';

export const startAutoDelete = () => {
    setInterval(async () => {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        await Message.deleteMany({ timestamp: { $lt: fiveDaysAgo }, read: false });
        console.log('Deleted old unread messages');
    }, 24 * 60 * 60 * 1000);
};