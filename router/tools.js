const request = require("request");

function get_page(url, cookie, UserAgent, callback) {
  let headers;
  if (cookie.csrftoken !== 0) {
    headers = {
      "User-Agent": UserAgent,
      Cookie: `csrftoken=${cookie.csrftoken}; sessionid=${cookie.sessionid}`,
    };
  } else {
    headers = { "User-Agent": UserAgent };
  }
  request({ url: url, headers: headers }, callback);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function download_photo(url, filename, cnt, callback) {
  if (cnt > 4) {
    callback(0, 0, 0, cnt);
    return;
  }
  if (cnt > 0) await sleep(200);
  url_exist(url + "jpg", function (exist) {
    if (exist) callback(url, filename, "jpg", cnt);
    else {
      url_exist(url + "png", function (exist) {
        if (exist) callback(url, filename, "png", cnt);
        else {
          download_photo(url, filename, cnt + 1, callback);
        }
      });
    }
  });
}

function url_exist(url, callback) {
  var options = {
    method: "HEAD",
    url: url,
  };
  request(options, function (err, resp, body) {
    if (err) console.log(err);
    //Hook.err("Logs", err);
    callback(!err && resp.statusCode == 200);
  });
}

function add_string(text, keyword, add) {
  var index = text.indexOf(keyword);
  if (index === -1) {
    return text;
  } else index += keyword.length;
  return text.slice(0, index) + add + text.slice(index);
}

function process_html(body) {
  keyword = '><i class="fa fa-tachometer"></i> ';
  var index = body.indexOf(keyword) + keyword.length;
  var username = "";
  var image = "";
  while (body[index] !== "<") username += body[index++];
  console.log(username);
  body = body.replace(
    /<button class="btn btn-primary btn-thin remove-button" type="button"><i class="fa fa-minus"><\/i>&nbsp;<span class="text">Remove<\/span><\/button>/g,
    ""
  );
  body = body.replace(
    /<a href=\"\/users\/.*fa fa-tachometer.*<\/a><\/li><li>/g,
    '<i class="fa fa-tachometer"></i> ' + username + "</li><li>"
  );
  body = body.replace(/<ul class=\"menu left\">.*Info<\/a><\/li><\/ul>/, "");
  body = body.replace(
    /<a href="\/favorites\/random".*class="fa fa-random fa-lg"><\/i><\/a>/,
    ""
  );
  body = add_string(
    body,
    "<head>",
    '<meta name="referrer" content="no-referrer">'
  );
  return body;
}

module.exports = {
  get_page,
  process_html,
  download_photo,
  sleep,
  url_exist,
  add_string,
};
