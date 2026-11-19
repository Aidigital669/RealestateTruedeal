const { parseAndNormalizeVideoUrl } = require('./src/lib/video-utils');

const urls = [
  'https://youtube.com/shorts/fU1BD3v2Wno?si=1HDM8yq8Sc59psjo',
  'https://www.youtube.com/shorts/fU1BD3v2Wno',
  'https://youtu.be/fU1BD3v2Wno',
  'https://www.youtube.com/watch?v=fU1BD3v2Wno',
  'fU1BD3v2Wno'
];

for (const u of urls) {
  console.log(u, '=>', parseAndNormalizeVideoUrl(u));
}
