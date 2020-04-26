let global = {
    'cfg': {},
    'graph': {},
    'flowchart': {},
};

let flowchartConfig = {
    newNodePlace: {x: 50, y: 50},
    nodeWidth: 200,
    nodeHeight: 60,
    rectangleRenderer: (ctx, node) => {
        ctx.beginPath();
        //ctx.fillStyle = node.fillStyle;
        ctx.fillStyle = '#pink';
        ctx.strokeStyle = '1px solid black';
        ctx.fillRect(node.x, node.y, node.w, node.h);
        ctx.fillStyle = 'black';
        ctx.font = '12px monospace';
        ctx.textBaseline = 'top';
        node.textfill(ctx);
    },
    connectors: [
        new model.connector(0.5, 0, 'output', 'output', {
            fillStyle: 'DarkSeaGreen',
            strokeStyle: 'green',
            highlightStrokeStyle: 'black',
            highlightText: 'black'
        }, {
            dropAllowed: true,
            dragAllowed: false,
            radius: 7
        }),
        new model.connector(0.5, 1, 'input', 'input', {
            fillStyle: 'PowderBlue',
            strokeStyle: 'blue',
            highlightStrokeStyle: 'black',
            highlightText: 'black'
        }, {
            dropAllowed: false,
            dragAllowed: true,
            radius: 7
        }),
    ],
}

let renderFlowchart = (flowchart) => {
    let render = new dagreD3.render();
    let svg = d3.select('#flowchart');
    let svgGroup = svg.append('g');
    render(d3.select('#flowchart g'), flowchart);
    let xCenterOffset = (svg.attr('width') - flowchart.graph().width) / 2;
    svgGroup.attr('transform', 'translate(' + xCenterOffset + ', 20)');
    svg.attr('height', flowchart.graph().height + 40);
};

let createNode = (graph, flowchart) => {
    let index = graph.nodes.length;
    let node = {
        'index': index,
        'component': {
            'name': 'n',
            'args': 'a',
        },
    };
    graph.nodes.push(node);
    flowchart.addNode(new flowchart.node(
        flowchartConfig.newNodePlace.x,
        flowchartConfig.newNodePlace.y,
        flowchartConfig.nodeWidth,
        flowchartConfig.nodeHeight,
        flowchartConfig.connectors,
        node.index + ': ' + node.component.name,
        'green',
        flowchartConfig.rectangleRenderer
    ));
    flowchartConfig.newNodePlace.x += 20;
    flowchartConfig.newNodePlace.y += 20;

    flowchart.draw();
};

let autoLayout = (nodeNum, edges, padding) => {
    let g = new dagre.graphlib.Graph();
    g.setGraph({});
    g.setDefaultEdgeLabel(function () { return {}; });
    for (let i = 0; i < nodeNum; i++) {
        g.setNode(i, { width: flowchartConfig.nodeWidth, height: flowchartConfig.nodeHeight });
    }
    edges.forEach(edge => {
        g.setEdge(edge.from, edge.to);
    });
    dagre.layout(g);
    let layout = {};
    let maxX = 0, maxY = 0, minX = 1000000, minY = 1000000;
    g.nodes().forEach(v => {
        let node = g.node(v);
        maxX = Math.max(maxX, node.x);
        maxY = Math.max(maxY, node.y);
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        layout[parseInt(v)] = { x: node.x, y: node.y };
    });
    layout = Object.keys(layout).map(k => {
        let e = layout[k];
        return { x: (30 + e.x - minX), y: (30 + e.y - minY) }
    });
    return { width: maxX - minX + 30 + padding, height: maxY - minY + 30 + padding, nodes: layout };
};

let showNodeDetail = (nodeIndex) => {
    let info = document.getElementById('node-info');
    let node = global.graph.nodes[nodeIndex];
    let text = [
        '<form>',
        `<div class="form-group row">
            <label class="col-sm-12 col-form-label"><h4>${node.component.name}</h4></label>
        </div>`,
    ];
    Object.keys(node.component.args).forEach(k => {
        let v = node.component.args[k];
        let multipleValues = v.split(',');
        if (multipleValues.length > 1) {
            text.push(`
                <div class="form-group row">
                    <label class="col-sm-6 col-form-label">${k}</label>
                    <label class="col-sm-6 col-form-label">
            `);
            text.push(multipleValues.map(e => '<span class="badge badge-success">' + e + '</span>').join('&nbsp;'));
            text.push(`
                    </label>
                </div>
            `);
        } else {
            text.push(`
            <div class="form-group row">
                <label class="col-sm-6 col-form-label">${k}</label>
                <label class="col-sm-6 col-form-label"><span class="badge badge-info">${v}</span></label>
            </div>
            `);
        }
    });

    text.push('</form>');
    info.innerHTML = text.join('\n');
};

