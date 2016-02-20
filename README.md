# static-wiki

Static wiki is a client side wiki for pure markdown.  However a simple file
server is needed(Github Pages is enough) to serve files.

1. Now you can write your documents in markdown and never have to worry about it
   anymore.
2. If you use Github Pages, you can turn github into your own personal wiki
   with some simple configurations.

## Installation

1. copy `index.html`, `css/`, `main.js` into your wiki directory.
2. Create file `index.md` if not exist. This will be your home page.
3. Start a file server under your wiki directory.

How to start a file server? Take
[http-server](https://www.npmjs.com/package/http-server) as an example:

```
npm install -g http-server
cd your-wiki-directory
http-server
```

## Configuration

**Change Default Home Page**:

1. open `main.js` with your favorite editor.
2. change `index.md` in `var file_index = 'index.md';` to whatever you like.

**Search**

In order to provide search function, `static-wiki` will actually download
every markdown file behind the scene. However, `static-wiki` have no idea what
files are contained in your wiki, so you need to add file `all.txt` in your
wiki with all the markdown file names(line by line) like:

```
index.md
README.md
```

**Further Configuration**

Well, it is written in HTML/CSS/Javascript, modify as you wish.
