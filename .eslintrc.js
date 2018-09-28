module.exports = {
    "env": {
        "browser": true,
        "node": true
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
        "indent": ["tab"],
        "no-tabs": 0
    }
};