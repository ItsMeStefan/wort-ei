FROM nginx:alpine
COPY nginx.dev.conf /etc/nginx/conf.d/default.conf
COPY index.html categories.json manifest.webmanifest sw.js /usr/share/nginx/html/
COPY 18/ /usr/share/nginx/html/18/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY assets/ /usr/share/nginx/html/assets/
