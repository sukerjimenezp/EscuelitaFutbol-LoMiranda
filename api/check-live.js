export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const channelId = req.query.channelId || 'UCPKY87Gjxxyw1LiCYcxgs3w';

  try {
    const response = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8'
      },
      redirect: 'follow'
    });

    const html = await response.text();

    // Detectar si hay un live stream activo
    const isLive = html.includes('"isLiveBroadcast":true') || 
                   html.includes('"style":"LIVE"') ||
                   html.includes('"isLiveContent":true');

    // Extraer el video ID del stream
    let videoId = '';
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (videoIdMatch) videoId = videoIdMatch[1];

    // Extraer título si está disponible
    let title = '';
    const titleMatch = html.match(/"title":"([^"]+)"/);
    if (titleMatch) title = titleMatch[1];

    res.status(200).json({ 
      isLive, 
      videoId: isLive ? videoId : '',
      title: isLive ? title : '',
      channelId,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('YouTube check error:', error);
    res.status(200).json({ 
      isLive: false, 
      videoId: '', 
      title: '',
      channelId,
      error: 'Failed to check YouTube',
      checkedAt: new Date().toISOString()
    });
  }
}
