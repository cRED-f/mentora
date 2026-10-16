import { chatHandler } from '../../../lib/chat.js';

export const prerender = false;

export async function POST({request, clientAddress}) {
  return chatHandler(request, clientAddress || request.headers.get('x-forwarded-for') || 'unknown');
}
