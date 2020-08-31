# Mangadl

[![Support via PayPal](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/iqbalrifai/)

Web and Desktop App for Browse Manga/Doujinshi, Download without Torrent, Support Favorites.

# Desktop app
[Download](https://nah.moedev.co)

# Install
- Register [Heroku](https://dashboard.heroku.com/), 
- Push Deploy Button.  

[![](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/moedevel/mangadl)

## Features
- ZIP/CBZ Download
- Favorites Support
- Login with Cookies

### API
```
Favorite:
/nhentai/api/favorite
/nhentai/api/favorite?page=${page}

Download:
nHentai:
Downlaod page: /download/nhentai
zip Download : /download/nhentai/${gallery_id}/zip
cbz Download : /download/nhentai/${gallery_id}/cbz

Komiku: 
zip Download : /download/komiku/${chapter_id}/zip
pdf Download : /download/komiku/${chapter_id}/pdf

Hitomi.la Api:
Gallery : /api/hitomi/${gallery_id}
Image : /api/hitomi/${gallery_id}/image

```

###### © 2020 Iqbal Rifai, WTFAL License

