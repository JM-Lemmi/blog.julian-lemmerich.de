# Reverse-proxying with bare nginx in a dockerized setup

partly taken from here: https://mindsers.blog/post/https-using-nginx-certbot-docker/

## configure docker compose

```yml
services:
  proxy:
    image: nginx:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    networks:
      front:
        ipv6_address: 2a01:4f8:c010:4377:ddd0::ff
        aliases:
        - proxy
    volumes:
      - "/srv/web/proxy/conf/:/etc/nginx/conf.d/:ro"
      - "/srv/web/proxy/certbot/www/:/var/www/certbot/:ro"
      - "/srv/web/proxy/certbot/conf/:/etc/nginx/ssl/:ro"
  certbot:
    image: certbot/certbot:latest
    volumes:
    - "/srv/web/proxy/certbot/www/:/var/www/certbot/:rw"
    - "/srv/web/proxy/certbot/conf/:/etc/letsencrypt/:rw"
```

## configure default nginx

`/proxy/conf/default.conf`

```conf
server {
    listen 80;
    listen [::]:80;

    server_name ~^(.*)\.julian-lemmerich\.de$ ;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

## configure cert

docker-compose run --rm  certbot certonly --webroot --webroot-path /var/www/certbot/ -d beta-cal.julian-lemmerich.de

## configure service

`/proxy/conf/beta-cal.julian-lemmerich.de.conf`

The name does not have to match the domain name, but its nice for organizing. you could also put all of them into default.conf

```conf
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name beta-cal.julian-lemmerich.de;

    ssl_certificate /etc/nginx/ssl/live/beta-cal.julian-lemmerich.de/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/beta-cal.julian-lemmerich.de/privkey.pem;
    
    location / {
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP         $remote_addr;
    	proxy_pass http://ical-beta/;
    }
}
```

`docker-compose restart proxy`

## adding a http server

`/proxy/conf/whoami.julian-lemmerich.de.conf`

```conf
server {
    listen 80;
    listen [::]:80;

    server_name whoami.julian-lemmerich.de;

    location / {
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP         $remote_addr;
    	proxy_pass http://whoami/;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name whoami.julian-lemmerich.de;

    ssl_certificate /etc/nginx/ssl/live/whoami.julian-lemmerich.de/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/whoami.julian-lemmerich.de/privkey.pem;
    
    location / {
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP         $remote_addr;
    	proxy_pass http://whoami/;
    }
}
```
