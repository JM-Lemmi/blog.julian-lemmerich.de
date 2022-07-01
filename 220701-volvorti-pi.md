# Volvo RTI IR Receiver

## phyischer aufbau

[DEBO IR will 5V](https://www.reichelt.de/entwicklerboards-ir-empfaenger-38-khz-debo-ir-38khz-p254147.html)

GND - pin 9
VCC - 5v pin 2
OUT - GPIO18 pin 12

## lirc setup

https://www.einplatinencomputer.com/raspberry-pi-infrarot-empfaenger-und-fernbedienung-einrichten/

```
sudo mount -o remount,rw /boot
sudo nano /boot/config.txt
```

https://stackoverflow.com/a/57265984/9397749

```
dtoverlay=gpio-ir,gpio_in_pin=18,gpio_out_pin=17,gpio_in_pull=up
```

https://devkimchi.com/2020/08/12/turning-raspberry-pi-into-remote-controller/, weil lirc_rpi deprecated ist

reboot

`/etc/lirc/hardware.conf`

```
# /etc/lirc/hardware.conf
#
# Arguments which will be used when launching lircd
LIRCD_ARGS="--uinput"</code>

# Don't start lircmd even if there seems to be a good config file
# START_LIRCMD=false

# Don't start irexec, even if a good config file seems to exist.
# START_IREXEC=false

# Try to load appropriate kernel modules
LOAD_MODULES=true

# Run "lircd --driver=help" for a list of supported drivers.
DRIVER="default"
# usually /dev/lirc0 is the correct setting for systems using udev
DEVICE="/dev/lirc0"
MODULES="lirc_rpi"

# Default configuration files for your hardware if any
LIRCD_CONF=""
LIRCMD_CONF=""
```

`/etc/lirc/lirc_options.conf`

```
driver          = default
device          = /dev/lirc0
```

## recording a lircd config file

```
sudo irrecord -d /dev/lirc0 --disable-namespace
```

read the text

<Add file here>

**didnt work**

instead recorded with mode2 and manually assembled file like https://devkimchi.com/2020/08/12/turning-raspberry-pi-into-remote-controller/

the button names seem to be standardised? i used this: https://forum.kodi.tv/showthread.php?tid=287862

```
sudo cp ./Volvo30657371-1.lircd.conf /etc/lirc/lircd.conf.d/Volvo30657371-1.lircd.conf
cd /etc/lirc/lircd.conf.d/
sudo mv devinput.lircd.conf devinput.lircd.conf.dist
```

reboot

### seeing if the buttons work?

`/etc/lirc/irexec.lircrc`

```
#
# Initial test configuration for systemwide irexec service.
#
# Note that the system-wide service is useful only in corner-cases.
# Most scenarios are better off with a session service as described in the
# Configuration Guide. However, note that both can also be combined.
#
# Also note that the system-wide service runs without a terminal. To
# check the output generated use something like
# 'journalctl -b0 /usr/bin/irexec'. This service just echoes some keys
# commonly available.
#

begin
    prog   = irexec
    button = KEY_LEFT
    config = echo "KEY_LEFT"
end

begin
    prog   = irexec
    button = KEY_RIGHT
    config = echo "KEY_RIGHT"
end

begin
    prog   = irexec
    button = KEY_UP
    config = echo "KEY_UP"
end

begin
    prog   = irexec
    button = KEY_DOWN
    config = echo "KEY_DOWN"
end

begin
    prog   = irexec
    button = KEY_ENTER
    config = echo "KEY_ENTER"
end

begin
    prog   = irexec
    button = KEY_BACK
    config = echo "KEY_BACK"
end
```

```
$ irexec /etc/lirc/irexec.lircrc
pi@raspberrypi:~ $ irexec /etc/lirc/irexec.lircrc
KEY_UP
KEY_LEFT
KEY_RIGHT
KEY_DOWN
KEY_ENTER
KEY_BACK
^C
```

## using buttons as keyboard

https://raspberrypi.stackexchange.com/a/117691

To list all possible keyboard events supported by the kernel run:

```
irrecord -l
```

official docs of lircd-uinput: https://www.lirc.org/html/lircd-uinput.html

```
sudo lircd-uinput
```

looking at the help, there is a --add-release-events option that is not in the docs??

```
pi@raspberrypi:~ $ sudo lircd-uinput --help

Usage: lircd-uinput [options] [socket]

Argument:
         socket: lircd output socket or test file [/run/lirc/lircd]

Options:
         -u --uinput=uinput             uinput device [/dev/uinput]
         -r --release-suffix=suffix     Release events suffix [_EVUP]
         -R --repeat=delay[,period]     Set kernel repeat parameters [none]
         -a --add-release-events        Add synthetic release events [no]
         -d --disable=file              Disable buttons listed in file
         -D[level] --loglevel[=level]   'info', 'warning', 'notice', etc., or 3..10.
         -L --logfile=file              Log file path (default: use syslog)'
         -O --options-file              Options file [/etc/lirc/lirc_options.conf]
         -h --help                      Display this message
         -v --version                   Display version
```

so starting with that flag works awesome!

```
pi@raspberrypi:~ $ sudo lircd-uinput -a
lircd-0.10.1[1474]: Info: lircd-uinput:  Opening log, level: Info
lircd-0.10.1[1474]: Info: Reading data from /var/run/lirc/lircd, writing to /dev/uinput
lircd-0.10.1[1474]: Info: Adding release events after a 200 ms timeout
lircd-0.10.1[1474]: Info: Using "_EVUP" as release suffix
```

<video>

I got the Openauto Pro keystrokes from here:

https://bluewavestudio.io/community/thread-2048.html

now the buttons have to be mapped accordingly. I think this is the easier solution, even if the buttons are named perfectly from the ir.

The keys right and left are actually "scrol left" and "scroll right", so "1" and "2" need to be mapped. Back is mapped to escape

### autostarting

add

```
/usr/sbin/lircd-uinput -a
```

to `/etc/rc.local`

## linklist

* [https://unifi.julian-lemmerich.de/manage/site/default/clients/1/50](https://unifi.julian-lemmerich.de/manage/site/default/clients/1/50)
* [https://www.einplatinencomputer.com/raspberry-pi-infrarot-empfaenger-und-fernbedienung-einrichten/](https://www.einplatinencomputer.com/raspberry-pi-infrarot-empfaenger-und-fernbedienung-einrichten/)
* [https://www.reichelt.de/entwicklerboards-ir-empfaenger-38-khz-debo-ir-38khz-p254147.html](https://www.reichelt.de/entwicklerboards-ir-empfaenger-38-khz-debo-ir-38khz-p254147.html)
* [https://de.pinout.xyz/pinout/pin2_5v_stromversorgung](https://de.pinout.xyz/pinout/pin2_5v_stromversorgung)
* [https://tutorials-raspberrypi.de/raspberry-pi-fernbedienung-infrarot-steuerung-lirc/](https://tutorials-raspberrypi.de/raspberry-pi-fernbedienung-infrarot-steuerung-lirc/)
* [https://blog.gc2.at/post/ir/](https://blog.gc2.at/post/ir/)
* [https://devkimchi.com/2020/08/12/turning-raspberry-pi-into-remote-controller/](https://devkimchi.com/2020/08/12/turning-raspberry-pi-into-remote-controller/)
* [https://wiki.libreelec.tv/configuration/ir-remotes](https://wiki.libreelec.tv/configuration/ir-remotes)
* [https://www.lirc.org/html/irexec.html](https://www.lirc.org/html/irexec.html)
* [https://www.lirc.org/html/configuration-guide.html](https://www.lirc.org/html/configuration-guide.html)
* [https://forum.kodi.tv/showthread.php?tid=287862](https://forum.kodi.tv/showthread.php?tid=287862)
* [https://www.lirc.org/html/lircd-uinput.html](https://www.lirc.org/html/lircd-uinput.html)
* [https://github.com/LibreELEC/documentation/blob/master/configuration/ir-remotes.md](https://github.com/LibreELEC/documentation/blob/master/configuration/ir-remotes.md)
* [https://bluewavestudio.io/community/showthread.php?tid=823](https://bluewavestudio.io/community/showthread.php?tid=823)
* [https://raspberrypi.stackexchange.com/questions/40184/lirc-remote-keypresses-send-to-shell](https://raspberrypi.stackexchange.com/questions/40184/lirc-remote-keypresses-send-to-shell)
* [https://www.lirc.org/html/lircd-uinput.html](https://www.lirc.org/html/lircd-uinput.html)
* [https://www.google.com/search?q=lircd-uinput+stop+repeating&oq=lircd-uinput+stop+repeating&aqs=edge..69i57.4818j0j1&sourceid=chrome&ie=UTF-8#bsht=CgRmYnNtEgQIBBAA](https://www.google.com/search?q=lircd-uinput+stop+repeating&oq=lircd-uinput+stop+repeating&aqs=edge..69i57.4818j0j1&sourceid=chrome&ie=UTF-8#bsht=CgRmYnNtEgQIBBAA)
* [https://stackoverflow.com/questions/38816306/python-lirc-keyup-function](https://stackoverflow.com/questions/38816306/python-lirc-keyup-function)
* [https://www.lirc.org/html/lircd.html](https://www.lirc.org/html/lircd.html)
* [https://www.google.com/search?q=lirc-uinput+stop+repeating+presses&oq=lirc-uinput+stop+repeating+presses&aqs=edge..69i57.5640j0j4&sourceid=chrome&ie=UTF-8#bsht=CgRmYnNtEgQIBBAA](https://www.google.com/search?q=lirc-uinput+stop+repeating+presses&oq=lirc-uinput+stop+repeating+presses&aqs=edge..69i57.5640j0j4&sourceid=chrome&ie=UTF-8#bsht=CgRmYnNtEgQIBBAA)
* [https://bluewavestudio.io/community/thread-2048.html](https://bluewavestudio.io/community/thread-2048.html)
* [https://forums.raspberrypi.com/viewtopic.php?t=14588](https://forums.raspberrypi.com/viewtopic.php?t=14588)
* [http://raspberry.tips/raspberrypi-einsteiger/raspberry-pi-autostart-von-skripten-und-programmen-einrichten#:~:text=Ein%20Init%20Script%20wird%20im,neustarten%20auch%20entsprechend%20behandelt%20wird.](http://raspberry.tips/raspberrypi-einsteiger/raspberry-pi-autostart-von-skripten-und-programmen-einrichten#:~:text=Ein%20Init%20Script%20wird%20im,neustarten%20auch%20entsprechend%20behandelt%20wird.)
* [https://unix.stackexchange.com/questions/353417/rc-local-does-not-run-program-with-parameters-correctly](https://unix.stackexchange.com/questions/353417/rc-local-does-not-run-program-with-parameters-correctly)
* [https://github.com/JM-Lemmi/Volvo-Remotes](https://github.com/JM-Lemmi/Volvo-Remotes)