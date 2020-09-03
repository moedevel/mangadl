const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const useragent = require("express-useragent");
const app = express();

const nhentai = require("./router/nhentai");
const api = require("./router/api");
const download = require("./router/download");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use(useragent.express());

// router app use
app.use("/nhentai", nhentai);
app.use("/api", api);
app.use("/download", download);

app.get("/", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  res.type("json");
  res.send(
    '{"name": "mangadl", "web": "https://github.com/moedevel/mangadl", "description": "Web and Desktop App Manga-Doujinshi Browse, Download, Favorites",  "api_version": "v0.0.2", "api_code": 1, "endpoint": { "nhentai": { "zip": "/download/nhentai/:code/zip", "cbz": "/download/nhentai/:code/cbz" }, "komiku": { "zip": "/download/komiku/:code/zip", "pdf": "/download/komiku/:code/pdf" }}}'
  );
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
