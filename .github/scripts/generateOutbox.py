import os
import json

files = os.listdir(os.getcwd())
files = [file for file in files if file.endswith(".json")]

notes = []

for file in files:
    with open(file, 'r') as f:
        metadata = json.load(f)
        url = "https://blog.julian-lemmerich.de/" + file.replace('.json', '.html')
        
        outboxnote = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": "https://blog.julian-lemmerich.de/activitypub/notes/" + file,
            "type": "Note",
            "content": "<p>" + metadata['title'] + "</p><p>" + metadata['description'] + "</p><p><a href=" + url + ">" + url + "</a></p>",
            "url": url,
            "attributedTo": "https://blog.julian-lemmerich.de/activitypub/actor.json",
            "to": [
                "https://www.w3.org/ns/activitystreams#Public"
            ],
            "cc": [],
            "published": metadata['date'] + "T00:00:00Z",
            "tag": []
        }

        with open(os.getcwd() + "/dist/activitypub/notes/" + file, "w+") as f:
            json.dump(outboxnote, f)
            print("Done, saved outbox note to " + os.getcwd() + "/dist/activitypub/notes/" + file)
        
        notes.append(outboxnote)

outbox = {
    "@context": "https://www.w3.org/ns/activitystreams",
    "id": "https://blog.julian-lemmerich.de/activitypub/outbox.json",
    "type": "OrderedCollection",
    "summary": "Personal blog by Julian Lemmerich.",
    "totalItems": len(notes),
    "orderedItems": notes
}

with open(os.getcwd() + "/dist/activitypub/outbox.json", "w+") as file:
    json.dump(outbox, file)
    print("Done, saved outbox to " + os.getcwd() + "/dist/activitypub/outbox.json")
