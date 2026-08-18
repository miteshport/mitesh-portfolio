const play = require('play-dl');

async function test() {
  try {
    const videoUrl = 'https://www.youtube.com/watch?v=tmFz2jWsvx4';
    console.log('Testing play-dl for:', videoUrl);
    const info = await play.video_info(videoUrl);
    console.log('Video title:', info.video_details.title);
    const source = await play.stream(videoUrl, { quality: 2 });
    console.log('Stream type:', source.type);
    console.log('Stream URL available:', source.url ? 'Yes, direct url!' : 'Stream object/pipe ready');
  } catch (e) {
    console.log('Error:', e.message);
  }
}

test();
