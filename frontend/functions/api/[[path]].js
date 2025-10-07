// Cloudflare Pages Function to proxy API requests
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Reconstruct the API URL for the backend
  const apiUrl = `https://api.yposteriormente.com${url.pathname}${url.search}`;
  
  // Create new request with same method, headers, and body
  const apiRequest = new Request(apiUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  // Forward the request to the backend
  const response = await fetch(apiRequest);
  
  // Create new response with CORS headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers),
      'Access-Control-Allow-Origin': 'https://yposteriormente.com',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token'
    }
  });
  
  return newResponse;
}