module.exports = {
    proxy: "localhost:3000",
    files: ["public/**/*.*", "views/**/*.*"],
    ignore: ["node_modules"],
    reloadDelay: 10,
    ui: false,
    notify: false,
    port: 3001,
    snippetOptions: {
        rule: {
            match: /<\/body>/i,
            fn: function (snippet, match) {
                return snippet + match;
            }
        }
    }
}; 