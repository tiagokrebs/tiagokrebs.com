module.exports = {
  "origin": [
    {
      "name": "origin-storage-default",
      "type": "object_storage"
    }
  ],
  "rules": {
    "request": [
      {
        "name": "Main_Rule",
        "match": "^\\/",
        "setOrigin": {
          "name": "origin-storage-default",
          "type": "object_storage"
        }
      },
      {
        "name": "Index_Rewrite_1",
        "match": ".*/$",
        "rewrite": {
          "set": (uri) => `${uri}index.html`
        }
      },
      {
        "name": "Index_Rewrite_2",
        "match": "^(?!.*\\/$)(?![\\s\\S]*\\.[a-zA-Z0-9]+$).*",
        "rewrite": {
          "set": (uri) => `${uri}/index.html`
        }
      }
    ]
  }
};