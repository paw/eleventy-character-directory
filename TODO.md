# TODO 🚧
## Bug Fixes
- the views of all characters are not working with ocs_per_directory_page right now because they're using built-in pagination, need to add custom page gen for this
- CSS lightbox issue with scrolling with mousewheel only working when hovering directly over the image container.
## Features
### Planned
- stories (src/stories)
   - directory of stories
   - link between next/prev stories
   - mark characters as in story in frontmatter
   - option to show 
- worlds
  - create a page for the world in /worlds/ to give it a description, or leave blank to generate the world
  - characters in worlds by id (or name?) are defined on the characters' page
  - edit characterValidator to make sure that the worlds are valid
  - right now: worlds are created by stripping out the world tags from oc objects, can lead to issues with duplicate worlds due to cAsE etc. no ability to add desc/other data. need to rework this.
- characters
  - add option to hide connections on profile and add external connections page like toyhouse?
  - add validation for created/updated or have a fallback that isn't displayed if missing
- companion YAML generator for frontmatter
  - load frontmatter for ocs into fields or manually fill out fields
  - export frontmatter formatting for YAML
  - add different section of page to handle gallery file generation
- misc.
  - clean up glitch-hello-eleventy artifacts
  - need to implement CSS vars to make custom CSS easier to use
  - better layout stuff:
    - fix navigation for small screens
### Maybe
- N/A

# DONE ✅
- JSON file to control various settings
- Folders on site generated from file structure on disk
- characters are containerized in leaves of the file structure tree: one .md file per folder, deepest folder in chain becomes a character if there's valid md in it. otherwise it's treated as an empty folder
- characters
  - internal validation for frontmatter values
  - unique ids for connections/friends/enemies
  - connections (like toyhouse links)
  - simple friends/enemies lists
  - basic info fields
  - dnd stat block
  - icon automatically pulled from icon.png
  - masonry gallery with metadata handled by a yaml file
- copy image files over from src directory folders to appropriate places in output/public/images
