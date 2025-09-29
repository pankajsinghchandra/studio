'use server';

/**
 * @fileOverview Summarizes search results using an LLM.
 *
 * - summarizeSearchResults - A function that summarizes a list of search results.
 * - SummarizeSearchResultsInput - The input type for the summarizeSearchResults function.
 * - SummarizeSearchResultsOutput - The return type for the summarizeSearchResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSearchResultsInputSchema = z.object({
  query: z.string().describe('The original search query.'),
  results: z.array(z.string()).describe('A list of search results to summarize.'),
});
export type SummarizeSearchResultsInput = z.infer<typeof SummarizeSearchResultsInputSchema>;

const SummarizeSearchResultsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the search results.'),
});
export type SummarizeSearchResultsOutput = z.infer<typeof SummarizeSearchResultsOutputSchema>;

export async function summarizeSearchResults(
  input: SummarizeSearchResultsInput
): Promise<SummarizeSearchResultsOutput> {
  return summarizeSearchResultsFlow(input);
}

const summarizeSearchResultsPrompt = ai.definePrompt({
  name: 'summarizeSearchResultsPrompt',
  input: {schema: SummarizeSearchResultsInputSchema},
  output: {schema: SummarizeSearchResultsOutputSchema},
  prompt: `You are an expert summarizer. Please provide a concise and relevant summary of the following search results based on the user's original query.\n\nOriginal Query: {{{query}}}\n\nSearch Results:\n{{#each results}}- {{{this}}}\n{{/each}}\n\nSummary:`,
});

const summarizeSearchResultsFlow = ai.defineFlow(
  {
    name: 'summarizeSearchResultsFlow',
    inputSchema: SummarizeSearchResultsInputSchema,
    outputSchema: SummarizeSearchResultsOutputSchema,
  },
  async input => {
    const {output} = await summarizeSearchResultsPrompt(input);
    return output!;
  }
);
