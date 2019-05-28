
# lsif-util

Scripts to help [LSIF](https://github.com/Microsoft/language-server-protocol/blob/master/indexFormat/specification.md) developers.

## What's new

* _Up to date!_ Support for [JSON Lines](http://jsonlines.org/) with the `--inputFormat` tag
* _Cleaning up!_ Standard filtering for all tools (no more unnecessary searching)

## What's next

* _We are moving!_ The lsif-util tools will soon migrate to [lsif-node](https://github.com/microsoft/lsif-node)
* _Getting official!_ Global npm package is on the way

## Usage

``` bash
git clone https://github.com/jumattos/lsif-util.git
cd lsif-util
npm install
npm run compile
node .\lib\main.js [validate|visualize] [file] --inputFormat [line|json] [--stdin] [filters]
```

| Option        | Description                                    | Default |
|---------------|------------------------------------------------|---------|
| --inputFormat | Specify input format (choices: "line", "json") | line    |
| --stdin       | Read from standard input                       | false   |
| --id          | Filter by id                                   | []      |
| --inV         | Filter by inV                                  | []      |
| --outV        | Filter by outV                                 | []      |
| --type        | Filter by type                                 | []      |
| --label       | Filter by label                                | []      |
| --property    | Filter by property                             | []      |
| --regex       | Filter by regex                                | none    |

Validating outgoing edges from vertex 1:
``` bash
node .\lib\main.js validate .\example\line.json --outV 1
```

Visualizing ranges:
``` bash
node .\lib\main.js visualize .\example\line.json --label range
```

Piping LSIF output:
``` bash
lsif-tsc -p .\tsconfig.json | node .\lib\main.js validate --stdin
```

## Validation

Returns whether the LSIF input file is **syntatically** valid or not.

Verifies the following:

* Vertices properties are correct
* Edges properties are correct
* Vertices are emitted before connecting edges
* Vertices are used in at least one edge (except metadata)
* [WIP] Edges exist only between defined vertices

## Visualization

| Option            | Default     | Description                                             |
|-------------------|-------------|---------------------------------------------------------|
| --distance        | 1           | Max distance between any vertex and the filtered input  |

Outputs a [DOT](https://graphviz.gitlab.io/_pages/doc/info/lang.html) graph.

You can either visualize it online using [Viz.js](http://viz-js.com/) or install [Graphviz](http://graphviz.org/) and pipe it to the DOT tool:

``` bash
node .\lib\main.js visualize .\example\line.json --distance 2 --id 3 | dot -Tpng -o image.png
```

![graph example](image/graphviz.png)