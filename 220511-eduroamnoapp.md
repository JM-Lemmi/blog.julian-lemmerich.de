# Use Eduroam on Android 11 without the geteduroam App.

The geteduroam App, that is by many institutions the recommended way of connecting to eduroam. As can be seen from the playstore reviews, it is not the greatest app there is.

Since Android 11, you can no longer use a custom certificate without naming a "Domain". You can still use eduroam without checking the certificate, but this will expose your credentials to fake eduroam APs.

## Solution

The Domain setting is just the Domain of your institution (without any subdomains), so if your E-Mail is `jl35byci@stud.tu-darmstadt.de` the domain you want to enter is `tu-darmstadt.de`.

The T-Telesec GlobalRoot Class 2 Certificate is also preinstalled (at least on my Galaxy S10e Tab S6lite with Android 12), so no need to manually download it. (If you need it, you can get it [here directly from T-Systems](https://corporate-pki.telekom.de/en/GlobalRootClass2.html))

![ScreenshotS10e-Zertspeicher](220511-eduroamnoapp-screenshot1.jpg)

The full Settings are then as follows:

![ScreenshotS10e-Wificonfig](220511-eduroamnoapp-screenshot2.jpg)

If the connection is not succesfull immediately, don't worry. Just restart your Wifi, then it should work.

## Sidetracked Information

You can get a Certificates CN with openssl:

```
openssl x509 -noout -subject -in t-telesec-globalroot-2.pem
```

---

There is no guarantee that this works, this is just, what finally solved it for me and enabled me to get rid of this aweful app.