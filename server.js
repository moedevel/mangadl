// server.js
// where your node app starts

// init project
const fs = require('fs');
const express = require('express');
const request = require('request');
const path = require('path');
const archiver = require('archiver');
const bodyParser = require("body-parser");
const axios = require('axios');
const app = express();
const $ = require("cheerio");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});
app.get("/download/nhentai/:code", async function(req, res, next) {
  let code = req.params.code;
  let api = {};
  try {
    let json = await axios.get(`https://nhentai.net/api/gallery/${code}`);
    api = json.data;
  } catch (e) {
    api = {
      error: true,
      message: "Gallery doesn't exist!"
    };
  }

  var start = 0;
  var end = api.num_pages;
  if (!Number.isInteger(start));
  if (!Number.isInteger(end));
  if (start > end) end = start;
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-disposition": `attachment; filename=${code}.zip`
  });
  var zip = archiver("zip", {
    store: true
  });
  zip.pipe(res);
  // zip.append(`${title}(${num})`, {name: 'title.txt'});
  let ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress;
  var msg =
    "Seseorang sedang Mendownload: \n `" +
    api.title.pretty +
    "` \n Dengan ip:\n||```" +
    ip +
    "```||";
  //Hook.info("Logs", msg);
  var now = start;
  var finish = end - start + 1;
  while (now <= end) {
    download_photo(
      `https://i.nhentai.net/galleries/${api.media_id}/${now}.`,
      now,
      0,
      function(url, name, type, cnt) {
        if (cnt <= 4) {
          var stream = request(url + type);
          zip.append(stream, {
            name: path.join(`${api.title.pretty}(${code})`, `${name}.${type}`)
          });
        }
        if (--finish === 0) zip.finalize();
      }
    );
    now++;
    await sleep(100);
  }
});
app.get('/download/pururin', async function(req, res, next) {
    var title = req.query.title;
    var url = req.query.url;
    var pages = req.query.pages;
    var num = req.query.number;
    var start = req.query.start;
    var end = req.query.end;
    var token = req.query.token;
    if (!(title && url && pages && num && token)) {
        console.log('error');
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        //let ips = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        //var msg1 = "Error Download: \n `"+title+"`,`"+num+"`  \n Dengan ip:\n||```"+ips+"```||\n url:\n||```"+fullUrl+"```||";
        //Hook.err("Logs",msg1);
        next();
        return;
    }
    start = parseInt(start); end = parseInt(end);
    if (!Number.isInteger(start)) start = 1;
    if (!Number.isInteger(end)) end = pages;
    if (start > end)
        end = start;
    res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-disposition': `attachment; filename=${num}-${title}-pururin.zip`,
            //'access-control-allow-origin': 'https://hitomi.la'
            //'Sec-Fetch-Mode': 'cors'
    });
    var zip = archiver('zip', {
        store: true
    });
    zip.pipe(res);
    // zip.append(`${title}(${num})`, {name: 'title.txt'});
    //let ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //var msg = "Seseorang sedang Mendownload: \n `"+title+"` \n Dengan ip:\n||```"+ip+"```||";
    //Hook.info("Logs",msg);
    var now = start;
    finish = end - start + 1;
    while (now <= end) {
        download_photo(`https://cdn.pururin.io/assets/images/data/${url}/${now}.`, now, 0, function(url, name, type, cnt) {
            if (cnt <= 4) {
                var stream = request(url + type);
                zip.append(stream, {name: path.join(`${title}(${num})`, `${name}.${type}`)});
            }
            if (--finish === 0)
                zip.finalize();
        });
        now++;
        await sleep(100);
    }
})
app.get('/download/asmhentai', async function(req, res, next) {
    var title = req.query.title;
    var url = req.query.url;
    var pages = req.query.pages;
    var num = req.query.number;
    var start = req.query.start;
    var end = req.query.end;
    var token = req.query.token;
    if (!(title && url && pages && token)) {
        console.log('error');
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        //let ips = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        //var msg1 = "Error Download: \n `"+title+"`,`"+num+"`  \n Dengan ip:\n||```"+ips+"```||\n url:\n||```"+fullUrl+"```||";
        //Hook.err("Logs",msg1);
        next();
        return;
    }
    start = parseInt(start); end = parseInt(end);
    if (!Number.isInteger(start)) start = 1;
    if (!Number.isInteger(end)) end = pages;
    if (start > end)
        end = start;
    res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-disposition': `attachment; filename=${url}-${title}-asmhentai.zip`,
            //'access-control-allow-origin': 'https://hitomi.la'
            //'Sec-Fetch-Mode': 'cors'
    });
    var zip = archiver('zip', {
        store: true
    });
    zip.pipe(res);
    // zip.append(`${title}(${num})`, {name: 'title.txt'});
    //let ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //var msg = "Seseorang sedang Mendownload: \n `"+title+"` \n Dengan ip:\n||```"+ip+"```||";
    //Hook.info("Logs",msg);
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
        download_photo(`https://images.asmhentai.com/${'00' + 1, 2, 3, 4, 5, 6, 7, 8, 9}/${url}/${now}.`, now, 0, function(url, name, type, cnt) {
            if (cnt <= 4) {
                var stream = request(url + type);
                zip.append(stream, {name: path.join(`${title}`, `${name}.${type}`)});
            }
            if (--finish === 0)
                zip.finalize();
        });
        now++;
        await sleep(100);
    }
})
app.get('/download/h2r', async function(req, res, next) {
    var title = req.query.title;
    var url = req.query.url;
    var pages = req.query.pages;
    var num = req.query.number;
    var start = req.query.start;
    var end = req.query.end;
    var token = req.query.token;
    if (!(title && url && pages && token)) {
        console.log('error');
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        //let ips = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        //var msg1 = "Error Download: \n `"+title+"`,`"+num+"`  \n Dengan ip:\n||```"+ips+"```||\n url:\n||```"+fullUrl+"```||";
        //Hook.err("Logs",msg1);
        next();
        return;
    }
    start = parseInt(start); end = parseInt(end);
    if (!Number.isInteger(start)) start = 1;
    if (!Number.isInteger(end)) end = pages;
    if (start > end)
        end = start;
    res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-disposition': `attachment; filename=${url}-${title}-hentai2read.zip`,
            //'access-control-allow-origin': 'https://hitomi.la'
            //'Sec-Fetch-Mode': 'cors'
    });
    var zip = archiver('zip', {
        store: true
    });
    zip.pipe(res);
    // zip.append(`${title}(${num})`, {name: 'title.txt'});
    //let ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //var msg = "Seseorang sedang Mendownload: \n `"+title+"` \n Dengan ip:\n||```"+ip+"```||";
    //Hook.info("Logs",msg);
    var now = start;
    finish = end - start + 1;
    function Padder(len, pad) {
    if (len === undefined) {
    len = 1;
    } else if (pad === undefined) {
    pad = '0';
    }

    var pads = '';
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
        download_photo(`https://static.hentaicdn.com/hentai/${url}/1/ccdn${nol.pad(now)}.`, now, 0, function(url, name, type, cnt) {
            if (cnt <= 4) {
                var stream = request(url + type);
                zip.append(stream, {name: path.join(`${title}`, `${name}.${type}`)});
            }
            if (--finish === 0)
                zip.finalize();
        });
        now++;
        await sleep(100);
    }
})

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
function sleep(ms){
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}
function get_key_ts(){
}
async function download_photo(url, filename, cnt, callback) {
    if (cnt > 4) {
        callback(0, 0, 0, cnt);
        return;
    }
    if (cnt > 0)
        await sleep(200);
    url_exist(url + 'jpg', function(exist) {
        if (exist)
            callback(url, filename, 'jpg', cnt);
        else {
            url_exist(url + 'png', function(exist) {
                if (exist)
                    callback(url, filename, 'png', cnt);
                else {
                    download_photo(url, filename, cnt + 1, callback);
                }
            })
        }
    })
}
function url_exist(url, callback) {
    var options = {
        method: 'HEAD',
        url: url
    };
    request(options, function (err, resp, body) {
        if (err)
            console.log(err);
            //Hook.err("Logs", err);
        callback(!err && resp.statusCode == 200);
    });
}