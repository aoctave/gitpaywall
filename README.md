
## GitPaywall

Authors: Daniel Wang

Published by Aoctave Co. Ltd.

# Function

When a user successfully pays you through a Stripe Payment Link, add them to a GitHub Organization to grant access to code repositories.

# Runtime

Node.js on Cloudflare Workers

# Usage

Configure your STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET and GITHUB_PAT using a var file or the Cloudflare dashboard.

Create a payment link. You'll need a custom field for the customer's GitHub username (recommended field name: "GitHub User ID")

Configure the variable GHUSER_INPUT_NAME to the custom field name without spaces or punctuation. It's 'githubuserid' if you used the recommended name.

Configure the variable PLINK_ORGS like this: `[ { "plink": "plink_1234MyPaymentLink", "org": "payingcustomers" }, { "plink": "plink_5678OtherPaymentLink", "org": "vipsupporters" } ]`

Publish to Cloudflare Workers or test it locally.

Add the URL endpoint as a webhook in your Stripe account.

Now, when a user completes checkout, the payment succeeds, and the payment link appears in our configuration variable, the customer's chosen GitHub Username will receive an invitation.
