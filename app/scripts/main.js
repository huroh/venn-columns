
    queue()
        .defer(d3.json, "data.json") //
        .await(drawChart); // function that uses files


    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>" + d.name + "</strong> <span style='color:red'>" + d.value + "</span>";
        })

    function drawChart(error, data) {
      console.log(data)
    // labels array should match set = 0, 1, 2 respectively
    vennColumns = BlinkersVennColumnsChart()
        .setLabels(["extra ingredients you have", "ingredients in common", "ingredients you need"])
        .data(data);

    d3.select("#chart")
        .call((vennColumns));

    }
