---
# this base layout is what tells us what is a character
layout: character.njk

# id must be unique and an integer.
id: 1
# must be unique, if you remove this it will use their id as a fallback
page_url: url

# name for the character, does not have to be unique
name: Character
# optional subtitle, can have HTML in it
subtitle: Subtitle

# use to hide characters
show_in_directory: true
# featured characters will show up on the front page
featured: false

# must include created/updated dates in YYYY-MM-DD
created: 2025-08-29
updated: 2025-10-01

# optional creator information. must have name at minimum. link is optional
creator:
    name: Me
    url: 

# you can define a list of custom key : value pairs.
# functions like toyhouse fields.
# you can do as many as you want. values can also contain HTML
basic_info:
  Full Name : Character the Hedgehog
  Age: 100
  Gender: Female
  Species: Hedgehog

# optional worlds/tags lists
worlds: []
tags: []

# optional D&D-style stat-block
stats:
    STR: 10
    DEX: 10
    CON: 10
    INT: 10
    WIS: 10
    CHA: 10

# optional one-sided relationships in friends/enemies.
# list character ids separated by commas eg [1,2,3] and it will automatically pull the associated character info
friends: []
enemies: []

# optional toyhouse-style connections. can be either one or two-sided
# use character IDs as the key and the value is the character's feelings about the other character
connections:
    1 : "My Feelings About You"

# optional quote
quote:
    words: Quote
    credit: Credit

# optional song list, link to songs on a site like spotify or youtube
songs:
  - title: Title
    artist: Artist
    url: link

# optional custom css file (use name w/o extension), store it in /public/css/
custom_css: 

---

Write a basic character description here.

## Things to Know
- Set an icon automatically by saving any valid image file in the same folder as this .md file and naming it **icon**
- Optionally, if you save an image and name it **portrait** it will replace the icon in the character page header.
- Drag and drop any image files you want associated with the character in this folder. **All** images will be copied over to the public assets folder.
- To have them show up in the gallery section, define the image metadata in **gallery.yaml**
- Otherwise, you can directly link to an image in the character's description with HTML. The image will be located in /public/images/characters/ID/ and will have a slugified file name
