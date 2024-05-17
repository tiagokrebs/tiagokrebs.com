# tiagokrebs.com

Used to build my [tiagokrebs.com](https://tiagokrebs.com) page at the Edge.  
Based on [gohugo.io](https://gohugo.io), [NPM](https://www.npmjs.com/) and [azion.com](http://azion.com).

Clone with submodules (themes)
```
$ git clone --recurse-submodules https://github.com/tiagokrebs/tiagokrebs.com.git
```

Add new post
```
$ npx hugo new content/posts/newpost.md
```

Start a new Edge Application (if doesn't exists yet), chose Hugo preset
```
$ azion link
```

Build
```
$ azion build
```

Run a local dev environment
```
$ azion dev
```

Deploy at the Edge
```
$ azion deploy
```

