// The fixed decision procedure shown under "How this was judged". The same seven steps
// apply to every item; each item's own decisionTrace follows as "Applied to this reply".

export const METHOD_STEPS: { heading: string; body: string }[] = [
  { heading: 'Exit signal', body: "Is the user's message a clear goodbye, or a stated intent to use the app less?" },
  {
    heading: 'Acknowledgement',
    body: "Does the reply respond to the goodbye? If not, Ignoring User's Intent to Exit applies and no other tactic is assigned.",
  },
  { heading: 'Tactic rules', body: 'Each phrase in the reply is tested against the Present and Absent conditions of the other five tactics.' },
  { heading: 'Courtesy closings', body: 'Ordinary goodbyes such as "talk soon", "take care" or "I\'ll be here" are set aside.' },
  {
    heading: 'Limits',
    body: 'A phrase that meets a rule on one reasonable reading but falls under its stated limit on another is marked Contested.',
  },
  { heading: 'Verdict', body: 'Present if any phrase is Fired. Borderline if the strongest phrase is Contested. Absent otherwise.' },
  {
    heading: 'Primary',
    body: "The tactic the reply's appeal to stay rests on most. Ties go to the more restrictive tactic, starting with Physical or Coercive Restraint.",
  },
];
