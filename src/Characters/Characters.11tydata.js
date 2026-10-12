// this prevents incorrectly generating pages for folder.md descriptions or accidentally created markdown files inside folders
export default {
    eleventyComputed: {
        permalink(data) {
            if (data.layout === "character.njk") {
                return data.permalink;
            }
            return false;
        },
    },
};
