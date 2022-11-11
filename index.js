import express from "express";
import cors from "cors";
import ytdl from "ytdl-core";
import requestPromise from "request-promise";
import prettyMs from "pretty-ms";
express ()
.use (cors ({
    origin: '*'
}))
.get ('/', (req, res) => {
    res.send ('ok boomer');
})
.get ('/search/:songName', async ({  params }, response) => {
    const items = await search ({ Text: params.songName });
    response.json (items);
})
.get ('/download/:url', async ({ params }, response) => {
    const itemInfo = await ytdl.getInfo (params.url, {
        lang: 'ar'
    });
    response.json ({
        stream: itemInfo.formats.filter (b => b.hasAudio).sort ((a, b) => b.audioBitrate - a.audioBitrate)[0].url,
        related: itemInfo.related_videos.map (video => {
            return ({
                url: 'https://youtube.com/watch?v=' + video.id,
                title: video.title,
                duration: prettyMs (video.length_seconds * 1000, { colonNotation: true}),
                thumbnail: video.thumbnails[0].url,
                author: video.author.name
            });
        })
    });
})
.listen (process.env.PORT || 3000);
async function search ({ Text }) {
    return new Promise (async (Resolve, Reject) => {
      var Assets = JSON.parse (await requestPromise ('https://www.youtube.com/results?pbj=1&sp=EgIQAQ%253D%253D&search_query=' + encodeURI (Text).split (' ').join ('+'), {
        headers: {
          'x-youtube-client-name': '1',
          'x-youtube-client-version': '2.20200304.01.00',
          'cookie': 'PREF=hl=ar&gl=sa'
        }
      }))[1].response.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents,
          Tracks = Assets.filter (Track => Track.videoRenderer && Track.videoRenderer.publishedTimeText).map (Track => {
            var { title, thumbnail, videoId, publishedTimeText, lengthText, viewCountText, ownerText, channelThumbnailSupportedRenderers } = Track.videoRenderer;
            return {
                duration: lengthText.simpleText,
              url: 'https://youtube.com/watch?v=' + videoId,
              thumbnail: thumbnail.thumbnails[0].url,
              title: title.runs[0].text,
              author: ownerText.runs[0].text
            }
          });
      Resolve (Tracks);
    });
  }
