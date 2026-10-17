import { modelsHandler } from '../../../lib/chat.js';

export const prerender = false;

export async function POST({ request, clientAddress }) {
  return modelsHandler(request, clientAddress || 'unknown');
}
