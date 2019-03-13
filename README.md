# About
Scripts to help [LSIF](https://github.com/Microsoft/language-server-protocol/blob/master/indexFormat/specification.md) developers. Featuring:

* Graph visualization
* [WIP] Quick search
* [WIP] Validation

# Getting Started

- `> git clone this repository`
- `> cd lsif-util`
- `> npm install`
- `> tsc -p .\tsconfig.json`

# Graph

`> node .\lib\graph.js [options] [ids]`

| Option            | Default     |
|-------------------|-------------|
| --inputPath or -p | ./lsif.json |
| --depth or -d     | 1           |
| --verbose or -v   | false       |

Example:
`> node .\lib\graph.js -d 2 15`

* The input file must be a `.json` file.
* [ids] is the list of target ids
* The depth is how far from the listed ids we will look
* The verbose option prints more information about the vertices
* The output will be a [DOT](https://graphviz.gitlab.io/_pages/doc/info/lang.html) graph

The following image was created using [Viz.js](http://viz-js.com/)

![graph example](images/graphviz.png)