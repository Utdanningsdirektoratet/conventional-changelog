# Udir React Components Changelog

## Configuration

### package.json

Like commitizen, you specify the configuration of cz-conventional-changelog through the package.json's `config.commitizen` key.

```json5
{
// ...  default values
    "config": {
        "commitizen": {
            "path": "./node_modules/cz-conventional-changelog",
            "maxHeaderWidth": 100,
            "maxLineWidth": 100,
            "defaultType": "",
            "defaultScope": "",
            "defaultSubject": "",
            "defaultBody": "",
            "defaultIssues": ""
        }
    }
// ...
}
```
### Environment variables

The following environment varibles can be used to override any default configuration or package.json based configuration.

* CZ_TYPE = defaultType
* CZ_SCOPE = defaultScope
* CZ_SUBJECT = defaultSubject
* CZ_BODY = defaultBody
* CZ_MAX_HEADER_WIDTH = maxHeaderWidth
* CZ_MAX_LINE_WIDTH = maxLineWidth

### Commitlint

If using the [commitlint](https://github.com/conventional-changelog/commitlint) js library, the "maxHeaderWidth" configuration property will default to the configuration of the "header-max-length" rule instead of the hard coded value of 100.  This can be ovewritten by setting the 'maxHeaderWidth' configuration in package.json or the CZ_MAX_HEADER_WIDTH environment variable.

### Global installation
Dependency:
```npm install -g commitizen@4.0.5```

#### Unix based os

Install udir changelog globally with: `npm i @udir/conventional-changelog -g`

In the home folder  - create the file `.czrc` and put this config in there:
```json
{
  "path": "@udir/conventional-changelog",
  "prefix": true // Change to false if you don't want to be asked to
                 // prepend the subject with branch name
}
```
or do:
`echo '{
         "path": "@udir/conventional-changelog",
         "prefix": true
       }' > ~/.czrc
`

#### Windows
Det virker ikke på windows enda...
