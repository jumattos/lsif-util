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

`> node .\lib\graph.js [options] targetVertices`

After the options, you should specify one or more `targetVertices`. These are vertices you are interested in and are guaranteed to show in the graph.

| Option            | Default     | Description                                             |
|-------------------|-------------|---------------------------------------------------------|
| --inputPath or -p | ./lsif.json | Path to input file (JSON)                               |
| --distance or -d  | 1           | Max distance between any vertex and the target vertices |
| --verbose or -v   | false       | Display more information about the vertices             |

Example:
`> node .\lib\graph.js -d 2 15`

The output will be a [DOT](https://graphviz.gitlab.io/_pages/doc/info/lang.html) graph.

The following image was created using [Viz.js](http://viz-js.com/)

![graph example](images/graphviz.png)