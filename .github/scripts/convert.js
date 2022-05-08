// based on https://github.com/KrauseFx/markdown-to-html-github-style

var showdown  = require('showdown');
var fs = require('fs');
var files = fs.readdirSync(process.cwd() + '/');
let styleLink = "./style.css";

// run for every file in the current directory
files.forEach(function(file) {
  // if the file is a markdown file
  if (file.match(/\.md$/)) {
    fs.readFile(process.cwd() + '/' + file, function (err, data) {
      if (err) {
        throw err; 
      }
      let text = data.toString();

      let pageTitle = text.match(/^# (.*)/);
    
      converter = new showdown.Converter({
        ghCompatibleHeaderId: true,
        simpleLineBreaks: true,
        ghMentions: true,
        tables: true
      });
      converter.setFlavor('github');
    
      let preContent = `
      <html>
        <head>
          <title>` + pageTitle + `</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="stylesheet" href="` + styleLink + `">
        </head>
        <body>
          <div class="topnav">
            <a href="https://www.julian-lemmerich.de/">Home</a>
            <a class="active" href="https://blog.julian-lemmerich.de/">Blog</a>
            <a href="https://photos.julian-lemmerich.de/">Photography</a>
            <a href="https://www.julian-lemmerich.de/aboutme.html">About</a>
          </div>
          <div id='content'>
      `
      let postContent = `
          </div>
        </body>
      </html>`;
      html = preContent + converter.makeHtml(text) + postContent

      if (!fs.existsSync(process.cwd() + "/dist/")){
        fs.mkdirSync(process.cwd() + "/dist/");
      }
      let filePath = process.cwd() + "/dist/" + file.replace(/\.md$/, '.html');
      fs.writeFile(filePath, html, { flag: "wx" }, function(err) {
        if (err) {
          console.log("File '" + filePath + "' already exists. Aborted!");
        } else {
          console.log("Done, saved to " + filePath);
        }
      });
    });
  }
}); 