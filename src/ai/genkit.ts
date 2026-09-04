
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for Google AI.
 * 
 * In Firebase Studio, it uses the built-in Auth Key.
 * In Netlify, it will use the GOOGLE_GENAI_API_KEY environment variable.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Using gemini-1.5-flash for speed and reliability.
  model: 'googleai/gemini-1.5-flash',
});
