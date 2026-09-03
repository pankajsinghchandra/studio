import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Corrected the model name to gemini-1.5-flash as 2.5 does not exist.
  // This setup will automatically use the Auth Key provided by Firebase Studio environment.
  model: 'googleai/gemini-1.5-flash',
});
