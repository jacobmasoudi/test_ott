const express = require("express");
const app = express();
app.use(express.json());
const axios = require("axios");

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
        message: "Error in pageSize and/or pageNumber paramters",
      });
    }
    const result = await axios
      .get(
        "http://api.toongoggles.com/getobjects?version=12&object_type=video&video_type=feature&start=${pageNumber -1}&max=${pageSize}"
      )
      .then((response) => res.send(response.data));
    //-------------ordering array by duration descending order
    let videos = (result.data.videos = result.data.objects.map((vid) => {
      //-------------formatting duration
      const ad_breaks = vid.ad_breaks.map(
        (break_duration) =>
          new Date(break_duration * 1000).toISOString().substr(11, 8) //-----> converting ad_breaks into hh:mm:ss
      );
      console.log(ad_breaks);
      //---------- using Regex to Extract entryId String
      const videoUrl = vid.video_url;
      const regex = /entryId/;
      let m;

      if ((m = regex.exec(videoUrl)) !== null) {
        m.forEach((match) => {
          console.log(`Found match  ${match}`);
        });
      }

      //----------formatting allowedCountries
      const allowedCountries = vid.allowed_countries.map(
        (country) => country.name
      );
      return {
        id: vid.id,
        name: vid.name,
        duration: new Date(vid.duration * 1000).toISOString().substr(11, 8), ///----->converting duration into hh:mm:ss
        ad_breaks,
        hasWidescreenThumbnail,
        entryId,
        allowedCountries,
      };
    }));
    const formattedResult = {
      numItemsReturns: result.data.total_results,
      videos,
    };
    res
      .status(200)
      .json({ success: true, formattedResult, result: result.data.objects });
  } catch (error) {
    res.status(400).json({ success: false, error });
  }
});