let addAttributeRow = () => {
    let attributes = document.getElementById('nodeAttributes');
    let newAttributeName = document.getElementById('new-attribute-name').value;
    attributes.innerHTML += `
    <div class="form-group row">
        <label class="col-sm-4 col-form-label">${newAttributeName}</label>
        <div class="col-sm-5">
            <input type="text" class="form-control" name="${newAttributeName}" value="value">
        </div>
        <div class="col-sm-3">
            <a href="#" onclick="removeAttributeRow(this)" class="btn btn-danger btn-block">&times;</a>
        </div>
    </div>
    `;
};

let removeAttributeRow = (e) => {
    let dom = e.parentElement.parentElement;
    dom.remove();
};

let showNodeEditor = (nodeIndex) => {
    let info = document.getElementById('node-info');
    let node = global.graph.nodes[nodeIndex];
    let text = [
        '<form id="modifyNode">',
        `<div class="form-group row">
            <div class="col-sm-12">
                <input type="text" class="form-control" id="node-editor-component-name" name="component-name" value="${node.component.name}">
            </div>
        </div>`,
        '<span id="nodeAttributes">',
    ];
    Object.keys(node.component.args).forEach(k => {
        let v = node.component.args[k];
        text.push(`
        <div class="form-group row">
            <label class="col-sm-4 col-form-label">${k}</label>
            <div class="col-sm-5">
                <input type="text" class="form-control" name="${k}" value="${v}">
            </div>
            <div class="col-sm-3">
                <a href="#" onclick="removeAttributeRow(this)" class="btn btn-danger btn-block">&times;</a>
            </div>
        </div>
        `);
    });

    text.push(`
        </span>
        <div class="form-group">
            <button type="submit" class="btn btn-primary">Save</button>
        </div>
    </form>
    <hr>
    <form>
        <div class="from-group row">
            <label class="col-sm-4 col-form-label">attribute name</label>
            <div class="col-sm-5">
                <input type="text" class="form-control" id="new-attribute-name" value="new_attribute_name">
            </div>
            <div class="col-sm-3">
                <a href="#" onclick="addAttributeRow()" class="btn btn-info btn-block">Add</a>
            </div>
        </div>
    </form>
    `);
    info.innerHTML = text.join('\n');
    let form = document.getElementById('modifyNode');
    form.addEventListener('submit', (e) => {
        //console.log(form);
        let name = document.getElementById('node-editor-component-name').value;
        let args = {};
        let inputs = form.getElementsByTagName('input');
        for (let input of inputs) {
            if(input.name != 'component-name') {
                args[input.name] = input.value;
            }
        }
        let component = {name: name, args: args};
        node.component = component;
        showNodeDetail(nodeIndex);
        model.nodes[mouse.selNode].text = name;
        e.preventDefault();
        return false;
    });
};

let appendListenersForFlowchart = () => {
    document.addEventListener('releaseNode', () => {
        document.getElementById('node-info').innerHTML = '';
    });
    document.addEventListener('selectionChanged', e => showNodeDetail(e.detail));
    document.addEventListener('nodesLinked', (e) => {
        let edge = {from: e.detail.from, to: e.detail.to};
        // linear check if edge already existed in graph
        if (global.graph.edges.filter(e2 => e2.from == edge.from && e2.to == edge.to).length == 0) {
            global.graph.edges.push(edge);
        }
    });
    document.addEventListener('clickNode', e => showNodeEditor(e.detail));

    document.addEventListener('clickLink', (e) => {
        let edge = {from: e.detail.from, to: e.detail.to};
        // remove edge
        global.graph.edges = global.graph.edges.filter(e2 => !(e2.from == edge.from && e2.to == edge.to));
        model.removeLinkByFromTo(edge.from, edge.to);
        model.draw();
    });
};

