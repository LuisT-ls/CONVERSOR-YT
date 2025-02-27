/**
 * Módulo para lidar com funcionalidades relacionadas ao YouTube
 */

// Validar URL do YouTube
export function validateYouTubeUrl(url) {
  const ytRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/
  return ytRegex.test(url)
}

// Extrair ID do vídeo a partir da URL
export function extractVideoId(url) {
  // Suporta formatos:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - www.youtube.com/watch?v=VIDEO_ID
  const ytRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/
  const match = url.match(ytRegex)

  return match ? match[4] : null
}

// Obter informações do vídeo usando API do YouTube
export async function getVideoInfo(videoId) {
  try {
    // Em uma aplicação real, isso chamaria a API do YouTube
    // Para fins de demonstração, simularemos uma resposta
    // Em produção, você deve usar a API oficial do YouTube

    // Simular uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 800))

    // Simulação de dados
    return {
      title: `Vídeo #${videoId}`,
      channel: 'Canal do YouTube',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      duration: '3:45',
      views: '1.2M visualizações'
    }

    // Em uma implementação real:
    // const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=YOUR_API_KEY&part=snippet,contentDetails,statistics`);
    // const data = await response.json();
    // return {
    //   title: data.items[0].snippet.title,
    //   channel: data.items[0].snippet.channelTitle,
    //   thumbnail: data.items[0].snippet.thumbnails.medium.url,
    //   ...
    // };
  } catch (error) {
    console.error('Erro ao obter informações do vídeo:', error)
    throw new Error('Não foi possível obter informações do vídeo.')
  }
}
