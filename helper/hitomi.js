const https = require("https");
var adapose = false;

function hitomiURLtoGallery(url) {
  if (url.indexOf("hitomi.la") !== -1) {
    let re = /[0-9]{1,10}.html/;
    let match = url.match(re)[1];
    if (match !== null) {
      // when url with ".html" at the end
      return url.match(re)[0].split(".")[0];
    } else {
      // when only gallery number or url without ".html" at the end
      re = /\/([0-9]+)/;
      return url.match(re)[0].split("/").pop();
    }
  } else {
    return "false";
  }
}
function image_url_from_image(galleryid, image) {
  var no_webp = image.haswebp;
  var webp;
  if (image["hash"] && image["haswebp"] && !no_webp) {
    webp = "webp";
  }

  return url_from_url_from_hash(galleryid, image, webp, undefined, undefined);
}

function parse_rawData(rawData) {
  return JSON.parse(rawData.slice(18));
}

function getGalleryData(options) {
  return new Promise((resolve, reject) => {
    let req = https
      .request(options, (res) => {
        let rawGalleryData = "";

        res.on("data", (chunk) => {
          rawGalleryData += chunk.toString();
        });

        res.on("end", async () => {
          resolve(parse_rawData(rawGalleryData));
        });
      })
      .on("error", (err) => {
        reject(err);
      });
    req.end();
  });
}

// from hitomi.la common.js

function url_from_url_from_hash(galleryid, image, dir, ext, base) {
  return url_from_url(url_from_hash(galleryid, image, dir, ext), base);
}

function url_from_hash(galleryid, image, dir, ext) {
  ext = ext || dir || image.name.split(".").pop();
  dir = dir || "images";

  return (
    "https://a.hitomi.la/" +
    dir +
    "/" +
    full_path_from_hash(image.hash) +
    "." +
    ext
  );
}

function url_from_url(url, base) {
  return url.replace(
    /\/\/..?\.hitomi\.la\//,
    "//" + subdomain_from_url(url, base) + ".uw0.workers.dev/"
  );
}

function subdomain_from_url(url, base) {
  var retval = "a";
  if (base) {
    retval = base;
  }

  var number_of_frontends = 3;
  var b = 16;

  var r = /\/[0-9a-f]\/([0-9a-f]{2})\//;
  var m = r.exec(url);
  if (!m) {
    return retval;
  }

  var g = parseInt(m[1], b);
  if (!isNaN(g)) {
    if (g < 0x30) {
      number_of_frontends = 2;
    }
    if (g < 0x09) {
      g = 1;
    }
    retval = subdomain_from_galleryid(g, number_of_frontends) + retval;
  }

  return retval;
}

function subdomain_from_galleryid(g, number_of_frontends) {
  if (adapose) {
    return "0";
  }

  var o = g % number_of_frontends;

  return String.fromCharCode(97 + o);
}

function full_path_from_hash(hash) {
  if (hash.length < 3) {
    return hash;
  }
  return hash.replace(/^.*(..)(.)$/, "$2/$1/" + hash);
}

module.exports = {
  hitomiURLtoGallery,
  image_url_from_image,
  parse_rawData,
  getGalleryData,
};
