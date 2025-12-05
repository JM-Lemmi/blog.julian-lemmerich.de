+++
title = "Reverse-proxy with nginx on a Mikrotik Router"
date = 2025-12-05
author = "Julian Lemmerich"
summary = "Besides using Wireguard, a reverse-proxy is a nice and user-friendly way of exposing services from the Homelab. In my third generation Homelab I will use Mikrotik Containers to host my DMZ reverse proxy based on nginx to allow secure access to Immich."
language = "en_GB"
tags = ["Homelab"]
+++

As part of my thrid generation of Homelab I have left behind Unifi and moved my Router to Mikrotik. This comes with a bunch of exiting stuff to try out. A Feature of RouterOS v7 I am very exited about are Containers. In this article I will describe my new DMZ Proxy that is running as a container on my Mikrotik.

## Setting up the Container on Mikrotik

My router is a [Mikrotik hap-ax²](https://mikrotik.com/product/hap_ax2). The staggering 1GB of RAM is a massive increase in comparison with the previous models.
Together with the ARM-CPU and the ability to run Linux Containers in RouterOS v7, this allows to run network-services on the Router itself.
A downside of the ax² versus the ax³ is the missing USB-Port and only 128MB of Flash. This means this Router has 8x as much RAM as Flash, which I didnt realize when purchasing.
However this machine is still perfectly capable to run the containers I want to use in my DMZ.

The [Mikrotik Documentation for containers](https://help.mikrotik.com/docs/spaces/ROS/pages/84901929/Container#Container-RunningPi-hole) is a very helpful starting guide.

After enabling containers and restarting the device we will first create the DMZ network and interface:

```
/interface/bridge/add bridge=container
/ip/address/add address=192.168.20.65/26 interface=containers
/interface/veth/add name=cont1 address=192.168.20.66/26 gateway=192.168.20.65
/interface/bridge/port add bridge=container interface=cont1
```

I will not be configuring NAT for this interface. The WAN interface already has a default NAT rule for outgoing traffic, and traffic inside my Network is only hindered by NAT.

Now we create the configuration for the container. This includes creating a tmpfs mount for the container image. Since the ax² has so little flash storage, we do not want the image to be stored on this flash storage. If the router reboots, the image can be pulled from the registry again.

```
/disk add type=tmpfs tmpfs-max-size=250M path=tmp
/container/mounts/add name=MOUNT_PROXY_CONF src=proxy-conf dst=/etc/nginx/conf.d
/container/config/set registry-url=https://registry-1.docker.io
/container/config/set username=*****
/container/config/set password=*****
/container/add remote-image=library/nginx:stable-alpine-slim interface=cont1 root-dir=tmp/proxy mounts=MOUNT_PROXY_CONF name=proxy hostname=proxy.dmz.hn.julian-lemmerich.de dns=192.168.20.67 start-on-boot=yes 
```

And then start the container (once we have configured nginx)

```
/container/start proxy
```

## Configuration for nginx

The remote file system of the Router can be accessed via sftp, which we will use to upload configuration and other data.

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

One of the changes to the previous setup is that all files are in the `/etc/nginx/conf.d/` directory, because I have mounted this directory from the Router filesystem to the container. On the regular nginx setup the certificates and the htpasswd file were in different directories.

The htpasswd file can be generated using the `htpasswd` command from the `apache2-utils` package on Linux:

```
htpasswd -c .htpasswd lemmerich
```

This creates an easy extra layer of security for all services behind the proxy, when accessed from the internet, which is also compatible with immich for example with the "Proxy-Header" option.
I do not feel comfortable exposing services like immich or home assistant directly to the internet without an extra layer of authentication that is independent of the service itself. A bug in the service is in my opinion more likely than a bug in the nginx basic_auth implementation.

However the Client Apps also need to support the option to use an additional Header or Auth. Immich supports this, the HomeAssistant App does not so far.

## Configuring certificates

The biggest difference to my previous setup is, that I do not manage the certificates here. Instead I use certbot on another machine to generate the certificates and then copy them over to the router using sftp.

I am using the certbot hetzner-dns plugin to get certificates for my hetzner hosted domain. The command to get a new certificate looks like this:

```
certbot certonly --dns-hetzner --dns-hetzner-credentials /etc/letsencrypt/credentials.ini -d '*.home.julian-lemmerich.de' -d 'home.julian-lemmerich.de'
```

In the renewal configuration (`/etc/letsencrypt/renewal/home.julian-lemmerich.de.conf`) I have added a post-hook to copy the new certificates to the router after every renewal:

```
post_hook = scp /etc/letsencrypt/live/home.julian-lemmerich.de/{fullchain.pem,privkey.pem} admin@gw.hn.julian-lemmerich.de:proxy-conf/
```

to allow the copy process to work without password prompt, I have setup ssh-keys between the certbot machine and the router.
