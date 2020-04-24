let global = {
    'cfg': {},
    'graph': {},
    'flowchart': {},
};

let flowchartConfig = {
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

// let link = () => {
//     let from = parseInt(document.getElementById('from-index').value);
//     let to = parseInt(document.getElementById('to-index').value);
// };

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
        50,
        50,
        flowchartConfig.nodeWidth,
        flowchartConfig.nodeHeight,
        flowchartConfig.connectors,
        node.index + ': ' + node.component.name,
        'green',
        flowchartConfig.rectangleRenderer
    ));
    flowchart.draw();
    // global.flowchart.setNode(node.index, {
    //     label: node.index + ': hello',
    //     id: 'n-' + node.index,
    //     class: 't-' + node.component.name,
    // });
    // renderFlowchart(global.flowchart);
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
        text.push(`
        <div class="form-group row">
            <label class="col-sm-6 col-form-label">${k}</label>
            <label class="col-sm-6 col-form-label"><span class="badge badge-info">${v}</span></label>
        </div>
        `);
    });

    text.push('</form>');
    info.innerHTML = text.join('\n');
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
    ];
    Object.keys(node.component.args).forEach(k => {
        let v = node.component.args[k];
        text.push(`
        <div class="form-group row">
            <label class="col-sm-6 col-form-label">${k}</label>
            <div class="col-sm-6">
                <input type="text" class="form-control" name="${k}" value="${v}">
            </div>
        </div>
        `);
    });

    text.push(`
        <div class="form-group row">
            <div class="col-sm-6">
                <button type="submit" class="btn btn-primary">Save</button>
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
        console.log(component);

        e.preventDefault();
        return false;
    });
};

let initFlowchart = (graph) => {
    // let img = new Image();
    // img.onload = () => {
    //     model.draw();
    // };
               
    
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
        // flowchart.setNode(node.index, {
        //     label: node.index + ': ' + node.component.name,
        //     id: 'n-' + node.index,
        //     class: 't-' + node.component.name,
        // });
    });
    graph.edges.forEach(edge => {
        //flowchart.setEdge(edge.from, edge.to);
        // model.addLink(new model.link(edge.from, edge.to, 1, 0, 'label'));
        model.addLink(new model.link(edge.from, edge.to, 1, 0, ''));
    });

    // console.log( layout.height);
    // console.log(document.getElementById('myCanvas').parentElement);
    document.getElementById('myCanvas').width = document.getElementById('myCanvas').parentElement.clientWidth;
    document.getElementById('myCanvas').height = layout.height;
    // document.getElementById('myCanvas').parentElement.style.clientWidth = layout.width + 10;
    // document.getElementById('myCanvas').parentElement.style.clientHeight = layout.height + 10;
    model.init('myCanvas');
    model.draw();

    document.addEventListener('releaseNode', () => {
        document.getElementById('node-info').innerHTML = '';
    });
    document.addEventListener('selectionChanged', e => showNodeDetail(e.detail));
    document.addEventListener('nodesLinked', (e) => {
        console.log(e.detail.from);
        console.log(e.detail.to);
    });

    document.addEventListener('clickNode', e => showNodeEditor(e.detail));

    document.addEventListener('clickLink', (e) => {
        console.log(e.detail);
    });

    return model;
    // let flowchart = new dagreD3.graphlib.Graph()
    // .setGraph({})
    // .setDefaultEdgeLabel(function() { return {}; });
    // graph.nodes.forEach(node => {
    //     flowchart.setNode(node.index, {
    //         label: node.index + ': ' + node.component.name,
    //         id: 'n-' + node.index,
    //         class: 't-' + node.component.name,
    //     });
    // });
    // flowchart.nodes().forEach(function(v) {
    //     let node = flowchart.node(v);
    //     node.rx = node.ry = 5;
    // });
    // graph.edges.forEach(edge => {
    //     flowchart.setEdge(edge.from, edge.to);
    // });
    // renderFlowchart(flowchart);

    // return flowchart;
};

let buildGraph = (components) => {
    let nodes = [], edges = [];
    components.forEach((component, index) => {
        nodes.push({ 'index': index, 'component': component });
        if (index > 0) {
            switch (component.name) {
                case 'convolutional':
                    edges.push({ 'from': index - 1, 'to': index });
                    break;
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

// let appendEventForNode = (graph) => {
//     graph.nodes.forEach(node => {
//         let id = 'n-' + node.index;
//         document.getElementById(id).addEventListener('mouseover', () => {
//             let componentDetail = JSON.stringify(node.component.args);
//             document.getElementById('node-info').innerHTML = componentDetail;
//         });

//         document.getElementById(id).addEventListener('mouseout', () => {
//             document.getElementById('node-info').innerHTML = '';
//         });
//     });
// };

let exportCfg = () => {
    let str = global.graph.nodes.map(node => {
        let argsStr = Object.keys(node.component.args).map(k => {
            return k + '=' + node.component.args[k];
        }).join('\n');
        return '[' + node.component.name + ']\n' + argsStr;
    }).join('\n\n');

    document.getElementById('cfg').value = str;
};

let importCfg = () => {
    global.cfg = document.getElementById('cfg').value;
    global.graph = buildGraph(parseCfg(global.cfg));
    global.flowchart = initFlowchart(global.graph);
    //appendEventForNode(global.graph);
    //appendEventForSvg();
    //console.log( exportCfg(graph) );
    //updateGraph(flowchart, graph, 3);
};

let parseCfg = (cfg) => {
    let components = cfg.replace(/\#.*/g, '').replace(/\[(.*?)\]/g, '\0$1\n')
        .split('\0')
        .filter(e => !(!e || e.length === 0 || !e.trim()))
        .map(e => {
            let s = e.split(/\n|\r/).filter(e => !(!e || e.length === 0 || !e.trim()))
            if (s.length > 1 && s[0].trim().length > 0) {
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