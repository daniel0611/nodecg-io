import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
const Twitter = require("twitter");


interface TwitterServiceConfig {
	oauthConsumerKey: string,
	oauthConsumerSecret: string,
	oauthToken: string,
	oauthTokenSecret: string,
}

export interface TwitterServiceClient {
    //getRawClient(): ChatClient
}

module.exports = (nodecg: NodeCG): ServiceProvider<TwitterServiceClient> | undefined => {
    nodecg.log.info("Twitter bundle started");
    const core: NodeCGIOCore | undefined = nodecg.extensions["nodecg-io-core"] as any;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Twitter bundle won't function without it.");
        return undefined;
    }

    const service: Service<TwitterServiceConfig, TwitterServiceClient> = {
        schema: core.readSchema(__dirname, "../twitter-schema.json"),
        serviceType: "twitter",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient
    };

    return core.registerService(service);
};

async function validateConfig(config: TwitterServiceConfig): Promise<Result<void>> {
	try {
		// Try to connect to twitter
		const client = new Twitter({
			consumer_key: config.oauthConsumerKey,
			consumer_secret: config.oauthConsumerSecret,
			access_token_key: config.oauthToken,
			access_token_secret: config.oauthTokenSecret,
		});
		// Validate credentials - not sure if this works tho
		const resp = await client.get('account/verify_credentials');  // Check for errors in JSON response
		return emptySuccess();
	} catch (err) {
		return error(error.toString());
	}
}

function createClient(nodecg: NodeCG): (config: TwitterServiceConfig) => Promise<Result<TwitterServiceClient>> {
    return async (config) => {
		try {
			nodecg.log.info("Connecting to twitter ...");
			const client = new Twitter({
				consumer_key: config.oauthConsumerKey,
				consumer_secret: config.oauthConsumerSecret,
				access_token_key: config.oauthToken,
				access_token_secret: config.oauthTokenSecret,
			});
			nodecg.log.info("Successfully connected to twitter!")
			// Validate credentials - not sure if this works tho
			const resp = await client.get('account/verify_credentials');  // Check for errors in JSON response
			nodecg.log.info(resp);

            return success({
                getRawClient() {
                    return client;
                }
            });

		} catch (err) {
            return error(err.toString());
		}
    };
}

function stopClient(client: TwitterServiceClient): void {
    // quit currently doesn't work, so we settle for removeListener for now til the fix for that bug is in a stable version.
    // See https://github.com/d-fischer/twitch/issues/128,
    // https://github.com/d-fischer/twitch/commit/3d01210ff4592220f00f9e060f4cb47783808e7b
    // and https://github.com/d-fischer/connection/commit/667634415efdbdbfbd095a160c125a81edd8ec6a
    // client.getRawClient().removeListener();
    // client.getRawClient().quit()
    //     .then(r => console.log("Stopped twitch client successfully."))
}
