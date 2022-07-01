# Controlling OpenAutoPro with Volvo RTI IR-Remote

My 2007 Volvo V50 came with the RTI integrated Navigation System. You can control it with steering-wheel buttons or with an included IR-Remote that looks like this:

![220701-volvoir-remote.jpg](220701-volvoir-remote.jpg)

I replaced the System with a RaspberryPi and [OpenAutoPro](https://bluewavestudio.io/shop/openauto-pro-car-head-unit-solution/) for Android Auto compatibility. But since the Headunit placement in the car was never meant for touchscreens its uncomfortable and possibly dangerous to operate while driving. Ideally I'd want to use the steering wheel buttons, but until then I want to use the IR-Remote.

## Physical Setup

I got an [DEBO IR receiver](https://www.reichelt.de/entwicklerboards-ir-empfaenger-38-khz-debo-ir-38khz-p254147.html).

It is connected to the RPi like this:

| Receiver | Pi | usage |
|---|---|---|
| GND | 9 | Ground |
| VCC | 2 | 5V power |
| OUT | 12 | GPIO18, comms |

## LIRC Setup

### Kernel Module

The Software receiving the IR-Remote is [LIRC](https://www.lirc.org/).

Installation procedere taken from [Einplatinencomputer](https://www.einplatinencomputer.com/raspberry-pi-infrarot-empfaenger-und-fernbedienung-einrichten/)

First the kernel module needs to be loaded on startup. For that we have to mount the boot partition and edit the `/boot/config.txt`.

```
sudo mount -o remount,rw /boot
sudo nano /boot/config.txt
```

The `lirc-rpi` kernel module has been deprecated (as by [this stackoverflow comment](https://stackoverflow.com/a/57265984/9397749)), so instead I used `gpio-ir` and set the options.

You can just append the line to the bottom.

```
dtoverlay=gpio-ir,gpio_in_pin=18,gpio_out_pin=17,gpio_in_pull=up
```

After this, a reboot is required.

### LIRC confgi

The following `hardware.conf` file I again took completely from [Einplatinencomputer](https://www.einplatinencomputer.com/raspberry-pi-infrarot-empfaenger-und-fernbedienung-einrichten/)

You just have to paste it into `/etc/lirc/hardware.conf`

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

With the new `gpio-ir`-Kernel Module, we also need to edit `/etc/lirc/lirc_options.conf`.

```
driver          = default
device          = /dev/lirc0
```

This is the setup for lirc finished.

You can test the setup by running

```
sudo /etc/init.d/lircd stop
mode2 -d /dev/lirc0
```

Then press some buttons on the remote, and you should see numbers running over the screen.

## Recording the LIRC Remote Config file

**[Github: Volvo-Remote LIRC Config](https://github.com/JM-Lemmi/Volvo-Remotes)**

If you're using a well known remote, you might not need the next chapter. Since my Volvo Remote is rather uncommon, I had to create my own lirc config file.

### irrecord

The `irrecord`-Tool is used to record the remote. In my cas it was unsuccessful, but you can try it with the following command.

```
sudo irrecord -d /dev/lirc0 --disable-namespace
```

### manual

If irrecord doesn't work, you can manually assemble the lirc-remote from the output of `mode2`.

This chapter was mostly inspired by [Justin Yoo's Guide](https://devkimchi.com/2020/08/12/turning-raspberry-pi-into-remote-controller/).

```
sudo mode2 -m -d /dev/lirc0 > Volvo-Remote.lircd.conf
```

The `.lircd.conf` sceleton is as follows:

```
begin remote

  name   volvo
  flags RAW_CODES
  eps            25
  aeps          100

  ptrail          0
  repeat     0     0
  gap    20921


  begin raw_codes

    name BUTTON_NAME
     8996     4451      552      574      551      576
      552      576      551      579      550      575
      553     1683      577      550      551     1683
      ...
      564

  end raw_codes
end remote
```

The numbers under the name are the blocks of numbers taken from mode2. The last number from the block can be ignored.

Linux has standardised Button names. To display all the buttons your kernel supports, run

```
irrecord -l
```

Using these standard buttons, makes it poosible to later use them as keyboard input.

The finished file for my remote looks like this:

```
# Remote name (as of config file): Volvo30657371-1
# Brand of remote device, the thing you hold in your hand:
# Remote device model nr: Volvo RTI
# Remote device info url:
# Type of device controlled: Car Navigation

begin remote

  name  Volvo30657371-1
  flags RAW_CODES
  eps            25
  aeps          100

  ptrail          0
  repeat     0     0
  gap    20921


  begin raw_codes

    name KEY_UP

      279      771      283      774      279     1827
      282     1826      283      771      282     1824
      285      770      283     1828      280      772
      282      770      284
    
    name KEY_DOWN

      277      768      282      770      285     1825
      312      741      284      770      284      770
      283     1824      311     1798      285      769
      312      742      283
    
    name KEY_LEFT

      281      769      286      767      284     1825
      284      768      284     1826      284     1827
      307      742      287     1821      285      770
      283      768      286
    
    name KEY_RIGHT

      305      742      309      745      284     1823
      311     1799      309     1799      286     1823
      284      773      283     1823      309      745
      284      768      311     9200      293      742
      286      768      310     1798      284     1828
      280     1826      306     1803      281      771
      309     1799      284      770      283      768
      285     9211      282      772      283      770
      283     1825      283     1825      283     1824
      284     1824      285      773      280     1825
      283      770      285      770      284     9212
      280      770      282      772      283     1824
      284     1825      283     1827      283     1824
      284      770      282     1827      281      771
      284      770      282     9212      282      773
      282      770      282     1827      308     1800
      285     1824      283     1826      284      770
      283     1825      283      770      285      769
      283
    
    name KEY_ENTER

      305      742      312      740      312     1798
      311     1797      287     1822      309      744
      289      764      311     1799      311      741
      287      766      312
    
    name KEY_BACK
    
      280      768      284      770      312     1796
      287      767      311     1797      310      743
      313     1796      285     1827      283      766
      287      768      311
    
  end raw_codes

end remote
```

After finishing your the config file, you can copy it to `/etc/lirc/lircd.conf.d/` and restart the pi.

```
sudo cp ./Volvo30657371-1.lircd.conf /etc/lirc/lircd.conf.d/Volvo30657371-1.lircd.conf
sudo mv /etc/lirc/lircd.conf.d/devinput.lircd.conf /etc/lirc/lircd.conf.d/devinput.lircd.conf.dist
```

### Testing the Buttons

With irexec you can test, if the button presses are getting received by `lirc`.

You can configure `/etc/lirc/irexec.lircrc` to print output for each button presses.

```
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

Starting `irexec` will then show the key, that has been pressed.

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

## Using the IR-Remote as a Keyboard

For using the IR-Remote as a Keyboard I used the `lircd-uinput`-utility that came together with `lircd`. The official docs of `lircd-uinput` are [here](https://www.lirc.org/html/lircd-uinput.html).

In my case I needed the `--add-release-events`-Flag, so the button also gets release after its pressed. Otherwise its "stuck". [Stackoverflow](https://raspberrypi.stackexchange.com/a/117691)

```
pi@raspberrypi:~ $ sudo lircd-uinput -a
lircd-0.10.1[1474]: Info: lircd-uinput:  Opening log, level: Info
lircd-0.10.1[1474]: Info: Reading data from /var/run/lirc/lircd, writing to /dev/uinput
lircd-0.10.1[1474]: Info: Adding release events after a 200 ms timeout
lircd-0.10.1[1474]: Info: Using "_EVUP" as release suffix
```

### OpenAutoPro Keystrokes

OpenAuto Pro has specific keystrokes that are getting used: https://bluewavestudio.io/community/thread-2048.html

So I remapped the IR-Buttons, since this is the easier solution, even if the buttons would have a correctly named Linux Key.

The <key>right</key> and <key>left</key> are actually "scroll left" and "scroll right", so <key>1</key> and <key>2</key> need to be mapped. <key>back</key> is mapped to <key>escape</key>.

### Autostarting lircd-uinput

On the RaspberryPi you can easily add a command you want to executed as root on startup to the end of `/etc/rc.local`. In this case:

```
/usr/sbin/lircd-uinput -a
```
