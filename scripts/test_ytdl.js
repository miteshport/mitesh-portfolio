const ytdl = require('@distube/ytdl-core');

async function test() {
  try {
    const videoUrl = 'https://www.youtube.com/watch?v=tmFz2jWsvx4';
    console.log('Fetching info for:', videoUrl);
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
    console.log('SUCCESS! Video Title:', info.videoDetails.title);
    console.log('Direct audio stream URL found:', format.url ? format.url.substring(0, 80) + '...' : 'none');
  } catch (e) {
    console.log('Error:', e.message);
  }
}

test();
