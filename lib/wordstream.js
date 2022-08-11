(function (window) {
    window.wordstream = function (svg, data, config) {
        d3.wordstreamLayout = function () {
            let data = [],
                size = [1200, 500],
                maxFontSize = 24,
                minFontSize = 10,
                font = "Arial",
                flag = "n",
                fontScale = d3.scaleLinear(),
                frequencyScale = d3.scaleLinear(),
                spiral = achemedeanSpiral,
                canvas = cloudCanvas,
                curve = d3.curveMonotoneX,
                categories = [],
                topWord = 10;
            let wordstream = {};

            let cloudRadians = Math.PI / 180, toDegree = 180 / Math.PI,
                cw = 1 << 12,
                ch = 1 << 12;

            let maxSud, minSud, maxFreq, minFreq;

            wordstream.boxes = function () {
                data.forEach(d => {
                    categories.forEach(topic => {
                        d.words[topic].splice(topWord)
                    })
                });
                let boxWidth = size[0] / data.length;
                buildFontScale(data);
                buildFrequencyScale(data);
                let boxes = buildBoxes(data);
                //Get the sprite for each word
                getImageData(boxes);
                //Set for each stream
                for (let tc = 0; tc < boxes.topics.length; tc++) {
                    let topic = boxes.topics[tc];
                    let board = buildBoard(boxes, topic);
                    let innerBoxes = boxes.innerBoxes[topic];
                    let layer = boxes.layers[tc];
                    //Place
                    for (let bc = 0; bc < boxes.data.length; bc++) {
                        let words = boxes.data[bc].words[topic];
                        let n = words.length;
                        let innerBox = innerBoxes[bc];
                        board.boxWidth = innerBox.width;
                        board.boxHeight = innerBox.height;
                        board.boxX = innerBox.x;
                        board.boxY = innerBox.y;
                        for (let i = 0; i < n; i++) {
                            place(words[i], board);
                        }
                    }
                }
                return boxes;
            };

            //#region helper functions
            function buildFontScale(data) {
                let topics = d3.keys(data[0].words);
                //#region scale for the font size.
                let maxSudden = 0;
                let minSudden = Number.MAX_SAFE_INTEGER;
                let maxFrequency = 0;
                let minFrequency = Number.MAX_SAFE_INTEGER;
                d3.map(data, function (box) {
                    d3.map(topics, function (topic) {
                        let maxF = d3.max(box.words[topic], function (d) {
                            return d.frequency;
                        });
                        let minF = d3.min(box.words[topic], function (d) {
                            return d.frequency;
                        });
                        if (maxFrequency < maxF) maxFrequency = maxF;
                        if (minFrequency > minF) minFrequency = minF;
                        // ---------------------------------------------
                        // let maxS = d3.max(box.words[topic], function(d){
                        //     return d.sudden;
                        // });
                        // let minS = d3.min(box.words[topic], function(d){
                        //     return d.sudden;
                        // });
                        // if(maxSudden < maxS) maxSudden = maxS;
                        // if(minSudden > minS) minSudden = minS;
                    })
                });
                //fontScale.domain([minFrequency, maxFrequency]).range([minFontSize, maxFontSize]);
                // maxSud = maxSudden;
                // minSud = minSudden;
                maxFreq = maxFrequency;
                minFreq = minFrequency;
                fontScale.domain([minFreq, maxFreq]).range([minFontSize, maxFontSize]);
            }

            function buildFrequencyScale(data) {
                let totalFrequencies = calculateTotalFrequenciesABox(data);
                let max = 0;
                d3.map(totalFrequencies, function (d) {
                    let keys = d3.keys(totalFrequencies[0]);
                    let total = 0;
                    keys.forEach(key => {
                        total += d[key];
                    });
                    if (total > max) max = total;
                });
                frequencyScale.domain([0, max]).range([0, size[1]]);
            }

            //Convert from data to box
            function buildBoxes(data) {
                //Build settings based on frequencies
                let totalFrequencies = calculateTotalFrequenciesABox(data);
                let topics = d3.keys(data[0].words);
                //#region creating boxes
                let numberOfBoxes = data.length;
                let boxes = {};
                let boxWidth = ~~(size[0] / numberOfBoxes);
                //Create the stacked data
                let allPoints = [];
                topics.forEach(topic => {
                    let dataPerTopic = [];
                    //Push the first point
                    dataPerTopic.push({x: 0, [topic]: frequencyScale(totalFrequencies[0][topic])});
                    totalFrequencies.forEach((frq, i) => {
                        dataPerTopic.push({x: (i * boxWidth) + (boxWidth >> 1), [topic]: frequencyScale(frq[topic])});
                    });

                    //Push the last point
                    dataPerTopic.push({
                        x: size[0],
                        [topic]: frequencyScale(totalFrequencies[totalFrequencies.length - 1][topic])
                    });//TODO:
                    allPoints.push(dataPerTopic);
                });

                let pointData = [];
                for (let i = 0; i < allPoints[0].length; i++) {
                    pointData[i] = {
                        x: allPoints[0][i].x
                    };
                    categories.forEach((d, j) => {
                        pointData[i] = Object.assign(pointData[i], allPoints[j][i]);
                    })
                }

                let stack = d3.stack()
                    .keys(categories)
                    .offset(d3.stackOffsetWiggle);

                let layers = stack(pointData);
                let innerBoxes = {};
                let firstLayerPeak = d3.min(layers[0], d => d[0]); // get peak

                layers.forEach(layer => {
                    layer.forEach(d => {
                        d[0] = d[0] - firstLayerPeak;
                        d[1] = d[1] - firstLayerPeak;
                    });
                });

                topics.forEach((topic, i) => {
                    innerBoxes[topic] = [];
                    for (let j = 1; j < layers[i].length - 1; j++) {
                        innerBoxes[topic].push({
                            x: layers[i][j].data.x - (boxWidth >> 1),
                            y: layers[i][j][0],
                            width: boxWidth,
                            height: layers[i][j][1] - layers[i][j][0]
                        });
                    }
                });
                boxes = {
                    topics: topics,
                    data: data,
                    layers: layers,
                    innerBoxes: innerBoxes
                };
                return boxes;
            }

            function place(word, board) {
                let bw = board.width,
                    bh = board.height,
                    maxDelta = ~~Math.sqrt((board.boxWidth * board.boxWidth) + (board.boxHeight * board.boxHeight)),
                    startX = ~~(board.boxX + (board.boxWidth * (Math.random() + .5) >> 1)),
                    startY = ~~(board.boxY + (board.boxHeight * (Math.random() + .5) >> 1)),
                    s = spiral([board.boxWidth, board.boxHeight]),
                    dt = Math.random() < .5 ? 1 : -1,
                    t = -dt,
                    dxdy, dx, dy;
                word.x = startX;
                word.y = startY;
                word.placed = false;
                while (dxdy = s(t += dt)) {
                    dx = ~~dxdy[0];
                    dy = ~~dxdy[1];

                    if (Math.max(Math.abs(dx), Math.abs(dy)) >= (maxDelta))
                        break;

                    word.x = startX + dx;
                    word.y = startY + dy;

                    if (word.x + word.x0 < 0 || word.y + word.y0 < 0 || word.x + word.x1 > size[0] || word.y + word.y1 > size[1])
                        continue;
                    if (!cloudCollide(word, board)) {
                        placeWordToBoard(word, board);
                        word.placed = true;
                        break;
                    }
                }
            }

            //board has current bound + which is placed at the center
            //x, y of the word is placed at the center
            function cloudCollide(word, board) {
                let wh = word.height,
                    ww = word.width,
                    bw = board.width;
                //For each pixel in word
                for (let j = 0; j < wh; j++) {
                    for (let i = 0; i < ww; i++) {
                        let wsi = j * ww + i; //word sprite index;
                        let wordPixel = word.sprite[wsi];

                        let bsi = (j + word.y + word.y0) * bw + i + (word.x + word.x0);//board sprite index
                        let boardPixel = board.sprite[bsi];

                        if (boardPixel != 0 && wordPixel != 0) {
                            return true;
                        }
                    }
                }
                return false;
            }

            function placeWordToBoard(word, board) {
                //Add the sprite
                let y0 = word.y + word.y0,
                    x0 = word.x + word.x0,
                    bw = board.width,
                    ww = word.width,
                    wh = word.height;
                for (let j = 0; j < wh; j++) {
                    for (let i = 0; i < ww; i++) {
                        let wsi = j * ww + i;
                        let bsi = (j + y0) * bw + i + x0;
                        if (word.sprite[wsi] != 0) board.sprite[bsi] = word.sprite[wsi];
                    }
                }
            }

            function buildSvg(boxes, topic) {
                streamPath1 = Array(),
                    streamPath2 = Array();
                let width = size[0],
                    height = size[1];
                let svg = d3.select(document.createElement('svg'))
                    .attr("width", width)
                    .attr("height", height);

                let graphGroup = svg.append('g');
                let n = boxes.length;

                let catIndex = boxes.topics.indexOf(topic);

                let area1 = d3.area()
                    .curve(curve)
                    .x(function (d) {
                        return (d.data.x);
                    })
                    .y0(0)
                    .y1(function (d) {
                        return d[0];
                    });

                let area2 = d3.area()
                    .curve(curve)
                    .x(function (d) {
                        return (d.data.x);
                    })
                    .y0(function (d) {
                        return (d[1]);
                    })
                    .y1(height);

                graphGroup.append('path').datum(boxes.layers[catIndex])
                    .attr("d", area1)
                    .attr("stroke", "red")
                    .attr("stroke-width", 2)
                    .attr("fill", "red")
                    .attr("id", "path1");

                graphGroup.append('path').datum(boxes.layers[catIndex])
                    .attr("d", area2)
                    .attr("stroke", "red")
                    .attr("stroke-width", 2)
                    .attr("fill", "red")
                    .attr("id", "path2");

                return svg;
            }

            function buildCanvas(boxes, topic) {
                let svg = buildSvg(boxes, topic);
                let path1 = svg.select("#path1").attr('d');
                let p2d1 = new Path2D(path1);
                let path2 = svg.select("#path2").attr('d');
                let p2d2 = new Path2D(path2);
                let canvas = document.createElement("canvas");
                canvas.width = size[0];
                canvas.height = size[1];
                let ctx = canvas.getContext('2d');
                ctx.fillStyle = 'red';
                ctx.fill(p2d1);
                ctx.fill(p2d2);
                return canvas;
            }

            function buildBoard(boxes, topic) {
                let canvas = buildCanvas(boxes, topic);
                let width = canvas.width,
                    height = canvas.height;
                let board = {};
                board.x = 0;
                board.y = 0;
                board.width = width;
                board.height = height;
                let sprite = [];
                //initialization
                for (let i = 0; i < width * height; i++) sprite[i] = 0;
                let c = canvas.getContext('2d');
                let pixels = c.getImageData(0, 0, width, height).data;
                for (let i = 0; i < width * height; i++) {
                    sprite[i] = pixels[i << 2];
                }
                board.sprite = sprite;
                return board;
            }

            function getContext(canvas) {
                canvas.width = cw;
                canvas.height = ch;
                let context = canvas.getContext("2d");
                context.fillStyle = context.strokeStyle = "red";
                context.textAlign = "center";
                context.textBaseline = "middle";
                return context;
            }

            function angle(boxes) {
                let angles = [];

                let y1upper, y2upper, y1lower, y2lower, x;
                let angle1, angle2, angle;
                let innerBoxes = boxes.innerBoxes;
                for (let i = 0; i < d3.keys(innerBoxes).length; i++) {   // i: index cua topic
                    let key = d3.keys(innerBoxes)[i];

                    for (let j = 0; j < innerBoxes[key].length - 1; j++) {     // j: index cua doi tuong

                        x = boxes.innerBoxes[key][j].width;

                        y1upper = innerBoxes[key][j].y;
                        y2upper = innerBoxes[key][j + 1].y;

                        y1lower = innerBoxes[key][j].y + innerBoxes[key][j].height;
                        y2lower = innerBoxes[key][j + 1].y + innerBoxes[key][j + 1].height;

                        angle1 = Math.atan2(y1upper - y2upper, x);
                        angle2 = Math.atan2(y1lower - y2lower, x);

                        angle = (angle1 + angle2) / 2 * toDegree;

                        angles.push({
                            topic: key,
                            timeStep: j,
                            angle: angle
                        });
                        if (j === innerBoxes[key].length - 2) {    // phan tu cuoi
                            angles.push({
                                topic: key,
                                timeStep: j + 1,
                                angle: 0
                            });
                        }
                    }
                }
                return angles;
            }

            //Get image data for all words
            function getImageData(boxes) {
                let av = flag.includes("a") ? 15 : 0;
                let flow = 0;
                // let angles = angle(boxes);
                let data = boxes.data;
                let c = getContext(canvas());
                c.clearRect(0, 0, cw, ch);
                let x = 0,
                    y = 0,
                    maxh = 0;
                for (let i = 0; i < data.length; i++) {
                    boxes.topics.forEach(topic => {
                        let words = data[i].words[topic];
                        let n = words.length;
                        let di = -1;
                        let d = {};
                        // if (flag.includes("f")){
                        //     for (let k in angles){
                        //         if ((topic === angles[k].topic) && (i === angles[k].timeStep)){
                        //             flow = angles[k].angle;
                        //             break;
                        //         }
                        //     }
                        // }
                        while (++di < n) {
                            d = words[di];
                            c.save();
                            // d.fontSize = ~~fontScale(d.frequency);
                            d.fontSize = ~~fontScale(d.frequency);
                            d.rotate = (~~(Math.random() * 4) - 2) * av - flow;
                            // d.rotate = (~~(Math.random() * 6) - 3) * rotateCorner;
                            c.font = ~~(d.fontSize + 1) + "px " + font;

                            let w = ~~(c.measureText(d.text).width),
                                h = d.fontSize;
                            if (d.rotate) {
                                let sr = Math.sin(d.rotate * cloudRadians),
                                    cr = Math.cos(d.rotate * cloudRadians),
                                    wcr = w * cr,
                                    wsr = w * sr,
                                    hcr = h * cr,
                                    hsr = h * sr;
                                w = ~~Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr));
                                h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
                            }
                            if (h > maxh) maxh = h;
                            if (x + w >= cw) {
                                x = 0;
                                y += maxh;
                                maxh = 0;
                            }
                            if (y + h >= ch) break;
                            c.translate((x + (w >> 1)), (y + (h >> 1)));
                            if (d.rotate) c.rotate(d.rotate * cloudRadians);
                            c.fillText(d.text, 0, 0);
                            if (d.padding) c.lineWidth = 2 * d.padding, c.strokeText(d.text, 0, 0);
                            c.restore();

                            d.width = w;
                            d.height = h;
                            d.x = x;
                            d.y = y;
                            d.x1 = w >> 1;
                            d.y1 = h >> 1;
                            d.x0 = -d.x1;
                            d.y0 = -d.y1;
                            d.timeStep = i;
                            d.streamHeight = frequencyScale(d.frequency);
                            x += w;
                        }
                    });
                }
                for (let bc = 0; bc < data.length; bc++) {
                    boxes.topics.forEach(topic => {
                        let words = data[bc].words[topic];
                        let n = words.length;
                        let di = -1;
                        let d = {};
                        while (++di < n) {
                            d = words[di];
                            let w = d.width,
                                h = d.height,
                                x = d.x,
                                y = d.y;
                            let pixels = c.getImageData(d.x, d.y, d.width, d.height).data;
                            d.sprite = Array();
                            for (let i = 0; i << 2 < pixels.length; i++) {
                                d.sprite.push(pixels[i << 2]);
                            }
                        }
                    });
                }
                //Only return this to test if needed
                return c.getImageData(0, 0, cw, ch);
            }

            function calculateTotalFrequenciesABox(data) {
                let topics = d3.keys(data[0].words);
                let totalFrequenciesABox = Array();
                d3.map(data, function (row) {
                    let aBox = {};
                    topics.forEach(topic => {
                        let totalFrequency = 0;
                        row.words[topic].forEach(element => {
                            totalFrequency += element.frequency;
                        });
                        aBox[topic] = totalFrequency;
                    });
                    totalFrequenciesABox.push(aBox);
                });
                return totalFrequenciesABox;
            }

            //#endregion
            //#region defining the spirals
            function achemedeanSpiral(size) {
                let e = size[0] / size[1];
                return function (t) {
                    return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
                }
            };

            function rectangularSpiral(size) {
                let dy = 4,
                    dx = dy * size[0] / size[1],
                    x = 0,
                    y = 0;
                return function (t) {
                    let sign = t < 0 ? -1 : 1;
                    switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
                        case 0:
                            x += dx;
                            break;
                        case 1:
                            y += dy;
                            break;
                        case 2:
                            x -= dx;
                            break;
                        default:
                            y -= dy;
                            break;
                    }
                }
            };
            let spirals = {
                achemedean: achemedeanSpiral,
                rectangular: rectangularSpiral
            };

            function cloudCanvas() {
                return document.createElement("canvas");
            }

            //#endregion
            //#region exposed methods to test, should be deleted
            wordstream.getImageData = getImageData;
            wordstream.cloudCollide = cloudCollide;
            wordstream.place = place;
            wordstream.buildSvg = buildSvg;
            wordstream.buildCanvas = buildCanvas;
            wordstream.buildBoard = buildBoard;
            wordstream.placeWordToBoard = placeWordToBoard;
            wordstream.buildBoxes = buildBoxes;
            wordstream.buildFontScale = buildFontScale;
            //#endregion
            //Exporting the functions to set configuration data
            //#region setter/getter functions
            wordstream.curve = function (_) {
                return arguments.length ? (curve = _, wordstream) : curve;
            }
            wordstream.streamPath1 = function (_) {
                return arguments.length ? (streamPath1 = _, wordstream) : streamPath1;
            }
            wordstream.streamPath2 = function (_) {
                return arguments.length ? (streamPath1 = _, wordstream) : streamPath2;
            }
            wordstream.font = function (_) {
                return arguments.length ? (font = _, wordstream) : font;
            }
            wordstream.frequencyScale = function (_) {
                return arguments.length ? (frequencyScale = _, wordstream) : frequencyScale;
            }
            wordstream.spiral = function (_) {
                return arguments.length ? (spiral = spirals[_] || _, wordstream) : spiral;
            }
            wordstream.data = function (_) {
                return arguments.length ? (data = _, wordstream) : data;
            };
            wordstream.size = function (_) {
                return arguments.length ? (size = _, wordstream) : size;
            };
            wordstream.maxFontSize = function (_) {
                return arguments.length ? (maxFontSize = _, wordstream) : maxFontSize;
            };
            wordstream.minFontSize = function (_) {
                return arguments.length ? (minFontSize = _, wordstream) : minFontSize;
            };
            wordstream.minSud = function (_) {
                return arguments.length ? (minSud = _, wordstream) : minSud;
            };
            wordstream.maxSud = function (_) {
                return arguments.length ? (maxSud = _, wordstream) : maxSud;
            };
            wordstream.minFreq = function (_) {
                return arguments.length ? (minFreq = _, wordstream) : minFreq;
            };
            wordstream.maxFreq = function (_) {
                return arguments.length ? (maxFreq = _, wordstream) : maxFreq;
            };
            wordstream.fontScale = function (_) {
                return arguments.length ? (fontScale = _, wordstream) : fontScale;
            };
            wordstream.font = function (_) {
                return arguments.length ? (font = _, wordstream) : font;
            };
            wordstream.flag = function (_) {
                return arguments.length ? (flag = _, wordstream) : flag;
            };
            wordstream.categories = function (_) {
                return arguments.length ? (categories = _, wordstream) : categories;
            };
            wordstream.topWord = function (_) {
                return arguments.length ? (topWord = _, wordstream) : topWord;
            };
            //#endregion
            return wordstream;
        };
        (function (data) {
            let globalWidth = +svg.attr("width"),
                globalHeight = +svg.attr("height"),
                minFont = config.minFont,
                maxFont = config.maxFont,
                topWord = config.topWord,
                tickFont = config.tickFont,
                legendFont = config.legendFont,
                curve = config.curve;

            const color = d3.scaleOrdinal(d3.schemeCategory10);
            const axisPadding = 10;
            const legendOffset = 10;
            const margins = {left: 20, top: 20, right: 10, bottom: 30};
            const font = "Arial";

            let opacity, maxFreq, minFreq;
            let categories = d3.keys(data[0].words);
            let axisGroup = svg.append('g').attr("id", "axisGroup");
            let xGridlinesGroup = svg.append('g').attr("id", "xGridlinesGroup");
            let mainGroup = svg.append('g').attr("id", "main");
            let legendGroup = svg.append('g').attr("id", "legend");
            let legendHeight = categories.length * legendFont;
            let width = globalWidth - (margins.left + margins.top);
            let height = globalHeight - (+margins.top + margins.bottom + axisPadding + legendHeight);

            let ws = d3.wordstreamLayout()
                .size([width, height])
                .fontScale(d3.scaleLinear())
                .minFontSize(minFont)
                .maxFontSize(maxFont)
                .data(data)
                .categories(categories)
                .topWord(topWord)
                .curve(curve)
            ;
            let boxes = ws.boxes();
            maxFreq = ws.maxFreq();
            minFreq = ws.minFreq();

            let area = d3.area()
                .curve(curve)
                .x(d => d.data.x)
                .y0(d => d[0])
                .y1(d => d[1]);

            //Display time axes
            let dates = [];
            boxes.data.forEach(row => {
                dates.push(row.date);
            });

            let layers = boxes.layers;
            let firstLayerPeak = d3.min(layers[0], d => d[0]); // get peak

            let xAxisScale = d3.scaleBand().domain(dates).rangeRound([0, width]);
            let xAxis = d3.axisBottom(xAxisScale);

            axisGroup
                .attr('transform', 'translate(' + (margins.left) + ',' + (height + margins.top + axisPadding + legendHeight) + ')');
            let axisNodes = axisGroup.call(xAxis);
            styleAxis(axisNodes);

            //Display the vertical gridline
            let xGridlineScale = d3.scaleBand().domain(d3.range(0, dates.length + 1)).rangeRound([0, width + width / boxes.data.length]);
            let xGridlinesAxis = d3.axisBottom(xGridlineScale);

            xGridlinesGroup.attr('transform', 'translate(' + (margins.left - width / boxes.data.length / 2) + ',' + (height + margins.top + axisPadding + legendHeight + margins.bottom) + ')');

            let gridlineNodes = xGridlinesGroup
                .call(xGridlinesAxis
                    .tickSize(-height - axisPadding - legendHeight - margins.bottom, 0, 0)
                    .tickFormat(''));
            styleGridlineNodes(gridlineNodes);

            // Main group
            mainGroup.attr('transform', 'translate(' + margins.left + ',' + (margins.top - firstLayerPeak) + ')');
            let wordstreamG = mainGroup.append('g').attr("id", "wordstreamG");

            // draw curves
            let curveGroup = mainGroup.selectAll('.curve').data(boxes.layers);

            curveGroup.exit().remove();

            curveGroup.enter()
                .append('path')
                .attr('d', area)
                .style('fill', function (d, i) {
                    return color(i);
                })
                .attr("class", "curve")
                .attr('fill-opacity', 0)
                .attr("stroke", "black")
                .attr('stroke-width', 0)
                .attr("topic", (d, i) => categories[i]);

            curveGroup.attr("d", area)
                .style('fill', function (d, i) {
                    return color(i);
                })
                .attr('fill-opacity', 0)
                .attr("stroke", "black")
                .attr('stroke-width', 0)
                .attr("topic", (d, i) => categories[i]);

            let allWords = [];
            d3.map(boxes.data, function (row) {
                boxes.topics.forEach(topic => {
                    allWords = allWords.concat(row.words[topic]);
                });
            });

            opacity = d3.scaleLog()
                .domain([minFreq, maxFreq])
                .range([0.4, 1]);

            let prevColor;

            let texts = mainGroup.selectAll('.word').data(allWords, d => d.id);

            texts.exit().remove();

            let textEnter = texts.enter().append('g')
                .attr("transform", function (d) {
                    return 'translate(' + d.x + ', ' + d.y + ')rotate(' + d.rotate + ')';
                })
                .attr("class", "word")
                .append('text');

            textEnter
                .text(function (d) {
                    return d.text;
                })
                .attr("id", d => d.id,)
                .attr("class", "textData")
                .attr('font-family', font)
                .attr('font-size', function (d) {
                    return d.fontSize;
                })
                .attr("fill", function (d, i) {
                    return color(categories.indexOf(d.topic));
                })
                .attr("fill-opacity", function (d) {
                    return opacity(d.frequency);
                })
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .attr("topic", function (d) {
                    return d.topic;
                })
                .attr("visibility", function (d) {
                    return d.placed ? "visible" : "hidden";
                });

            texts
                .attr("transform", function (d) {
                    return 'translate(' + d.x + ', ' + d.y + ')rotate(' + d.rotate + ')';
                })

                .select("text")
                .attr('font-size', function (d) {
                    return d.fontSize;
                })
                .attr("visibility", function (d) {
                    return d.placed ? "visible" : "hidden"
                });

            //Highlight
            mainGroup.selectAll('.textData').on('mouseenter', function () {
                let thisText = d3.select(this);
                thisText.style('cursor', 'pointer');
                prevColor = thisText.attr('fill');
                let text = thisText.text();
                let topic = thisText.attr('topic');
                let allTexts = mainGroup.selectAll('.textData').filter(t => {
                    return t && t.text === text && t.topic === topic;
                });
                allTexts
                    .attr("stroke", prevColor)
                    .attr("stroke-width", 1);
            });
            mainGroup.selectAll('.textData').on('mouseout', function () {
                let thisText = d3.select(this);
                thisText.style('cursor', 'default');
                let text = thisText.text();
                let topic = thisText.attr('topic');
                let allTexts = mainGroup.selectAll('.textData').filter(t => {
                    return t && !t.cloned && t.text === text && t.topic === topic;
                });
                allTexts
                    .attr("stroke", "none")
                    .attr("stroke-width", 0);
            });
            //Click
            mainGroup.selectAll('.textData').on('click', function () {
                let thisText = d3.select(this);
                let text = thisText.text();
                let topic = thisText.attr('topic');
                let allTexts = mainGroup.selectAll('.textData').filter(t => {
                    return t && t.text === text && t.topic === topic;
                })._groups;
                //Select the data for the stream layers
                let streamLayer = d3.select("path[topic='" + topic + "']").data()[0];
                //Push all points
                let points = Array();
                //Initialize all points
                streamLayer.forEach((elm, i) => {
                    let item = [];
                    item[0] = elm[1];
                    item[1] = elm[1];
                    item.data = elm.data;
                    points.push(item);
                });
                allTexts[0].forEach(t => {
                    let data = t.__data__;
                    let fontSize = data.fontSize;
                    //The point
                    let thePoint = points[data.timeStep + 1];
                    //+1 since we added 1 to the first point and 1 to the last point.
                    thePoint[1] = thePoint[0] - data.streamHeight;
                    //Set it to visible.
                    //Clone the nodes.
                    let clonedNode = t.cloneNode(true);
                    d3.select(clonedNode)
                        .attr("visibility", "visible")
                        .attr("stroke", 'none')
                        .attr("stroke-size", 0);

                    let clonedParentNode = t.parentNode.cloneNode(false);
                    clonedParentNode.appendChild(clonedNode);

                    t.parentNode.parentNode.appendChild(clonedParentNode);
                    d3.select(clonedParentNode)
                        .attr("cloned", true)
                        .attr("topic", topic)
                        .transition().duration(300)
                        .attr("transform", function (d, i) {
                            return 'translate(' + thePoint.data.x + ',' + (thePoint[1] - fontSize / 2) + ')';
                        });
                });
                //Add the first and the last points
                points[0][1] = points[1][1];//First point
                points[points.length - 1][1] = points[points.length - 2][1];//Last point
                //Append stream
                wordstreamG.append('path')
                    .datum(points)
                    .attr('d', area)
                    .style('fill', prevColor)
                    .attr("fill-opacity", 1)
                    .attr("stroke", 'black')
                    .attr('stroke-width', 0.3)
                    .attr("topic", topic)
                    .attr("wordstream", true);
                //Hide all other texts
                let allOtherTexts = mainGroup.selectAll('.textData').filter(t => {
                    return t && !t.cloned && t.topic === topic;
                });
                allOtherTexts.attr('visibility', 'hidden');
            });
            categories.forEach(topic => {
                d3.select("path[topic='" + topic + "']").on('click', function () {
                    mainGroup.selectAll('.textData').filter(t => {
                        return t && !t.cloned && t.placed && t.topic === topic;
                    })
                        .attr("visibility", "visible");
                    //Remove the cloned element
                    document.querySelectorAll("g[cloned='true'][topic='" + topic + "']").forEach(node => {
                        node.parentNode.removeChild(node);
                    });
                    //Remove the added path for it
                    document.querySelectorAll("path[wordstream='true'][topic='" + topic + "']").forEach(node => {
                        node.parentNode.removeChild(node);
                    });
                });

            });

            //Build the legends
            legendGroup.attr('transform', 'translate(' + margins.left + ',' + (height + margins.top + legendOffset) + ')');
            let legendNodes = legendGroup.selectAll('g').data(boxes.topics).enter().append('g')
                .attr('transform', function (d, i) {
                    return 'translate(' + 10 + ',' + (i * legendFont) + ')';
                });
            legendNodes.append('circle')
                .attr("r", 5)
                .attr("fill", (d, i) => color(i))
                .attr('fill-opacity', 1)
                .attr("stroke", "black")
                .attr("stroke-width", 0.5);

            legendNodes.append('text')
                .text(d => d)
                .attr('font-size', legendFont)
                .attr('alignment-baseline', "middle")
                .attr("dx", 8);

            function styleAxis(axisNodes) {
                axisNodes.selectAll('.domain')
                    .attr("fill", "none")
                    .attr("stroke-opacity", 0);

                axisNodes.selectAll('.tick line')
                    .attr("fill", "none")
                    .attr("stroke-opacity", 0);

                axisNodes.selectAll('.tick text')
                    .attr('font-family', 'serif')
                    .attr('font-size', tickFont);
            }

            function styleGridlineNodes(gridlineNodes) {
                gridlineNodes.selectAll('.domain')
                    .attr("fill", "none")
                    .attr("stroke", "none");

                gridlineNodes.selectAll('.tick line')
                    .attr("fill", "none")
                    .attr("stroke-width", 0.7)
                    .attr("stroke", 'lightgray');
            }
        })(data);
        return window.wordstream;
    }
})(window);
