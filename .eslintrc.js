module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "jest/globals": true,
        "es6": true,
    },
    "parserOptions": {
        "ecmaVersion": 6,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        },
        "sourceType": "module"    
    },
    "extends": ["eslint:recommended", "google"],
    "rules": {
        "no-console": "off",
        "max-len": 0,
        "indent": ["error", "tab"],
        "no-tabs": 0
    },
    "plugins": [
        "jest"
    ]
};