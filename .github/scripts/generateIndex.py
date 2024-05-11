import os
import json

files = os.listdir(os.getcwd())
files = [file for file in files if file.endswith(".json")]
files.sort(reverse=True) # to have the newest post first

preContent = """
<html>
  <head>
    <title>Julian Lemmerich's Blog</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://www.julian-lemmerich.de/style.css">
  </head>
  <body>
    <div class="topnav">
      <a href="https://www.julian-lemmerich.de/">Home</a>
      <a class="active" href="https://blog.julian-lemmerich.de/">Blog</a>
      <a href="https://photos.julian-lemmerich.de/">Photography</a>
      <a href="https://www.julian-lemmerich.de/about.html">About</a>
    </div>
    <div id='content'>
      <h1 id="julian-lemmerichs-blog">Julian Lemmerich's Blog</h1>
      <p>Welcome to my Blog!</p>
      <h2 id="articles">Articles</h2>
"""

content = ""
for file in files:
   if file.endswith(".json"):
    with open(file, 'r') as f:
      metadata = json.load(f)
      content += f"""
      <h3 id="{metadata['title'].replace(' ', '-').lower()}"><a href="{file.replace('.json', '.html')}">{metadata['title']}</a></h3>
      <p>{metadata['date']}</p>
      <p>{metadata['description']}</p>
      """

postContent = """
    </div>
  </body>
</html>
"""

html = preContent + content + postContent

with open(os.getcwd() + "/dist/index.html", "w") as file:
    file.write(html)
    print("Done, saved to " + os.getcwd() + "/dist/index.html")
