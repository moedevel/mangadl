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
const cookieParser = require('cookie-parser');
const setCookie = require('set-cookie-parser');
const Hitomi = require("./helper/hitomi");
const app = express();
const cheerio = require("cheerio");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
app.use(cookieParser());

// http://expressjs.com/en/starter/basic-routing.html
app.get('/download/nhentai', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/', function (req, res) {
	res.setHeader('Content-Type', 'application/json');    
	res.type('json')
	res.send('{"name": "mangadl", "web": "https://github.com/moedevel/mangadl", "description": "Web and Desktop App Manga-Doujinshi Browse, Download, Favorites",  "api_version": "v0.0.2", "api_code": 1, "endpoint": { "nhentai": { "zip": "/download/nhentai/:code/zip", "cbz": "/download/nhenta/:code/cbz" }, "komiku": { "zip": "/download/komiku/:code/zip", "pdf": "/download/komiku/:code/pdf" }}}');
})
//nhentai login, favorites and download 

app.get('/nhentai/login', function(req, res) {
   const cookies = req.cookies;
    if (req.query.page)
        page = req.query.page;
    if (cookies.sessionid && cookies.crftoken){ 
    res.redirect('/nhentai');
    	}else{
  		res.sendFile(__dirname + '/nhentai/login.html');
		}
});
app.post('/nhentai/login', function(req, res, next) {
        var today = new Date();
        var expire = new Date();
        expire.setDate(today.getDate() + 100);
        res.cookie('csrftoken', req.body.csrftoken,{ expires: expire});
        res.cookie('sessionid', req.body.sessionid,{ expires: expire, httpOnly: true});
        res.redirect('/nhentai');
})

app.get('/nhentai/logout', function(req, res, next) {
    res.clearCookie('sessionid');
    res.redirect('/nhentai/login');
})

