+++
title = "Reverse-proxy with nginx on a Mikrotik Router"
date = 2025-11-06
author = "Julian Lemmerich"
summary = "Every Docker Setup nowadays needs a reverse proxy and there are a lot of different choices. After trying both Traefik and NGINX Proxy Manager, but having troubles with them, I decided to use a bare nginx container. This setup needs a bit more attention, but its also much lighter and easier to maintain in my opinion."
language = "en_GB"
+++

As part of my thrid generation of Homelab I have left behind Unifi and moved my Router to Mikrotik. This comes with a bunch of exiting stuff to try out. A Feature of RouterOS v7 I am very exited about are Containers. In this article I will describe my new DMZ Proxy that is running as a container on my Mikrotik.

## Setting up the Container on Mikrotik

```
/interface/veth/add name=cont1 address=192.168.20.66/26 gateay=192.168.20.65
/ip/address/add address=192.168.20.65/26 interface=containers
/interface/bridge/port add bridge=container interface=cont1
/container/mounts/add name=MOUNT_PROXY_CONF src=proxy-conf dst=/etc/nginx/conf.d
/container/add remote-image=library/nginx:stable-alpine-slim interface=cont1 root-dir=tmp/proxy mounts=MOUNT_PROXY_CONF name=proxy
```

## Configuration for nginx

Using sftp, the remote file system of the Router can be accessed.

```
sftp admin@gw.hn.julian-lemmerich.de:/proxy-conf/
```

The configuration is a normal nginx proxy configuration, that I have used on my reverse-proxy before. Here is an example for my immich:

```
server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name immich.home.julian-lemmerich.de;

    ssl_certificate /etc/nginx/conf.d/fullchain.pem;
    ssl_certificate_key /etc/nginx/conf.d/privkey.pem;

    auth_basic "Home";
    auth_basic_user_file /etc/nginx/conf.d/.htpasswd;
    
    proxy_buffering off;

    location / {
        proxy_pass http://192.168.21.31:2283;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_redirect off;

        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        send_timeout       600s;
    }
}
```

One of the changes to the previous setup is that all files are in the `/etc/nginx/conf.d/` directory, because I have mounted this directory from the Router filesystem to the container. On the regular nginx setup the certificates and the htpasswd file where in different directories.

The htpasswd file can be generated using the `htpasswd` command from the `apache2-utils` package on Linux:

```
htpasswd -c .htpasswd lemmerich
```

This makes an easy extra layer of security for all services behind the proxy, when accessed from the internet, which is also compatible with immich for example with the "Proxy-Header" option. I do not feel comfortable exposing services like immich or home assistant directly to the internet without an extra layer of authentication that is independent of the service itself. A bug in the service can happen and is more likely than a bug in the nginx basic_auth implementation.

## Configuring certificates

The biggest differene to my previous setup is, that I do not use automatic certificate management here. Instead I use certbot on another machine to generate the certificates and then copy them over to the router using sftp.

I am using the certbot hetzner-dns plugin to get certificates for my hetzner hosted domain. The command to get a new certificate looks like this:

```
certbot certonly --dns-hetzner --dns-hetzner-credentials /etc/letsencrypt/credentials.ini -d '*.home.julian-lemmerich.de' -d 'home.julian-lemmerich.de'
```

In the renewal configuration (`/etc/letsencrypt/renewal/home.julian-lemmerich.de.conf`) I have added a post-hook to copy the new certificates to the router after every renewal:

```
post_hook = scp /etc/letsencrypt/live/home.julian-lemmerich.de/fullchain.pem
```

to allow the copy process to work without password prompt, I have setup ssh-keys between the certbot machine and the router.

% TODO %
