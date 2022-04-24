# Reverse-proxying with bare nginx in a dockerized setup

Every Docker Setup nowadays needs a reverse proxy and there are a lot of different choices.

After trying both Traefik and NGINX Proxy Manager, but having troubles with them, I decided to use a bare nginx container. This setup needs a bit more attention, but its also much lighter and easier to maintain in my opinion.

I used some parts from this blog article: [https://mindsers.blog/post/https-using-nginx-certbot-docker/](https://mindsers.blog/post/https-using-nginx-certbot-docker/)

## First Time Setup

### Prerequisites

Point the domains you want to configure to your server and open 80 and 443 in the firewall.

### Docker compose

This is the docker-compose.yml file for the proxy and certbot.
`/srv/proxy/` is an arbitrary directory, you can change it to whatever you want.

```yml
services:
  proxy:
    image: nginx:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/srv/proxy/conf/:/etc/nginx/conf.d/:ro"
      - "/srv/proxy/certbot/www/:/var/www/certbot/:ro"
      - "/srv/proxy/certbot/conf/:/etc/nginx/ssl/:ro"
  certbot:
    image: certbot/certbot:latest
    volumes:
    - "/srv/proxy/certbot/www/:/var/www/certbot/:rw"
    - "/srv/proxy/certbot/conf/:/etc/letsencrypt/:rw"
```

### Port 80 Nginx

This assumes that you want no service exposed without SSL.

`/srv/proxy/conf/default.conf`

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

Here we match any server name with `.julian-lemmerich.de` and redirect the acme-challenge to the certbot folder. This is needed for certificate authentication.

Any other request is redirected to https. Since this is a wildcard, it will also redirect to https if the domain is not configured, but this is not a problem and will save us reconfiguring the `default.conf` file if we later add a subdomain.

---

## Per subdomain configuration

### Getting the cert

```
docker-compose run --rm  certbot certonly --webroot --webroot-path /var/www/certbot/ -d blog.julian-lemmerich.de
```

With this command we get the certificate for the domain "blog.julian-lemmerich.de". The only parameter you will need to change later is the domain at the end.

### Configure new Server in nginx

`/srv/proxy/conf/beta-cal.julian-lemmerich.de.conf`

The name of the config file does not have to match the domain name, but its nice for organizing. You could also add all of the blocks into default.conf

```conf
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name blog.julian-lemmerich.de;

    ssl_certificate /etc/nginx/ssl/live/blog.julian-lemmerich.de/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/blog.julian-lemmerich.de/privkey.pem;
    
    location / {
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header Referer           "";
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "Upgrade";
        proxy_set_header Host              $host;
        proxy_http_version 1.1;
    	proxy_pass http://blog/;
    }
}
```

This is the basic config for the domain "blog.julian-lemmerich.de". You only have to replace blog.julian-lemmerich.de with the domain you want to configure.

The `X-Forwarded-For` header is for the receiving server to know the original requestor IP. The `Referer`, `Upgrade` and `Connection` headers are needed for the websocket connection.

Finally set the proxy_pass property to the final target server. Inside the docker-compose stack you can use the service name directly. You can also add the port or write `https://` if the destination server uses https or a different port than 80.

```
docker-compose restart proxy`
```

Then we need to restart the nginx server to use the new configuration.

#### Plantext http in addition to https

If you want to add plain http in addition to the https proxying, you can add the server listening on 80 to the configuration block.

In this case we are using the whoami server, because it does not contain any sensitive information.

`/srv/proxy/conf/whoami.julian-lemmerich.de.conf`

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

## Automatic renewal

One of the nice things, most of the manaaged reverse proxies have, is automatic renewal of the certificates.
Usually certbot will renew the certificate automatically, but since the docker container we use to generate new certificates does not stay online we need another docker container that renews the existing certificates. Its gets the same volumes as our creating certbot.

We append the following service to our `docker-compose.yml`.

```yml
  certbot_renew:
    image: ghcr.io/jm-lemmi/certbot-autorenew
    depends_on:
      - proxy
    restart: unless-stopped
    volumes:
    - "/srv/web/proxy/certbot/www/:/var/www/certbot/:rw"
    - "/srv/web/proxy/certbot/conf/:/etc/letsencrypt/:rw"
```

You can see the sourcecode of the docker image [here](https://github.com/JM-Lemmi/docker-certbot-autorenew).
It uses the recommended renewal command from the certbot docs.
