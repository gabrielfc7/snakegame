'use server';
/**
 * @fileOverview Dynamically adjusts the food spawn rate based on the player's score to maintain an engaging difficulty level.
 *
 * - adjustDifficulty - A function that adjusts the difficulty.
 * - AdjustDifficultyInput - The input type for the adjustDifficulty function.
 * - AdjustDifficultyOutput - The return type for the adjustDifficulty function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AdjustDifficultyInputSchema = z.object({
  currentScore: z.number().describe('The current score of the player.'),
  currentFoodSpawnRate: z.number().describe('The current rate at which food spawns (e.g., food items per second).'),
});
export type AdjustDifficultyInput = z.infer<typeof AdjustDifficultyInputSchema>;

const AdjustDifficultyOutputSchema = z.object({
  suggestedFoodSpawnRate: z.number().describe('The suggested new food spawn rate based on the player skill.'),
  reasoning: z.string().describe('Explanation of why the food spawn rate was adjusted.'),
});
export type AdjustDifficultyOutput = z.infer<typeof AdjustDifficultyOutputSchema>;

export async function adjustDifficulty(input: AdjustDifficultyInput): Promise<AdjustDifficultyOutput> {
  return adjustDifficultyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustDifficultyPrompt',
  input: {
    schema: z.object({
      currentScore: z.number().describe('The current score of the player.'),
      currentFoodSpawnRate: z.number().describe('The current rate at which food spawns (e.g., food items per second).'),
    }),
  },
  output: {
    schema: z.object({
      suggestedFoodSpawnRate: z.number().describe('The suggested new food spawn rate based on the player skill.'),
      reasoning: z.string().describe('Explanation of why the food spawn rate was adjusted.'),
    }),
  },
  prompt: `You are an AI game level designer. Your task is to dynamically adjust the difficulty of a Snake game based on the player's current score. The goal is to keep the game challenging and engaging.

The current score is: {{{currentScore}}}
The current food spawn rate is: {{{currentFoodSpawnRate}}}

Based on the current score, suggest a new food spawn rate. If the player's score is high, increase the spawn rate to make the game more challenging. If the player's score is low, decrease the spawn rate to make the game easier. Explain the reasoning behind your decision.

Output the suggested food spawn rate and the reasoning in JSON format.
`,
});

const adjustDifficultyFlow = ai.defineFlow<
  typeof AdjustDifficultyInputSchema,
  typeof AdjustDifficultyOutputSchema
>(
  {
    name: 'adjustDifficultyFlow',
    inputSchema: AdjustDifficultyInputSchema,
    outputSchema: AdjustDifficultyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
