const play = require('play-dl');

async function testStream() {
  try {
    const videoUrl = 'https://www.youtube.com/watch?v=tmFz2jWsvx4';
    const stream = await play.stream_from_info(await play.video_info(videoUrl));
    console.log('Stream created! Stream type:', stream.type);
    let bytesReceived = 0;
    stream.stream.on('data', chunk => {
      bytesReceived += chunk.length;
      if (bytesReceived > 50000) {
        console.log('SUCCESS! Received audio stream chunks, total bytes:', bytesReceived);
        stream.stream.destroy();
        process.exit(0);
      }
    });
    stream.stream.on('error', err => console.log('Stream error:', err));
  } catch (e) {
    console.log('Error:', e.message);
  }
}

testStream();
