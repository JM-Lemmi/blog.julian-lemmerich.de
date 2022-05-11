# Use Eduroam on Android 11 without the geteduroam App.

The geteduroam App, that is by many institutions the recommended way of connecting to eduroam. As can be seen from the playstore reviews, it is not the greatest app there is...

Since Android 11, you can no longer use a custom certificate without naming a "Domain". You can still use eduroam without checking the certificate, but this will expose your credentials to fake eduroam APs.

## Solution

The Domain setting is just the Domain of your institution (without any subdomains), so if your E-Mail is ˋjl35byci@stud.tu-darmstadt.deˋ the domain you want to enter is ˋtu-darmstadt.deˋ.

If the connection is not succesfull immediately, don't worry. Just restart your Wifi, then it should work.

## Sidetracked Information

You can get a Certificates CN with openssl:

ˋˋˋ
openssl x509 -noout -subject -in t-telesec-globalroot-2.pem
ˋˋˋ

---

There is no guarantee that this works, this is just, what finally solved it for me and enabled me to get rid of this aweful app.