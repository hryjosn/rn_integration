module.exports = {
    presets: [
        'module:metro-react-native-babel-preset',
    ],
    plugins: [
        [
            '@babel/plugin-proposal-decorators',
            {
                legacy: true,
            },
        ],
        [
            'module-resolver',
            {
                root: ['./src'],
                extensions: ['.js', '.json'],
                alias: {
                    '@components': './src/components',
                    '@container': './src/container',
                    '@store': './src/store',
                },
            },
        ],
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
    ],
};
