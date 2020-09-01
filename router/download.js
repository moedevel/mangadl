const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const archiver = require("archiver");
const request = require("request");
const tools = require("./tools");

router.get("/nhentai", function (req, res) {
  res.sendFile(path.join(__dirname, "../views/download/nhentai.html"));
});

// nhentai downloader
router.get("/nhentai/:code", async function (req, res) {
  let cookies = req.cookies;
  if (cookies.sessionid && cookies.csrftoken) {
    let code = req.params.code;
    let api = await getGallery(code, "nhentai");

    var start = 0;
    var end = api.num_pages;
    if (!Number.isInteger(start));
    if (!Number.isInteger(end));
    if (start > end) end = start;
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-disposition": `attachment; filename=${code}.zip`,
    });
    var zip = archiver("zip", {
      store: true,
    });
    zip.pipe(res);
    var now = start;
    var finish = end - start + 1;
    while (now <= end) {
      tools.download_photo(
        `https://i.nhentai.net/galleries/${api.media_id}/${now}.`,
        now,
        0,
        function (url, name, type, cnt) {
          if (cnt <= 4) {
            var stream = request(url + type);
            zip.append(stream, {
              name: path.join(
                `${api.title.pretty}(${code})`,
                `${name}.${type}`
              ),
            });
          }
          if (--finish === 0) zip.finalize();
        }
      );
      now++;
      await tools.sleep(100);
    }
  } else {
    res.redirect("/nhentai/login");
  }
});

router.get("/nhentai/:code/:type", async function (req, res, next) {
  let code = req.params.code;
  let type =
    req.params.type == "zip"
      ? "zip"
      : req.params.type == "cbz"
      ? "cbz"
      : undefined;
  if (type == undefined) return res.send("No type available");
  let api = await getGallery(code, "nhentai");

  var start = 0;
  var end = api.num_pages;
  if (!Number.isInteger(start));
  if (!Number.isInteger(end));
  if (start > end) end = start;
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-disposition": `attachment; filename=${code}.${type}`,
  });
  var zip = archiver("zip", {
    store: true,
  });
  zip.pipe(res);
  var now = start;
  var finish = end - start + 1;
  while (now <= end) {
    tools.download_photo(
      `https://i.nhentai.net/galleries/${api.media_id}/${now}.`,
      now,
      0,
      function (url, name, type, cnt) {
        if (cnt <= 4) {
          var stream = request(url + type);
          zip.append(stream, {
            name: path.join(`${api.title.pretty}(${code})`, `${name}.${type}`),
          });
        }
        if (--finish === 0) zip.finalize();
      }
    );
    now++;
    await tools.sleep(100);
  }
});

// komiku downloader
router.get("/komiku/:code/zip", async function (req, res) {
  let code = req.params.code;
  let api = await getGallery(code, "komiku");

  var start = 0;
  var end = api.chapter_pages;
  if (!Number.isInteger(start));
  if (!Number.isInteger(end));
  if (start > end) end = start;
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-disposition": `attachment; filename=${api.title}.zip`,
  });
  var zip = archiver("zip", {
    store: true,
  });
  zip.pipe(res);
  var now = start;
  var finish = end - start + 1;
  while (now <= end) {
    tools.download_photo(
      `https://i0.wp.com/cdn.komiku.co.id/wp-content/uploads/${api.chapter_id}-${now}.`,
      now,
      0,
      function (url, name, type, cnt) {
        if (cnt <= 4) {
          var stream = request(url + type);
          zip.append(stream, {
            name: path.join(`${api.title}`, `${name}.${type}`),
          });
        }
        if (--finish === 0) zip.finalize();
      }
    );
    now++;
    await sleep(100);
  }
});

router.get("/komiku/:code/pdf", async function (req, res) {
  let code = req.params.code;
  let api = await getGallery(code, "komiku");
  let p = api.download_link;
  res.redirect(301, p);

  await sleep(100);
});

async function getGallery(code, site) {
  let url;
  if (site == "nhentai") {
    url = `https://nhentai.net/api/gallery/${code}`;
  } else if (site == "komiku") {
    url = `https://manga-apiw.herokuapp.com/api/chapter/${code}`;
  }

  let api = {};
  try {
    let json = await axios.get(url);
    api = json.data;
  } catch (e) {
    api = {
      error: true,
      message: "Gallery doesn't exists!",
    };
  }
  return api;
}

