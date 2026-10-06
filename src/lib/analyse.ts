import type { ConversationItem } from '../types';

export interface AnalyseInput {
  userMessage: string;
  aiResponse: string;
}

// ============================================================================
// LIVE ANALYSIS CALL GOES HERE. NOT CONNECTED YET.
//
// When the classifier is available as a service, implement this function so it
// sends the two texts and returns a result in the ConversationItem['result']
// shape from src/types.ts. Then set LIVE_ANALYSIS_CONNECTED to true in
// src/screens/Analyse.tsx and call this from its submit handler.
// Nothing in the app calls this function today.
// ============================================================================
export async function analyseFarewell(input: AnalyseInput): Promise<ConversationItem['result']> {
  void input;
  throw new Error('Live analysis is not connected yet.');
}
