const express = require("express");
const router = express.Router();
const qs = require("qs");
const path = require("path");
const cheerio = require("cheerio");
const tools = require("./tools");

// router for /nhentai home
router.get("/", function (req, res) {
  let cookies = req.cookies;
  let useragent = req.useragent.source;

  if (cookies.sessionid && cookies.csrftoken) {
    let query = qs.stringify({
      q: req.query.q,
      page: req.query.page,
    });
    let url = `https://nhentai.net/favorites/?${query}`;

    tools.get_page(url, cookies, useragent, function (err, response, body) {
      body = body.replace(/\/g\//g, "/download/nhentai/");
      body = body.replace(/\/favorites\//g, "/nhentai");
      body = body.replace(/\/logout\//g, "/nhentai/logout");
      body = tools.process_html(body);
      res.write(body);
      res.end();
    });
  } else {
    res.redirect("/nhentai/login");
    return;
  }
});

//router for API
router.get("/api/favorite", function (req, res) {
  let cookies = req.cookies;
  let useragent = undefined;

  if (cookies.sessionid && cookies.csrftoken) {
    let query = qs.stringify({
      q: req.query.q,
      page: req.query.page,
    });
    let url = `https://nhentai.net/favorites/?${query}`;
    tools.get_page(url, cookies, useragent, function (err, response, body) {
      // cheerio.load takes a string of HTML and returns a jQuery-like interface
      let $ = cheerio.load(body);
      let favList = [];
      // Looking for all elements with a class
      $(".gallery").each(function (i, element) {
        let $element = $(element);
        let $image = $element.find("img");
        let $title = $element.find(".caption");
        let $hID = $element.find(".cover");
        let hentai = {
          id: $hID.attr("href").match(/(?<=\/g\/).+(?=\/)/)[0],
          title: $title.html(),
          image: $image.attr("data-src"),
        };
        favList.push(hentai);
      });
      res.json(favList);
    });
  } else {
    res.redirect("/nhentai/login");
    return;
  }
});

// router for login
router.get("/login", function (req, res) {
  let cookies = req.cookies;
  if (cookies.sessionid && cookies.csrftoken) {
    res.redirect("/nhentai");
  } else {
    res.sendFile(path.join(__dirname, "../views/nhentai/login.html"));
  }
});

router.post("/login", function (req, res) {
  let today = new Date();
  let expire = new Date();
  expire.setDate(today.getDate() + 100);

  res.cookie("csrftoken", req.body.csrftoken, { expires: expire });
  res.cookie("sessionid", req.body.sessionid, {
    expires: expire,
    httpOnly: true,
  });
  res.redirect("/nhentai");
});

// router for logout
router.get("/logout", function (req, res) {
  res.clearCookie("sessionid");
  res.redirect("/nhentai/login");
});

module.exports = router;