let initFlowchart = (graph) => {
    model.clear();
               
    
    layout = autoLayout(graph.nodes.length, graph.edges, 200);
    graph.nodes.forEach(node => {
        model.addNode(new model.node(
            layout.nodes[node.index].x,
            layout.nodes[node.index].y,
            flowchartConfig.nodeWidth,
            flowchartConfig.nodeHeight,
            flowchartConfig.connectors,
            node.index + ': ' + node.component.name,
            'green',
            flowchartConfig.rectangleRenderer
        ));
    });
    graph.edges.forEach(edge => {
        model.addLink(new model.link(edge.from, edge.to, 1, 0, ''));
    });

    document.getElementById('myCanvas').width = document.getElementById('myCanvas').parentElement.clientWidth;
    document.getElementById('myCanvas').height = Math.max(700, layout.height);
    model.init('myCanvas');
    model.draw();

    appendListenersForFlowchart();

    return model;
};

let buildGraph = (components) => {
    let nodes = [], edges = [];
    components.forEach((component, index) => {
        nodes.push({ 'index': index, 'component': component });
        if (index > 0) {
            switch (component.name) {
                case 'shortcut':
                    if (component.args.from != null) {
                        let fromIndex = index + parseInt(component.args.from);
                        edges.push({ 'from': fromIndex, 'to': index });
                        edges.push({ 'from': index - 1, 'to': index });
                    }
                    break;
                case 'route':
                    if (component.args.layers != null) {
                        component.args.layers.split(',')
                            .map(e => e.trim())
                            .filter(e => !(!e || e.length === 0 || !e.trim()))
                            .forEach(layer => {
                                let layerIndex = parseInt(layer);
                                if (layerIndex >= 0) {
                                    edges.push({ 'from': layerIndex, 'to': index });
                                } else {
                                    edges.push({ 'from': index + layerIndex, 'to': index });
                                }
                            });
                    }
                    break;
                default:
                    edges.push({ 'from': index - 1, 'to': index });
            }
        }
    });
    return { 'nodes': nodes, 'edges': edges };
};

