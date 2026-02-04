module.exports = {
    extends: ['alloy', 'alloy/typescript'],
    rules: {
        indent: ['error', 4],
        semi: ['error', 'never'],
        complexity: ['error', { max: 40 }],
        'no-useless-constructor': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-useless-constructor': 'off',
        '@typescript-eslint/no-duplicate-imports': 'off'
    },
    env: {
        es6: true,
        node: true,
        jest: true
    },
    overrides: [
        {
            files: ['*.js'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off'
            }
        }
    ]
}
