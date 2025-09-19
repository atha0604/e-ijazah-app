/* ===== ESLINT CONFIGURATION FOR E-IJAZAH PROJECT ===== */

module.exports = {
    env: {
        browser: true,
        es2022: true,
        node: true,
        jest: false // We use our own testing framework
    },

    extends: ['eslint:recommended'],

    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    },

    globals: {
        // Testing framework globals
        describe: 'readonly',
        it: 'readonly',
        xit: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',

        // Application globals
        Chart: 'readonly',
        XLSX: 'readonly',
        jsPDF: 'readonly',
        html2canvas: 'readonly'
    },

    rules: {
        // Error Prevention
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-debugger': 'error',
        'no-alert': 'warn',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        'no-void': 'error',
        'no-with': 'error',

        // Best Practices
        curly: ['error', 'all'],
        'default-case': 'error',
        'dot-notation': 'error',
        eqeqeq: ['error', 'always'],
        'guard-for-in': 'error',
        'no-caller': 'error',
        'no-case-declarations': 'error',
        'no-div-regex': 'error',
        'no-else-return': 'error',
        'no-empty-pattern': 'error',
        'no-eq-null': 'error',
        'no-extend-native': 'error',
        'no-extra-bind': 'error',
        'no-fallthrough': 'error',
        'no-floating-decimal': 'error',
        'no-implicit-coercion': 'error',
        'no-implicit-globals': 'error',
        'no-iterator': 'error',
        'no-labels': 'error',
        'no-lone-blocks': 'error',
        'no-loop-func': 'error',
        'no-multi-spaces': 'error',
        'no-multi-str': 'error',
        'no-new': 'error',
        'no-new-wrappers': 'error',
        'no-octal': 'error',
        'no-octal-escape': 'error',
        'no-param-reassign': 'error',
        'no-proto': 'error',
        'no-redeclare': 'error',
        'no-return-assign': 'error',
        'no-self-assign': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-unused-expressions': 'error',
        'no-useless-call': 'error',
        'no-useless-concat': 'error',
        radix: 'error',
        'wrap-iife': ['error', 'inside'],
        yoda: ['error', 'never'],

        // Variables
        'no-catch-shadow': 'error',
        'no-delete-var': 'error',
        'no-label-var': 'error',
        'no-shadow': 'error',
        'no-shadow-restricted-names': 'error',
        'no-undef': 'error',
        'no-undef-init': 'error',
        'no-undefined': 'error',
        'no-unused-vars': [
            'error',
            {
                vars: 'all',
                args: 'after-used',
                argsIgnorePattern: '^_'
            }
        ],
        'no-use-before-define': [
            'error',
            {
                functions: false,
                classes: true
            }
        ],

        // Node.js and CommonJS
        'no-mixed-requires': 'error',
        'no-new-require': 'error',
        'no-path-concat': 'error',

        // Stylistic Issues
        'array-bracket-spacing': ['error', 'never'],
        'block-spacing': ['error', 'always'],
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
        camelcase: ['error', { properties: 'never' }],
        'comma-dangle': ['error', 'never'],
        'comma-spacing': ['error', { before: false, after: true }],
        'comma-style': ['error', 'last'],
        'computed-property-spacing': ['error', 'never'],
        'consistent-this': ['error', 'self'],
        'eol-last': 'error',
        'func-names': 'warn',
        'func-style': ['error', 'expression', { allowArrowFunctions: true }],
        indent: ['error', 4, { SwitchCase: 1 }],
        'key-spacing': ['error', { beforeColon: false, afterColon: true }],
        'keyword-spacing': ['error', { before: true, after: true }],
        'linebreak-style': ['error', 'unix'],
        'max-nested-callbacks': ['error', 3],
        'new-cap': 'error',
        'new-parens': 'error',
        'no-array-constructor': 'error',
        'no-inline-comments': 'warn',
        'no-lonely-if': 'error',
        'no-mixed-spaces-and-tabs': 'error',
        'no-multiple-empty-lines': ['error', { max: 2, maxBOF: 0, maxEOF: 1 }],
        'no-nested-ternary': 'error',
        'no-new-object': 'error',
        'no-spaced-func': 'error',
        'no-trailing-spaces': 'error',
        'no-underscore-dangle': 'error',
        'no-unneeded-ternary': 'error',
        'object-curly-spacing': ['error', 'always'],
        'one-var': ['error', 'never'],
        'operator-assignment': ['error', 'always'],
        'operator-linebreak': ['error', 'after'],
        'padded-blocks': ['error', 'never'],
        'quote-props': ['error', 'as-needed'],
        quotes: ['error', 'single', { allowTemplateLiterals: true }],
        semi: ['error', 'always'],
        'semi-spacing': ['error', { before: false, after: true }],
        'space-before-blocks': ['error', 'always'],
        'space-before-function-paren': [
            'error',
            {
                anonymous: 'never',
                named: 'never',
                asyncArrow: 'always'
            }
        ],
        'space-in-parens': ['error', 'never'],
        'space-infix-ops': 'error',
        'space-unary-ops': ['error', { words: true, nonwords: false }],
        'spaced-comment': ['error', 'always'],

        // ES6
        'arrow-body-style': ['error', 'as-needed'],
        'arrow-parens': ['error', 'as-needed'],
        'arrow-spacing': ['error', { before: true, after: true }],
        'constructor-super': 'error',
        'generator-star-spacing': ['error', { before: false, after: true }],
        'no-class-assign': 'error',
        'no-confusing-arrow': ['error', { allowParens: true }],
        'no-const-assign': 'error',
        'no-dupe-class-members': 'error',
        'no-duplicate-imports': 'error',
        'no-new-symbol': 'error',
        'no-this-before-super': 'error',
        'no-useless-computed-key': 'error',
        'no-useless-constructor': 'error',
        'no-var': 'error',
        'object-shorthand': ['error', 'always'],
        'prefer-arrow-callback': 'error',
        'prefer-const': 'error',
        'prefer-spread': 'error',
        'prefer-template': 'error',
        'require-yield': 'error',
        'template-curly-spacing': ['error', 'never'],
        'yield-star-spacing': ['error', { before: false, after: true }]
    },

    overrides: [
        {
            files: ['tests/**/*.js'],
            rules: {
                'no-unused-expressions': 'off', // Allow expect().toBe() style
                'max-nested-callbacks': ['error', 5] // Tests can be more nested
            }
        },
        {
            files: ['public/js/**/*.js'],
            rules: {
                'no-console': 'off' // Allow console in browser code for debugging
            }
        },
        {
            files: ['build.js', 'server.js'],
            env: {
                node: true,
                browser: false
            }
        }
    ]
};
