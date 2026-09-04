import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for Google AI.
 * 
 * NOTE: यह कॉन्फ़िगरेशन Firebase Studio के नए Auth Key सिस्टम के लिए है।
 * Studio के अंदर चलते समय अब .env फाइल में मैन्युअल API key की ज़रूरत नहीं है।
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // gemini-1.5-flash का उपयोग करें जो सबसे स्थिर और तेज़ है।
  model: 'googleai/gemini-1.5-flash',
});
