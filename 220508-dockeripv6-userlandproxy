# The Docker IPv6 Userland Proxy

Everybody knows, that the Docker IPv6 support is lackluster at best.

By default, when exposing a port with the `-p` flag it will be exposed both in IPv4 and IPv6 and if a v6 request comes it, Docker will NAT64 the traffic for the container. The container will see the traffic as coming from the host, basically hiding the IPv6 address. This is also the case, if you assign a v6 address to the container, but address the host v6 address.
This is inconsistent with the handling of IPv4-NAT, since there the container will see the traffic as coming from the actual client. Only in IPv6 the Source Address is changed by NAT.

If you now want your container to see the actual client address, you will have to address the container IPv6 address directly. But be careful! If you assign a public IPv6 address to the client, docker will not do any firewalling, regardless of the `-p` flag. You will have to configure the firewall on the host or edge correctly to not let unwanted traffic hit the container, since many images are not written with the intention of having all ports exposed and depend on this "security layer" of the Docker NAT.
But at least this allows for direct addressing of the container and the actual client address hitting the container.
