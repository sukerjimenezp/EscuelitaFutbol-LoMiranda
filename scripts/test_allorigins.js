async function test() {
  try {
    const res = await fetch('https://api.allorigins.win/raw?url=https://www.youtube.com/channel/UCPKY87Gjxxyw1LiCYcxgs3w/live');
    const text = await res.text();
    console.log("Length:", text.length);
    console.log("isLiveBroadcast:", text.includes('"isLiveBroadcast":true'));
    console.log("Video ID match:", text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)?.[1]);
  } catch (e) {
    console.log("Error:", e);
  }
}
test();
