# eleventy-character-directory
Eleventy starter for generating a Toyhouse-inspired static website with the goal of creating a (mostly) drag-and-drop experience for maintaining character galleries and folder organization.

**Please Note: This project is currently unfinished, use at your own risk in this state.**\
See **TODO.md** for a list of planned features and bugs.

# Features:

- ### Config File Control
    - JSON Config file to make managing settings like default character layout, OCs per directory page, and character name badge display much more straightforward
    - Customizable categorization paths (/oc/, /stories/, /world/, & /tagged/, all can be changed)

- ### Two Layout Variants
    - A Single-page layout with all sections rendered on one page
    - A Multi-Page Layout with a base overview page and subpages for relationships and gallery data
    - Default Layout is set globally in the config but can be overridden on a per-character basis

- ### Folder View & Automatic Folder Generation
    - Recursively scans the directory specified by the config (default: Characters), automatically constructing a hierarchy of folders and characters that are then displayed on the site.
    - Folder names on the site are taken directly from the directory name
    - Folders can contain both character containers and subfolders, with the leaves being considered character containers as long as they contain at least 1 markdown file with **layout: character.njk** in the frontmatter
    - Automatically discovers folder icons and markdown folder descriptions
    - You can leave all character containers directly inside the base directory to disable the folders feature entirely.

- ### Flat Directory Views
    - Generates multiple paginated views of all unhidden characters, allowing you to browse all characters in differing orders:
        - by ID (Ascending)
        - by Created (Newest)
        - by Updated (Recent)

- ### Complex Character Management
    - Create container directories that contain a markdown file for the character's profile information and all image files you wish to use as part of their gallery.
    - Characters have unique IDs and unique page slugs
    - Characters can be hidden from the directory pages on a per-character basis.
    - Frontmatter is validated in processing so that invalid markdown files don't generate junk pages, character IDs/page URLs never collide, and invalid relationships with non-existent characters are caught
    - Placeholder icon is used when no icon file is specified (replace icon.png in /public/images/characters/p/ for a custom placeholder)
    - A custom css file can be added to the container it will be automatically copied to the assets folder and assigned to the character, allowing you to customize the page layout on a per-character basis and keep everything inside the one folder

- ### Image and Gallery processing
    - Finds character images, assigns metadata to those images by reading a gallery.yaml, assigns icon and portrait URLs
    - Images for folders and characters are queued for copying into the output public assets directory.
    - Character image files are placed into folders inside /public/images/characters/ that are associated with their unique ID number to prevent collisions.
    - Image files have their filenames automatically slugified.

- ### Relationships
    - Simple one-sided friends and enemies lists.
    - More complex connection pairs that function like Toyhouse links.

- ### Worlds, Tags, and Stories
    - Groups characters by tags and worlds, automatically creating a tag or a world entry when it exists in at least 1 character's frontmatter. the first character encountered determines the tag/world's title case
    - However, Worlds can be given more complex metadata by creating a matching world markdown file:
        - control title case with frontmatter
        - add created/updated dates
        - add a custom description to the world's page 
    - Generates paginated directory, world, and tag data pages
    - Associates stories with characters, linking directly to the featured characters.

# Installation

## You Will Need:
- A code editor of your choice, such as [VSCode](https://code.visualstudio.com/)/[VSCodium](https://vscodium.com/) or [Zed](https://zed.dev/)
- [Node.js](https://nodejs.org/)
- A copy of this repo

## Instructions:
- Install Node.js if you don't have it.
- Download the zip of the repo or clone it in your editor of choice.
- Open a terminal wherever the contents of the repo exist on your machine.
- Run **npm install** to automatically install the necessary packages.
- You can test if everything is good by running **npm run start**
- If everything is fine, you will see **[11ty] Server at http://localhost:8080/** in your terminal. Visiting that URL in your browser will show the exact contents of [the demo](https://oc-demo.snarly.net/).
- You can cancel out of this with CTRL+C and start editing stuff to your heart's content.
- To make new characters quickly, you can copy and paste the entire character template at folder in **/templates** for a quick container that has the necessary structure to create a working character and comments inside the frontmatter to help you with it.
- Commands:
    - Build the site: **npm run build**
    - Clean up the output folder: **npm run cleanup**
    - Start the live web server: **npm run start** 
- [If you have never used 11ty before, see the docs for assistance with commands.](https://www.11ty.dev/docs/)


## Specific Notes:
- Due to how character galleries are processed, if you're using **npx @11ty/eleventy --serve** to view live changes to the build, you will have to shut down the web server and relaunch it if you add new images to a character's container and gallery metadata.
