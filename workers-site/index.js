import {
  getAssetFromKV,
  mapRequestToAsset,
} from "@cloudflare/kv-asset-handler";

/*
Authorization code adapted from
<https://www.maxivanov.io/how-to-password-protect-your-website-with-cloudflare-workers/>
*/

/* The following are Environment variables that have to be configured per the following:
 * <https://developers.cloudflare.com/workers/platform/environment-variables/>
 * @param {string} USERNAME User name to access the page
 * @param {string} PASSWORD Password to access the page
 * @param {string} REALM A name of an area (a page or a group of pages) to protect.
 * Some browsers may show "Enter user name and password to access REALM"
 */
const USERNAME = LLMR_USERNAME;
const PASSWORD = LLMR_PASSWORD;
const REALM = "Secure area";

addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  const request = event.request;
  const authorization = request.headers.get("authorization");
  if (!request.headers.has("authorization")) {
    return getUnauthorizedResponse(
      "Provide User Name and Password to access this page."
    );
  }
  const credentials = parseCredentials(authorization);
  if (credentials[0] !== USERNAME || credentials[1] !== PASSWORD) {
    return getUnauthorizedResponse(
      "The User Name and Password combination you have entered is invalid."
    );
  }

  let options = {};

  try {
    const page = await getAssetFromKV(event, options);

    // allow headers to be altered
    const response = new Response(page.body, page);

    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "unsafe-url");
    response.headers.set("Feature-Policy", "none");

    return response;
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
}

/**
 * Break down base64 encoded authorization string into plain-text username and password
 * @param {string} authorization
 * @returns {string[]}
 */
function parseCredentials(authorization) {
  const parts = authorization.split(" ");
  const plainAuth = atob(parts[1]);
  const credentials = plainAuth.split(":");
  return credentials;
}

/**
 * Helper function to generate Response object
 * @param {string} message
 * @returns {Response}
 */
function getUnauthorizedResponse(message) {
  let response = new Response(message, {
    status: 401,
  });
  response.headers.set("WWW-Authenticate", `Basic realm="${REALM}"`);
  return response;
}
