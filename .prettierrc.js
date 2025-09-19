/* ===== PRETTIER CONFIGURATION FOR E-IJAZAH PROJECT ===== */

module.exports = {
    // Print width - line length
    printWidth: 100,

    // Indentation
    tabWidth: 4,
    useTabs: false,

    // Semicolons
    semi: true,

    // Quotes
    singleQuote: true,
    quoteProps: 'as-needed',
    jsxSingleQuote: true,

    // Trailing commas
    trailingComma: 'none',

    // Bracket spacing
    bracketSpacing: true,
    bracketSameLine: false,

    // Arrow functions
    arrowParens: 'avoid',

    // End of line
    endOfLine: 'lf',

    // Embedded language formatting
    embeddedLanguageFormatting: 'auto',

    // HTML whitespace
    htmlWhitespaceSensitivity: 'css',

    // Vue files
    vueIndentScriptAndStyle: false,

    // Override for specific file types
    overrides: [
        {
            files: '*.json',
            options: {
                tabWidth: 2
            }
        },
        {
            files: '*.md',
            options: {
                printWidth: 80,
                tabWidth: 2,
                useTabs: false,
                trailingComma: 'none'
            }
        },
        {
            files: '*.html',
            options: {
                tabWidth: 2,
                printWidth: 120
            }
        },
        {
            files: '*.css',
            options: {
                tabWidth: 2,
                singleQuote: false
            }
        },
        {
            files: ['*.yml', '*.yaml'],
            options: {
                tabWidth: 2,
                singleQuote: false
            }
        }
    ]
};