router.get("/pururin", async function (req, res) {
  var title = req.query.title;
  var url = req.query.url;
  var pages = req.query.pages;
  var num = req.query.number;
  var start = req.query.start;
  var end = req.query.end;
  var token = req.query.token;
  if (!(title && url && pages && num && token)) {
    console.log("error");
    var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
    next();
    return;
  }
  start = parseInt(start);
  end = parseInt(end);
  if (!Number.isInteger(start)) start = 1;
  if (!Number.isInteger(end)) end = pages;
  if (start > end) end = start;
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-disposition": `attachment; filename=${num}-${title}-pururin.zip`,
    //'access-control-allow-origin': 'https://hitomi.la'
    //'Sec-Fetch-Mode': 'cors'
  });
  var zip = archiver("zip", {
    store: true,
  });
  zip.pipe(res);
  // zip.append(`${title}(${num})`, {name: 'title.txt'});
  var now = start;
  finish = end - start + 1;
  while (now <= end) {
    tools.download_photo(
      `https://cdn.pururin.io/assets/images/data/${url}/${now}.`,
      now,
      0,
      function (url, name, type, cnt) {
        if (cnt <= 4) {
          var stream = request(url + type);
          zip.append(stream, {
            name: path.join(`${title}(${num})`, `${name}.${type}`),
          });
        }
        if (--finish === 0) zip.finalize();
      }
    );
    now++;
    await sleep(100);
  }
});

router.get("/asmhentai", async function (req, res, next) {
  var title = req.query.title;
  var url = req.query.url;
  var pages = req.query.pages;
  var num = req.query.number;
  var start = req.query.start;
  var end = req.query.end;
  var token = req.query.token;
  if (!(title && url && pages && token)) {
    console.log("error");
    var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
    next();
    return;
  }
  start = parseInt(start);
  end = parseInt(end);
  if (!Number.isInteger(start)) start = 1;
  if (!Number.isInteger(end)) end = pages;
  if (start > end) end = start;
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-disposition": `attachment; filename=${url}-${title}-asmhentai.zip`,
    //'access-control-allow-origin': 'https://hitomi.la'
    //'Sec-Fetch-Mode': 'cors'
  });
  var zip = archiver("zip", {
    store: true,
  });
  zip.pipe(res);
  // zip.append(`${title}(${num})`, {name: 'title.txt'});
  var now = start;
  finish = end - start + 1;
  var regex = /^00([1-9]\d*|90*)$/;
  while (now <= end) {
    /*
    function randomNumber(min, max) {  
    return Math.floor(Math.random() * (max - min) + min); 
    }
    var fol = '00' + randomNumber(1, 10);
      */
    tools.download_photo(
      `https://images.asmhentai.com/${
        ("00" + 1, 2, 3, 4, 5, 6, 7, 8, 9)
      }/${url}/${now}.`,
      now,
      0,
      function (url, name, type, cnt) {
        if (cnt <= 4) {
          var stream = request(url + type);
          zip.append(stream, {
            name: path.join(`${title}`, `${name}.${type}`),
          });
        }
        if (--finish === 0) zip.finalize();
      }
    );
    now++;
    await sleep(100);
  }
});

router.get("/h2r", async function (req, res, next) {
  var title = req.query.title;
  var url = req.query.url;
  var pages = req.query.pages;
  var num = req.query.number;
  var start = req.query.start;
  var end = req.query.end;
  var token = req.query.token;
  if (!(title && url && pages && token)) {
    console.log("error");
    var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
    next();
    return;
  }
  start = parseInt(start);
  end = parseInt(end);
  if (!Number.isInteger(start)) start = 1;
  if (!Number.isInteger(end)) end = pages;
  if (start > end) end = start;
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-disposition": `attachment; filename=${url}-${title}-hentai2read.zip`,
    //'access-control-allow-origin': 'https://hitomi.la'
    //'Sec-Fetch-Mode': 'cors'
  });
  var zip = archiver("zip", {
    store: true,
  });
  zip.pipe(res);
  // zip.append(`${title}(${num})`, {name: 'title.txt'});
  var now = start;
  finish = end - start + 1;
  function Padder(len, pad) {
    if (len === undefined) {
      len = 1;
    } else if (pad === undefined) {
      pad = "0";
    }

    var pads = "";
    while (pads.length < len) {
      pads += pad;
    }

    this.pad = function (what) {
      var s = what.toString();
      return pads.substring(0, pads.length - s.length) + s;
    };
  }
  var nol = new Padder(4);
  while (now <= end) {
    tools.download_photo(
      `https://static.hentaicdn.com/hentai/${url}/1/ccdn${nol.pad(now)}.`,
      now,
      0,
      function (url, name, type, cnt) {
        if (cnt <= 4) {
          var stream = request(url + type);
          zip.append(stream, {
            name: path.join(`${title}`, `${name}.${type}`),
          });
        }
        if (--finish === 0) zip.finalize();
      }
    );
    now++;
    await sleep(100);
  }
});

module.exports = router;