app.get('/nhentai', function(req, res, next) {
    const cookies = req.cookies;
    var page = 1;
    if (req.query.page)
        page = req.query.page;
    if (cookies.sessionid && cookies.csrftoken) {
        var url = `https://nhentai.net/favorites/?page=${page}`;
        if (req.query.q)
            url += `&q=${req.query.q}`;
        get_page(url, cookies.csrftoken, cookies.sessionid, function(err, resp, body) {
            body = body.replace(/\/g\//g, '/download/nhentai/');
            body = body.replace(/\/favorites\//g, '/nhentai');
            body = body.replace(/\/logout\//g, '/nhentai/logout');
            body = process_html(body);
            res.write(body);
            res.end();
            // console.log(body);
        });

    }else {
        res.redirect('/nhentai/login');
        return;
    }
    // res.sendFile(path.join(__dirname, 'favorite', 'index.html'));
})
app.get("/nhentai/api/favorite", function (req, res, next) {
  const cookies = req.cookies;
  var page = 1;
  if (req.query.page) page = req.query.page;
  if (cookies.sessionid && cookies.csrftoken) {
    var url = `https://nhentai.net/favorites/?page=${page}`;
    if (req.query.q) url += `&q=${req.query.q}`;
    get_page(url, cookies.csrftoken, cookies.sessionid, function (
      err,
      response,
      body
    ) {
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
app.get("/download/nhentai/:code", async function(req, res, next) {
  const cookies = req.cookies;
  if (cookies.sessionid && cookies.csrftoken) {
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
}else{res.redirect('/nhentai/login');}
});
app.get('/api/hitomi/:code', async function(req, res, next,){
	var id = req.params.code;
	let option = {
            host : "ltn.hitomi.la",
            method: "GET",
            path :  `/galleries/${id}.js`,
            "headers":{
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36",
                "Content-Type" : "application/javascript; charset=UTF-8"
            },
        };
        const result = await Hitomi.getGalleryData(option);
	res.json(result);
});
app.get('/api/hitomi/:code/image', async function(req, res, next,){
	var id = req.params.code;
	images = new Array();
    	files = [];
	let option = {
            host : "ltn.hitomi.la",
            method: "GET",
            path :  `/galleries/${id}.js`,
            "headers":{
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36",
                "Content-Type" : "application/javascript; charset=UTF-8"
            },
        };
        const result = await Hitomi.getGalleryData(option);
        this.files = result.files;
	if(this.files.length !== 0){
            for(var i=0; i< this.files.length; i++){
                this.images.push(
                    Hitomi.image_url_from_image(this.id, this.files[i])
                );
            }
        }
        res.json(images);
});
app.get("/download/nhentai/:code/zip", async function(req, res, next) {
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

app.get("/download/nhentai/:code/cbz", async function(req, res, next) {
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
    "Content-disposition": `attachment; filename=${code}.cbz`
  });
  var zip = archiver("zip", {
    store: true
  });
  zip.pipe(res);
  // zip.append(`${title}(${num})`, {name: 'title.txt'});
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

app.get("/download/komiku/:code/zip", async function (req, res, next) {
  let code = req.params.code;
  let api = {};
  try {
    let json = await axios.get(`https://manga-apiw.herokuapp.com/api/chapter/${code}`);
    api = json.data;
  } catch (e) {
    api = {
      error: true,
      message: "Gallery doesn't exist!"
    };
  }

  var start = 0;
  var end = api.chapter_pages;
  if (!Number.isInteger(start));
  if (!Number.isInteger(end));
  if (start > end) end = start;
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-disposition": `attachment; filename=${api.title}.zip`
  });
  var zip = archiver("zip", {
    store: true
  });
  zip.pipe(res);
  // zip.append(`${title}(${num})`, {name: 'title.txt'});
  var now = start;
  var finish = end - start + 1;
  while (now <= end) {
    download_photo(
      `https://i0.wp.com/cdn.komiku.co.id/wp-content/uploads/${api.chapter_id}-${now}.`,
      now,
      0,
      function (url, name, type, cnt) {
        if (cnt <= 4) {
          var stream = request(url + type);
          zip.append(stream, {
            name: path.join(`${api.title}`, `${name}.${type}`)
          });
        }
        if (--finish === 0) zip.finalize();
      }
    );
    now++;
    await sleep(100);
  }
});

app.get("/download/komiku/:code/pdf", async function (req, res, next) {
  let code = req.params.code;
  let api = {};
  try {
    let json = await axios.get(`https://manga-apiw.herokuapp.com/api/chapter/${code}`);
    api = json.data;
  } catch (e) {
    api = {
      error: true,
      message: "Gallery doesn't exist!"
    };
  }
  let p = api.download_link
  res.redirect(p, 301)

  await sleep(100);
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
var UserAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36';
function get_page(url, csrftoken, sessionid, callback) {
    if (csrftoken !== 0)
        var headers = {
            'User-Agent': UserAgent,
            'Cookie': `csrftoken=${csrftoken}; sessionid=${sessionid}`,
        };
    else
        var headers = {'User-Agent': UserAgent};
    request({url: url, headers: headers}, callback);
}
function add_string(text, keyword, add) {
    var index = text.indexOf(keyword);
    if (index === -1) {
        return text;
    }else index += keyword.length;
    return text.slice(0, index) + add + text.slice(index);
}
function process_html(body) {
    keyword = '><i class=\"fa fa-tachometer\"></i> ';
    var index = body.indexOf(keyword) + keyword.length;
    var username = '';
    var image = '';
    while (body[index] !== '<')
        username += body[index++];
    console.log(username);
    body = body.replace(/<button class="btn btn-primary btn-thin remove-button" type="button"><i class="fa fa-minus"><\/i>&nbsp;<span class="text">Remove<\/span><\/button>/g, '');
    body = body.replace(/<a href=\"\/users\/.*fa fa-tachometer.*<\/a><\/li><li>/g, '<i class=\"fa fa-tachometer\"></i> ' + username + '</li><li>');
    body = body.replace(/<ul class=\"menu left\">.*Info<\/a><\/li><\/ul>/, '');
    body = body.replace(/<a href="\/favorites\/random".*class="fa fa-random fa-lg"><\/i><\/a>/, '');
    body = add_string(body, '<head>', '<meta name="referrer" content="no-referrer">' );
    return body;
}
