// based on https://github.com/KrauseFx/markdown-to-html-github-style

var showdown  = require('showdown');
var fs = require('fs');
var files = fs.readdirSync(process.cwd() + '/');

// run for every file in the current directory
files.forEach(function(file) {
  // if the file is a markdown file
  if (file.match(/\.md$/)) {
    fs.readFile(process.cwd() + '/' + file, function (err, data) {
      if (err) {
        throw err; 
      }

      let text = data.toString();

      // get json file with the same name
      let jsonFile = file.replace(/\.md$/, '.json');
      let metadata = JSON.parse(fs.readFileSync(process.cwd() + '/' + jsonFile));
    
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
          <title>` + metadata['title'] + `</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="stylesheet" href="https://www.julian-lemmerich.de/style.css">
          <meta property="og:title" content="` + metadata['title'] + `">
          <meta property="og:description" content="` + metadata['description'] + `">
      `
      if (metadata['image']) {
        preContent += `<meta property="og:image" content="https://blog.julian-lemmerich.de/` + metadata['image'] + `">`
      }
      preContent += `
          <meta property="og:url" content="https://blog.julian-lemmerich.de/` + file.replace(/\.md$/, '.html') + `">
          <meta property="og:locale" content="` + metadata['language'] + `">
          <meta property="og:type" content="article">
          <meta property="og:article:author" content="` + metadata['author'] + `">
          <meta property="og:article:published_time" content="` + metadata['date'] + `">
        </head>
        <body>
          <div class="topnav">
          <a href="https://www.julian-lemmerich.de/">Home</a>
          <a class="active" href="https://blog.julian-lemmerich.de/">Blog</a>
          <a href="https://www.julian-lemmerich.de/academics.html">Academics</a>
          <a href="https://wiki.julian-lemmerich.de/doku.php?id=knowledge_base:start">Knowledge Base</a>
          <a href="https://www.julian-lemmerich.de/about.html">About</a>
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