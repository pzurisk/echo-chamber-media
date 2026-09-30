# How to add a blog post

1. Copy `_template.md` to a new file in this folder. The file name becomes the address,
   so `how-to-elope-in-las-vegas.md` becomes `/blog/how-to-elope-in-las-vegas`.
   Use lowercase words joined by dashes.
2. Fill in the top block (title, description, date, category, image).
3. Write the post below it in plain markdown: `##` for section headings, `-` for bullets,
   `[link text](/elopements)` for links, `![alt text](/images/elopements/fremont-walk.webp)` for photos.
4. Keep `draft: true` while you work. Drafts show on your dev server but never on the live site.
   Change it to `draft: false` (or delete the line) when you want it published.
5. Tell Claude "publish the post" and it will check it, build, and push with your okay.

What Google likes:
- A title that says what the page is about, around 60 characters, with "Las Vegas" in it.
- A description of one or two sentences, around 150 characters.
- Real detail a couple can use: costs, steps, places, timing. Answer one question fully.
- Two or three links to your other pages, especially `/elopements#date` near the end.
- Photos from your own films, each with a short description in the alt text.
- No em dashes. No made-up facts or reviews.
