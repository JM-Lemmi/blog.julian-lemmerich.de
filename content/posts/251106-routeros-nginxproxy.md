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

## Configuring certificates
