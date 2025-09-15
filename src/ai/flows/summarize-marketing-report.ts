'use server';

/**
 * @fileOverview Summarizes the key findings and recommendations from a marketing report.
 *
 * - summarizeMarketingReport - A function that accepts a marketing report and returns a summary.
 * - SummarizeMarketingReportInput - The input type for the summarizeMarketingReport function.
 * - SummarizeMarketingReportOutput - The return type for the summarizeMarketingReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMarketingReportInputSchema = z.object({
  reportDataUri: z
    .string()
    .describe(
      "A marketing report, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SummarizeMarketingReportInput = z.infer<typeof SummarizeMarketingReportInputSchema>;

const SummarizeMarketingReportOutputSchema = z.object({
  summary: z.string().describe('A summary of the key findings and recommendations from the marketing report.'),
});
export type SummarizeMarketingReportOutput = z.infer<typeof SummarizeMarketingReportOutputSchema>;

export async function summarizeMarketingReport(input: SummarizeMarketingReportInput): Promise<SummarizeMarketingReportOutput> {
  return summarizeMarketingReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeMarketingReportPrompt',
  input: {schema: SummarizeMarketingReportInputSchema},
  output: {schema: SummarizeMarketingReportOutputSchema},
  prompt: `You are an expert marketing analyst.

You will receive a marketing report and your job is to summarize the key findings and recommendations.

Report: {{media url=reportDataUri}}`,
});

const summarizeMarketingReportFlow = ai.defineFlow(
  {
    name: 'summarizeMarketingReportFlow',
    inputSchema: SummarizeMarketingReportInputSchema,
    outputSchema: SummarizeMarketingReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
