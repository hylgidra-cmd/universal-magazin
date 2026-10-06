// Vercel Serverless Function: Proxy requests to backend (postore-phi.vercel.app)
// Resolves 405 Method Not Allowed and CORS issues on Vercel deployments

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let subPath = '';
    if (req.query && req.query.path) {
      subPath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    } else if (req.url) {
      subPath = req.url.replace(/^\/api\/proxy\??/, '').replace(/^\/api\/?/, '');
    }

    // Strip leading /
    subPath = subPath.replace(/^\/+/, '');

    // Reconstruct other query parameters (excluding 'path')
    const queryParams = new URLSearchParams();
    if (req.query) {
      for (const [key, val] of Object.entries(req.query)) {
        if (key !== 'path') {
          if (Array.isArray(val)) {
            val.forEach((v) => queryParams.append(key, v));
          } else {
            queryParams.append(key, val);
          }
        }
      }
    }

    // Build final path with trailing slash for Django
    let finalPath = `/api/${subPath}`;
    if (!finalPath.endsWith('/')) {
      finalPath += '/';
    }

    const queryString = queryParams.toString();
    const targetUrl = `https://postore-phi.vercel.app${finalPath}${queryString ? '?' + queryString : ''}`;

    const forwardHeaders = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };
    if (req.headers['authorization']) {
      forwardHeaders['Authorization'] = req.headers['authorization'];
    }

    let body = undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (req.body) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const responseText = await backendResponse.text();
    const contentType = backendResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    return res.status(backendResponse.status).send(responseText);
  } catch (error) {
    console.error('API Proxy error:', error);
    return res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
}
