# tiagokrebs.com

Used to build my [tiagokrebs.com](https://tiagokrebs.com) page at the Edge.  
Based on [gohugo.io](https://gohugo.io) and [azion.com](http://azion.com).

Clone with submodules (themes)
```
$ git clone --recurse-submodules https://github.com/tiagokrebs/tiagokrebs.com.git
```

Add new post
```
$ hugo new content/pt/post/newpost.md
```

Run local server (http://localhost:1313/)
```
$ hugo server -D
```

Build
```
$ hugo -D
```

Start a new Edge Application (if doesn't exists yet)
```
$ azioncli edge_applications init --type static
```

Deploy at the Edge
```
$ azioncli edge_applications publish --path public
```