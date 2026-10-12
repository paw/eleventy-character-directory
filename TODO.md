# TODO 🚧

## Bug Fixes

- CSS lightbox issue with scrolling with mousewheel only working when hovering directly over the image container.

## Features/Tasks

### Planned

- documentation lol
- final templates with inline comments for:
  - character
  - world
- stories
  - validation for date frontmatter
- companion YAML generator for frontmatter
  - load frontmatter for ocs into fields or manually fill out fields
  - export frontmatter formatting for YAML
  - add different section of page to handle gallery file generation
- misc.
  - clean up glitch-hello-eleventy artifacts
  - need to implement CSS vars to make custom CSS easier to use
  - better layout stuff:
    - fix navigation for small screens
    - fix some display issues with the oc lists

### Maybe

- at least one other premade theme, this one based on polaroids (?)- characters
- stories
  - link between next/prev stories (?)
  - option to show the stories on the character's page (?)
- characters
  - automatically copy over a css file placed in the directory instead of making you specify a css file in the frontmatter (?)
  
# DONE ✅

- JSON file in _data controls various settings
- prevent accidental inclusion of random md files in characters dir from generating pages
- Folders on site generated from file structure on disk
- characters are containerized in leaves of the file structure tree: one .md file per folder, deepest folder in chain becomes a character if there's valid md in it. otherwise it's treated as an empty folder
- characters
  - single or multi-page layout options, controlled globally in the config and with per-character overrides
  - internal validation for frontmatter values
  - unique ids for connections/friends/enemies
  - created/updated must exist and be in the format YYYY-MM-DD, will display as Short month Day, Full Year
  - optional connections (functions like toyhouse links)
  - optional simple friends/enemies lists
  - fully customizable optional basic info fields
  - optional dnd-style stat block
  - icon automatically pulled from icon.png
  - optional name an image portrait.png to use that in the character page header instead of the character's icon
  - masonry gallery with image metadata handled by a yaml file
  - optional list of songs
  - optional quote
  - optional subtitle under name
  - optionally show character ids
  - can hide/show connections on profile
- worlds
  - worlds are added to characters by name in the frontmatter. ocs are automatically collected and sorted into world groups for pagination. worlds are automatically created as long as one oc is in the world.
  - the first instance of the world encountered during collection creation defines the case of the world name. To enforce a specific case or add a description to the world, create a file in src/worlds/
  - added a world directory
- tags
  - tags are added to characters in their frontmatter. ocs are automatically collected and sorted into tag groups for pagination
  - added a tag directory
- stories
  - added a story directory
  - mark characters as in story in frontmatter
- connections
  - added a page to show all character connections
  - connections now mutually show on both character's page even if connection is one-sided
- copies image files over from src directory folders to appropriate places related to character id in output/public/images
