const Stripe = require("stripe");
const { Octokit } = require("octokit");

export default {
	async fetch(request, env, ctx) {
		
		if (request.method !== "POST") {
			return new Response("", { status: 400 } );
		}
		 
		const stripe = new Stripe(env.STRIPE_API_KEY);
        const signature = request.headers.get("stripe-signature");
        try {
			
			if (!signature) {
				return new Response("", { status: 400 } );
			}
			const body = await request.text();
			const event = await stripe.webhooks.constructEventAsync(
				body,
				signature,
				env.STRIPE_WEBHOOK_SECRET,
				undefined,
				Stripe.createSubtleCryptoProvider()
			);
		
			if (event.type == "checkout.session.completed" && event.data.object.status == "complete") {
				
				console.log(event.data.object);
				
				var plink_org = JSON.parse(env.PLINK_ORGS).find((config) => config.plink == event.data.object.payment_link);
				// if (event.data.object.payment_link !== undefined) {   
				// payment_link may be undefined, but this is handled safely above, it simply results in undefined (no exception thrown)
				
				if (plink_org !== undefined) { // We matched the payment link to an org name
					
					// Stripe doesn't give us the form values in webhook objects, so we need to fetch the checkout session info 
					
					const checkout_session = await stripe.checkout.sessions.retrieve(event.data.object.id);
					var userid = checkout_session.custom_fields.find((element) => element.key == env.GHUSER_INPUT_NAME).text.value;
					if ( userid === undefined ) {
						console.log("Unable to retrieve username from checkout session. Make sure it's required and GHUSER_INPUT_NAME is set correctly.");
						return new Response("", { status: 500 } );
					}
					
					
					// Now, try to invite the user. Return 200 even if it fails.
					
					try { 
						const octokit_client = new Octokit({auth: env.GITHUB_PAT})
						const userinfo = await octokit_client.rest.users.getByUsername({username: userid});
						console.log("Sending GitHub invite...");
						console.log("OrgName: " + plink_org.org);
						console.log("UserID: " + userinfo.data.id);
						const invite_result = await octokit_client.rest.orgs.createInvitation({ org: plink_org.org , invitee_id: userinfo.data.id});
					} catch (err) {
						console.log("GitHub API returned an error, the user may not exist. Returning 200 to Stripe anyways. >> " + err);
						return new Response("", { status: 200 } );
					}
					
				}
				
				return new Response("", { status: 200 } );
			} else { 
				return new Response("", { status: 200 } );
			}
		
			return new Response("", { status: 200 } );
		
		} catch (err) {
			const errorMessage = `Error: ${err instanceof Error ? err.message : "Internal server error"}`
			console.log(errorMessage);
			return new Response(errorMessage, { status: 400 } );
		}

	
	},
};
