export const SCENARIOS = [
  {
    id: 'destructive-customer-email',
    title: 'Drop the production email field',
    intent: {
      assetQuery: 'commerce.customer_profile',
      environment: 'PROD',
      operation: 'Drop the email column from the customer profile dataset',
      fields: ['email'],
      requestedBy: 'coding-agent',
      rationale: 'The downstream CRM export no longer needs it.'
    }
  },
  {
    id: 'safe-product-description',
    title: 'Document an anonymous event dataset',
    intent: {
      assetQuery: 'commerce.product_events',
      environment: 'PROD',
      operation: 'Update the dataset description to clarify event retention',
      fields: [],
      requestedBy: 'coding-agent',
      rationale: 'Improve catalog documentation.'
    }
  }
];

export function scenarioById(id) {
  return SCENARIOS.find((scenario) => scenario.id === id);
}

