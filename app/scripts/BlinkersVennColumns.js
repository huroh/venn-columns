function BlinkersVennColumnsChart() {
    // **********************
    // Parameters for controlling the properties of the chart,
    // each has a chart.* accessfor function for get/set
    // **********************
    var width = 600,
        minWidth = 500,
        height = 520,
        padding = 6, // separation between nodes
        minRadius = 25,
        maxRadius = 65,
        m = 3, // number of node clusters
        maxCharLength = 22,
        margin = 70;
    var pcFormat = d3.format(".0%");

    var colorRange = [colorbrewer['Greens']['9'][4], colorbrewer['YlOrRd']['9'][2], colorbrewer['Reds']['9'][4]];
    var color = d3.scale.ordinal()
        .domain(d3.range(m));
    var xVenn = d3.scale.ordinal()
        .domain(d3.range(m))
        .rangeBands([0, width]);

    var data;
    var setLabels = ["", "", ""];

    var nameLookup = {};


    // **********************
    // The chart function 
    // Selects a div element (selection) and appends an SVG with the horizontal bar chart
    // **********************
    function chart(selection) {

        // **********************
        // handing new personalized data
        // **********************        

        d3.select("#chart svg")
            .remove();

        data.forEach(function(d) {
            nameLookup[d.name] = d;
        });

        color
            .range(colorRange);

        selection.each(function() {

            var svg = d3.select(this)
                .append("svg")
                .attr("width", width)
                .attr("height", height);


            // **********************
            // Update domains of color scale based on the data
            // **********************            
            var radiusScale = d3.scale.linear()
                .domain([d3.min(data, function(d) {
                    return trimName(d.name)
                        .length;
                }), d3.max(data, function(d) {
                    return trimName(d.name)
                        .length;
                })])
                .range([minRadius, maxRadius]);

            // **********************
            // Make an array of the nodes, with attributes for feeding into force layout
            // ********************** 
            var nodes = d3.range(data.length)
                .map(function(i) {
                    var node = data[i];
                    node.radius = radiusScale(trimName(node.name)
                        .length);
                    node.color = color(node.set);
                    node.cx = xVenn(node.set) + (width / 6);
                    node.cy = height / 2;
                    node.name = node.name;
                    return node;
                });

            // **********************
            // Make force layout
            // ********************** 
            var force = d3.layout.force()
                .nodes(nodes)
                .size([width, height])
                .gravity(0)
                .charge(function(d) {
                    return -Math.pow(d.radius, 2.0) / 8;
                })
                .friction(0.9)
                .on("tick", tick)
                .start();

            // **********************
            // Function for retrieving the properties of each set of nodes
            // ********************** 
            var venn = color.range()
                .map(function(d, i) {
                    return {
                        radius: Math.sqrt(50) * maxRadius,
                        color: d,
                        set: i
                    };
                });

            var vennCircles = svg.selectAll("g.vennCircle")
                .data(venn)
                .enter()
                .append('g')


            // **********************
            // Show as legend labels for the three categories of nodes
            // ********************** 
            var vennLabels = vennCircles.append('g')
                .attr("transform", function(d, i) {
                    return "translate(" + (xVenn(i) + width / 6) + "," + 20 + ")";
                });

            var vennText = vennLabels.append("text")
                .attr('class', 'vennLabel')
                .text(function(d) {
                    return setLabels[d.set]
                })
                .style("font-size", function(d) {
                    return "16px";
                })
                .attr("fill-opacity", 1)
                .attr("dy", ".35em")

            vennLabels.append("rect")
                .style("fill", function(d) {
                    return d.color;
                })
                .attr("opacity", 1)
                .attr("height", 10)
                .attr("width", 200)
                .attr("rx", 3)
                .attr("ry", 3)
                .attr("x", -100)
                .attr("y", -20)


            // **********************
            // Show as legend the percentage of matching node elements
            // ********************** 
            var count_left = 0;
            var count_right = 0;
            var count_overlap = 0;
            for (var i = 0; i < data.length; i++) {
                if (data[i].set == 1) {
                    count_overlap++;
                } else if (data[i].set == 0) {
                    count_left++;
                } else if (data[i].set == 2) {
                    count_right++;
                }
            }

            var vennMatch = svg.append('g')
                .attr("transform", function(d, i) {
                    return "translate(" + (xVenn(1) + width / 6) + "," + height + ")";
                });

            vennMatch.append('text')
                .attr("x", 0)
                .attr("y", 0)
                .attr("dy", ".35em")
                .style("font-size", function(d) {
                    return "20px";
                })
                .text(function(d) {
                    return pcFormat(count_overlap / data.length) + " match"
                })
                .attr("transform", function(d, i) {
                    return "translate(" + 0 + "," + (-20) + ")";
                });

            vennMatch.append("rect")
                .style("fill", function(d) {
                    return color.range()[1];
                })
                .attr("fill-opacity", 1)
                .attr("opacity", 1)
                .attr("height", 10)
                .attr("width", 200)
                .attr("rx", 3)
                .attr("ry", 3)
                .attr("x", 0)
                .attr("y", 0)
                .attr("transform", function(d, i) {
                    return "translate(" + (-100) + "," + (-10) + ")";
                })


            // **********************
            // D3 Tip Tooltip for hover over info
            // ********************** 
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                    var format = d3.format(".3s")
                    return "<strong>" + d.name + ":</strong> " +
                        "<p><span style='color:red'>" + d.value + "</span>";
                });

            svg.call(tip);

            function resetHighlighting() {

                d3.selectAll('.gnode text')
                    .transition()
                    .duration(100)
                    .text(function(d) {
                        return trimName(d.name)
                    })
                    .style('font-size', function(d) {
                        return d.computedFontSize;
                    });
            }


            // **********************
            // Add the nodes as circles, with text
            // ********************** 
            var gnodes = svg.selectAll("gnode")
                .data(nodes)
                .enter()
                .append('g')
                .attr("class", function(d) {
                    return "gnode " + d.set;
                })
                .on('mouseover', function(d) {
                    resetHighlighting()

                    svg.selectAll(".gnode")
                        .sort(function(a, b) { // select the parent and sort the path's
                            if (a.name != d.name) return -1; // a is not the hovered element, send "a" to the back
                            else return 1; // a is the hovered element, bring "a" to the front
                        });

                    var currentFontSize = d3.select(this)
                        .selectAll('text')
                        .style('font-size');
                    currentFontSize = parseFloat(currentFontSize);
                    d3.select(this)
                        .selectAll('text')
                        .transition()
                        .duration(100)
                        .text(function(d) {
                            return d.name.replace(/\(.*?\)/, "");
                        })
                        .style('font-size', function() {
                            return "18px"
                        });
                })
                .on('mouseout', function() {
                    resetHighlighting();
                })
                .call(force.drag);



            var circle = gnodes.append("circle")
                .attr('fill-opacity', 0)
                .attr("r", 0)
                .attr("stroke-opacity", 0)
                .style("fill", function(d) {
                    return d.color;
                })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);

            circle.transition()
                .duration(2000)
                .attr("r", function(d) {
                    return d.radius;
                });


            var labels = gnodes.append("text")
                .attr('fill-opacity', 0)
                .text(function(d) {
                    return trimName(d.name);
                })
                .style("font-size", function(d) {
                    var computed = this.getComputedTextLength();
                    if (computed == 0) {
                        computed = trimName(d.name).length * 11
                    }
                    d.computedFontSize = Math.min(2 * d.radius, (2 * d.radius - 8) / computed * 24) + "px";
                    return Math.min(2 * d.radius, (2 * d.radius - 8) / computed * 24) + "px";
                })
                .attr("dy", ".35em");

            circle
                .attr('fill-opacity', 0.8)

            labels
                .transition()
                .duration(2000)
                .attr('fill-opacity', 1)


            function tick(e) {
                gnodes
                    .each(gravity(.2 * e.alpha))
                    .each(collide(.5))
                gnodes.attr("transform", function(d) {
                    return 'translate(' + [d.x, d.y] + ')';
                });
            }

            // Move nodes toward cluster focus.
            function gravity(alpha) {
                return function(d) {
                    d.y += (d.cy - d.y) * alpha;
                    d.x += (d.cx - d.x) * alpha;

                    d.x = Math.max((d.radius + 1), Math.min(width - d.radius, d.x));
                    d.y = Math.max((d.radius + 1), Math.min(height - d.radius, d.y));
                };
            }

            function collide(alpha) {
                var quadtree = d3.geom.quadtree(data);
                return function(d) {
                    var r = d.radius + maxRadius + padding,
                        nx1 = d.x - r,
                        nx2 = d.x + r,
                        ny1 = d.y - r,
                        ny2 = d.y + r;
                    quadtree.visit(function(quad, x1, y1, x2, y2) {
                        if (quad.point && (quad.point !== d)) {
                            var x = d.x - quad.point.x,
                                y = d.y - quad.point.y,
                                l = Math.sqrt(x * x + y * y),
                                r = d.radius + quad.point.radius + padding;
                            if (l < r) {
                                l = (l - r) / l * alpha;
                                d.x -= x *= l;
                                d.y -= y *= l;
                                quad.point.x += x;
                                quad.point.y += y;
                            }
                        }
                        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                    });
                };
            }

            resize()
            d3.select(window)
                .on("resize.chart", resize);

            // **********************
            // Update visualization width in response to changing window width
            // ********************** 
            function resize() {
                // update width
                width = window.innerWidth - margin * 2;
                width = Math.max(minWidth, width)
                if (!width) {
                    width = minWidth
                }
                xVenn.rangeBands([0, width]);
                nodes = d3.range(data.length)
                    .map(function(i) {


                        var node = data[i];
                        node.radius = radiusScale(trimName(data[i].name).length);
                        node.color = color(node.set);
                        node.cx = xVenn(node.set) + (width / 6);
                        node.cy = height / 2;
                        node.name = node.name;
                        return node;
                    });
                svg.attr("width", width);
                force.size([width, height])
                    .resume();

                vennLabels
                    .attr("transform", function(d, i) {
                        return "translate(" + (xVenn(i) + width / 6) + "," + 20 + ")";
                    });

                vennMatch
                    .attr("transform", function(d, i) {
                        return "translate(" + (xVenn(1) + width / 6) + "," + height + ")";
                    });
            }

        });

    };

    function trimName(fullName) {
        var trimmedName = fullName.replace(/\(.*?\)/, "");
        if (trimmedName.length > maxCharLength) {
            trimmedName = trimmedName.substr(0, maxCharLength - 3) + "..."
        }
        return trimmedName;
    }

    // **********************
    // Getter and setter methods
    // ********************** 
    chart.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return chart;
    };
    chart.setLabels = function(_) {
        if (!arguments.length) return setLabels;
        setLabels = _;
        return chart;
    };
    chart.colorRange = function(_) {
        if (!arguments.length) return colorRange;
        colorRange = _;
        return chart;
    };
    chart.maxCharLength = function(_) {
        if (!arguments.length) return maxCharLength;
        maxCharLength = _;
        return chart;
    };
    return chart;
}