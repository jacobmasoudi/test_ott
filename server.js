const express = require("express");
const app = express();
app.use(express.json());
const axios = require("axios");
const { response } = require("express");

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`listening on  port ${PORT}`));

app.get("/vidaudit", async (req, res) => {
  try {
    const query = req.query;
    const pageNumber = query.pageNumber;
    const pageSize = query.pageSize;
    if (!pageNumber || pageNumber < 1 || !pageSize || pageSize < 1) {
      return res.status(400).json({
        success: false,
        message: "Error in pageSize and/or pageNumber ",
      });
    }

    const result = await axios.get(
      `http://api.toongoggles.com/getobjects?version=12&object_type=video&video_type=feature&start=${
        pageNumber - 1
      }&max=${pageSize}`
    );

    //ordering array by duration descending order
    let videos = result.data.objects.sort((a, b) => a.duration - b.duration);

    // //-------------reformatting the code response
    formatted_videos = videos.map((vid) => {
      //-------------formatting ad_breaks
      vid.ad_breaks = vid.ad_breaks.map(
        (break_duration) =>
          new Date(break_duration * 1000).toISOString().substr(11, 8) //-----> converting ad_breaks into hh:mm:ss
      );
      return vid;
    });

    const mini_videos = videos.map((vid) => {
      return {
        id: vid.id,
        ad_breaks: vid.ad_breaks,
        duration: new Date(vid.duration * 1000).toISOString().substr(11, 8), //-----> converting duration into hh:mm:ss
        allowedCountries: vid.allowed_countries.map((country) => country.name),
        entryId: new RegExp("(?<=entryId/)(.*)(?=/format)").exec(
          vid.video_url
        )[0],
        hasWideScreenUrl:
          new URL(vid.thumbnail_url).hostname == "imgX.static-ottera.com" &&
          vid.thumbnail_url.includes("/widescreen/"),
      };
    });

    const formattedResult = {
      numItemsReturns: result.data.num_results,
      videos: mini_videos,
    };
    res.send(formattedResult);
  } catch (error) {
    json({ success: false, error });
    console.log(error);
  }
});
