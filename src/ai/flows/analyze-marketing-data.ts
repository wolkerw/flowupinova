'use server';

/**
 * @fileOverview An AI agent for analyzing marketing data and providing insights.
 *
 * - analyzeMarketingData - A function that analyzes marketing data and provides insights.
 * - AnalyzeMarketingDataInput - The input type for the analyzeMarketingData function.
 * - AnalyzeMarketingDataOutput - The return type for the analyzeMarketingData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMarketingDataInputSchema = z.object({
  marketingData: z
    .string()
    .describe(
      'The marketing data to analyze.  This could include website analytics, social media engagement metrics, sales data, or any other relevant information.  The data should be plain text, CSV, or JSON.'
    ),
});
export type AnalyzeMarketingDataInput = z.infer<typeof AnalyzeMarketingDataInputSchema>;

const AnalyzeMarketingDataOutputSchema = z.object({
  summary: z.string().describe('A summary of the key findings from the marketing data.'),
  recommendations: z
    .string()
    .describe(
      'Specific, actionable recommendations for improving the marketing strategy based on the data analysis.'
    ),
});
export type AnalyzeMarketingDataOutput = z.infer<typeof AnalyzeMarketingDataOutputSchema>;

export async function analyzeMarketingData(
  input: AnalyzeMarketingDataInput
): Promise<AnalyzeMarketingDataOutput> {
  return analyzeMarketingDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMarketingDataPrompt',
  input: {schema: AnalyzeMarketingDataInputSchema},
  output: {schema: AnalyzeMarketingDataOutputSchema},
  prompt: `You are an expert marketing analyst.  Your goal is to analyze marketing data and provide insights and recommendations for improving the marketing strategy.

Analyze the following marketing data:

{{marketingData}}

Provide a summary of the key findings and specific, actionable recommendations for improving the marketing strategy.  Be concise and to the point.

Summary:

Recommendations:`,
});

const analyzeMarketingDataFlow = ai.defineFlow(
  {
    name: 'analyzeMarketingDataFlow',
    inputSchema: AnalyzeMarketingDataInputSchema,
    outputSchema: AnalyzeMarketingDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