let formatGraph = (graph) => {
    let renumber = (nodes, edges) => {
        let fromTo = Array(nodes.length).fill(null).map(e => new Array(0));
        let degrees = Array(nodes.length).fill(0);
        edges.forEach(edge => {
            fromTo[edge.from].push(edge.to);
            degrees[edge.to] += 1;
        });
    
        let roots = degrees
            .map((d, i) => { return {index: i, degree: d} })
            .filter(e => e.degree == 0);
        if (roots.length == 0) {
            throw 'root layer does not exist!';
        } else if (roots.length > 1) {
            throw 'there are multiple roots!';
        } else if (nodes[roots[0].index].component.name != 'net') {
            throw 'root layer is not net!';
        }
    
        let indexMap = Array(nodes.length).fill(-1);
        let stack = [roots[0].index];
        let counter = 0;
        while (stack.length > 0) {
            let from = stack.pop();
    
            // map old index to new index
            indexMap[from] = counter;
            counter += 1;
    
            let shortcuts = [], routes = [], others = [];
            fromTo[from].forEach(to => {
                degrees[to] -= 1;
                if (degrees[to] == 0) {
                    switch (nodes[to].component.name) {
                        case 'shortcut':
                            shortcuts.push(to);
                            break;
                        case 'route':
                            routes.push(to);
                            break;
                        default:
                            others.push(to);
                    }
                }
            });
    
            // priority: others > shortcut > route
            routes.forEach(e => stack.push(e));
            shortcuts.forEach(e => stack.push(e));
            others.forEach(e => stack.push(e));
        }
    
        if (degrees.filter(d => d > 0).length > 0) {
            throw 'There is cycle in the flowchart!';
        }

        let newNodes = Array(nodes.length).fill(null);
        nodes.forEach(node => {
            let newIndex = indexMap[node.index];
            newNodes[newIndex] = {
                index: newIndex,
                component: node.component,
            };
        });

        let newEdges = new Set();
        edges.forEach(edge => {
            newEdges.add({from: indexMap[edge.from], to: indexMap[edge.to]});
        });

        return {nodes: newNodes, edges: newEdges};
    };

    let rebuildNodes = (nodes, edges) => {
        let fromEdges = Array(nodes.length).fill(null).map(e => new Array(0));
        edges.forEach(edge => {
            fromEdges[edge.to].push(edge.from);
        });
        let newNodes = nodes.map(node => {
            let inputIndices = fromEdges[node.index];

            delete node.component.args.from;
            delete node.component.args.layers;

            switch (node.component.name) {
                case 'net':
                    if (inputIndices.length > 0) {
                        throw 'net should not have input!';
                    }
                    break;
                case 'shortcut':
                    if (inputIndices.length != 2) {
                        throw 'shortcut must have 2 inputs!';
                    }
                    if (inputIndices[0] == node.index - 1) {
                        let indexDiff = inputIndices[1] - node.index;
                        if (indexDiff >= 0) {
                            throw 'shortcut must have previous layer as input!';
                        }
                        node.component.args.from = indexDiff;
                    } else if (inputIndices[1] == node.index - 1) {
                        let indexDiff = inputIndices[0] - node.index;
                        if (indexDiff >= 0) {
                            throw 'shortcut must have previous layer as input!';
                        }
                        node.component.args.from = indexDiff;
                    } else {
                        throw 'shortcut must have previous layer as input!';
                    }
                    break;
                case 'route':
                    if (inputIndices.length == 0) {
                        throw 'route must have input!';
                    }
                    node.component.args.layers = inputIndices
                        .map(i => {
                            let indexDiff = i - node.index;
                            if (indexDiff < 0) {
                                return indexDiff;
                            } else if (indexDiff == 0) {
                                throw 'route should not have itself as input!';
                            } else {
                                return i;
                            }
                        })
                        .join(',');
                    break;
                default:
                    if (inputIndices.length != 1) {
                        throw (node.component.name + ' must have 1 input!');
                    }
                    if (inputIndices[0] != node.index - 1) {
                        throw (node.component.name + ' must have previous layer as input!');
                    }
            }
            return node;
        });
        return newNodes;
    };

    let g = renumber(graph.nodes, graph.edges);
    if (g == null) {
        throw 'fail to renumber graph!';
    }
    let newNodes = rebuildNodes(g.nodes, g.edges);
    return {nodes: newNodes, edges: g.edges};
};

let exportCfg = () => {
    try {
        document.getElementById('cfg').value = '';
        let newGraph = formatGraph(global.graph);
        let str = newGraph.nodes.map(node => {
            let argsStr = Object.keys(node.component.args).map(k => {
                return k + '=' + node.component.args[k];
            }).join('\n');
            return '[' + node.component.name + ']\n' + argsStr;
        }).join('\n\n');

        document.getElementById('cfg').value = str;
    } catch (e) {
        document.getElementById('error-message').innerHTML += `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${e}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
        </div>
        `;
    }
};

let importCfg = () => {
    global.cfg = document.getElementById('cfg').value;
    global.graph = buildGraph(parseCfg(global.cfg));
    console.log(global.graph);
    global.flowchart = initFlowchart(global.graph);
};

let clearDashboard = () => {
    document.getElementById('node-info').innerHTML = '';
    global.cfg = document.getElementById('cfg').value = '[net]';
    global.graph = buildGraph(parseCfg(global.cfg));
    global.flowchart = initFlowchart(global.graph);
};

let parseCfg = (cfg) => {
    let components = cfg.replace(/\#.*/g, '').replace(/\[(.*?)\]/g, '\0$1\n')
        .split('\0')
        .filter(e => !(!e || e.length === 0 || !e.trim()))
        .map(e => {
            let s = e.split(/\n|\r/).filter(e => !(!e || e.length === 0 || !e.trim()));
            if (s.length > 0 && s[0].trim().length > 0) {
                let name = s[0].trim();
                let args = {};
                for (let i = 1; i < s.length; i++) {
                    let t = s[i].split('=');
                    if (t.length == 2 && t[0].trim().length > 0 && t[1].trim().length > 0) {
                        args[t[0].trim()] = t[1].trim();
                    }
                }
                return { 'name': name, 'args': args };
            }
            return null;
        })
        .filter(e => e);
    return components;
};

window.onload = () => {
    // init
    clearDashboard();
};