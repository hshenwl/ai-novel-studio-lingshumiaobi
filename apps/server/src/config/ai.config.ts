import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  apiKey: process.env.AI_API_KEY || '',
  apiBaseUrl: process.env.AI_API_BASE_URL || 'https://api.openai.com/v1',
  model: process.env.AI_MODEL || 'gpt-4',
}));