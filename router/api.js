const express = require("express");
const router = express.Router();
const Hitomi = require("../helper/hitomi");

router.get("/hitomi/:code", async function (req, res) {
  var id = req.params.code;
  let option = {
    host: "ltn.hitomi.la",
    method: "GET",
    path: `/galleries/${id}.js`,
    headers: {
      "User-Agent": req.useragent.source,
      "Content-Type": "application/javascript; charset=UTF-8",
    },
  };
  const result = await Hitomi.getGalleryData(option);
  res.json(result);
});

router.get("/hitomi/:code/image", async function (req, res) {
  var id = req.params.code;
  images = new Array();
  files = [];
  let option = {
    host: "ltn.hitomi.la",
    method: "GET",
    path: `/galleries/${id}.js`,
    headers: {
      "User-Agent": req.useragent.source,
      "Content-Type": "application/javascript; charset=UTF-8",
    },
  };
  const result = await Hitomi.getGalleryData(option);
  this.files = result.files;
  if (this.files.length !== 0) {
    for (var i = 0; i < this.files.length; i++) {
      this.images.push(Hitomi.image_url_from_image(this.id, this.files[i]));
    }
  }
  res.json(images);
});


module.exports = router;
