// Cloudflare Worker - Discord OAuth2 토큰 교환
// https://workers.cloudflare.com/ 에 배포

const CLIENT_ID = '1491978282105835530';
const CLIENT_SECRET = 'fvQC1ZsvauznNydrRJfIul5bebpUuMbM';
const REDIRECT_URI = 'https://coolestholic-cyber.github.io/raid-erp/';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /exchange - code를 token으로 교환
    if (url.pathname === '/exchange' && request.method === 'POST') {
      try {
        const { code } = await request.json();

        // Discord에 토큰 요청
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
          }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) {
          return new Response(JSON.stringify({ error: tokenData.error }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Discord 유저 정보 가져오기
        const userRes = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userRes.json();

        return new Response(JSON.stringify({
          id: userData.id,
          username: userData.username,
          global_name: userData.global_name || userData.username || `Discord유저_${(userData.id||'').substring(0,4)}`,
          avatar: userData.avatar
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator || '0') % 5}.png`,
          email: userData.email || '',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Mapleland ERP Discord Auth Worker', { headers: corsHeaders });
  },
};
