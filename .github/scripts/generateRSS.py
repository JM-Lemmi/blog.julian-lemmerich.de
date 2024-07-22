import os
import json
from datetime import datetime
from rfeed import *

files = os.listdir(os.getcwd())
files = [file for file in files if file.endswith(".json")]
files.sort(reverse=True) # to have the newest post first

items = []

for file in files:
   if file.endswith(".json"):
    with open(file, 'r') as f:
      metadata = json.load(f)
      item = Item(
        title = metadata['title'],
        link = "https://blog.julian-lemmerich.de/" + file.replace('.json', '.html'),
        description = metadata['description'],
        author = metadata['author'],
        pubDate = datetime.fromisoformat(metadata['date']),
        guid = Guid(metadata['title'])
      )
      items.append(item)

feed = Feed(
    title = "Personal blog by Julian Lemmerich",
    link = "http://blog.julian-lemmerich.de/rss",
    description = "This is my personal Blog",
    language = "de-DE",
    lastBuildDate = datetime.now(),
    items = items
    )

with open(os.getcwd() + "/dist/rss", "w") as file:
    file.write(feed.rss())
    print("Done, saved to " + os.getcwd() + "/dist/rss")
