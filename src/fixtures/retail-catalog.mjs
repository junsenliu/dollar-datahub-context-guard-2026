export const RETAIL_CATALOG = {
  entities: {
    'urn:li:dataset:(urn:li:dataPlatform:snowflake,commerce.customer_profile,PROD)': {
      urn: 'urn:li:dataset:(urn:li:dataPlatform:snowflake,commerce.customer_profile,PROD)',
      name: 'commerce.customer_profile',
      platform: 'snowflake',
      environment: 'PROD',
      description: 'Canonical customer profile dataset used by retention, support, and churn workflows.',
      tags: ['PII', 'Tier 1'],
      owners: ['data-platform@demo.local', 'customer-insights@demo.local'],
      schema: [
        { name: 'customer_id', type: 'VARCHAR', tags: [] },
        { name: 'email', type: 'VARCHAR', tags: ['PII'] },
        { name: 'phone_number', type: 'VARCHAR', tags: ['PII'] },
        { name: 'loyalty_tier', type: 'VARCHAR', tags: [] }
      ]
    },
    'urn:li:dataset:(urn:li:dataPlatform:snowflake,commerce.product_events,PROD)': {
      urn: 'urn:li:dataset:(urn:li:dataPlatform:snowflake,commerce.product_events,PROD)',
      name: 'commerce.product_events',
      platform: 'snowflake',
      environment: 'PROD',
      description: 'Anonymous product interaction events.',
      tags: ['Internal'],
      owners: ['product-analytics@demo.local'],
      schema: [
        { name: 'event_id', type: 'VARCHAR', tags: [] },
        { name: 'event_type', type: 'VARCHAR', tags: [] },
        { name: 'occurred_at', type: 'TIMESTAMP', tags: [] }
      ]
    }
  },
  downstream: {
    'urn:li:dataset:(urn:li:dataPlatform:snowflake,commerce.customer_profile,PROD)': [
      {
        urn: 'urn:li:dataset:(urn:li:dataPlatform:snowflake,analytics.customer_360,PROD)',
        name: 'analytics.customer_360',
        type: 'dataset',
        hops: 1
      },
      {
        urn: 'urn:li:chart:(looker,customer-retention-dashboard,PROD)',
        name: 'Customer Retention Dashboard',
        type: 'dashboard',
        hops: 2
      },
      {
        urn: 'urn:li:mlModel:(mlflow,customer-churn-model,PROD)',
        name: 'Customer Churn Model',
        type: 'mlModel',
        hops: 3
      }
    ],
    'urn:li:dataset:(urn:li:dataPlatform:snowflake,commerce.product_events,PROD)': []
  }
};

