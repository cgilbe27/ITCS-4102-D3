var n = 100,
    time = 0,
    slow = false,
    array = d3.shuffle(d3.range(n)),
    swaps = quicksort(array.slice()).reverse(),
    elements = array.map(function(d, i) { return {value: d, index0: null, index1: i}; });

var color = d3.scale.cubehelix()
    .domain([0, n / 2, n - 1])
    .range([d3.hsl(-40, 1, .4), d3.hsl(60, 1, 1), d3.hsl(160, 1, .4)]);

var margin = {top: 20, right: 20, bottom: 20, left: 20},
    rowHeight = 20,
    strokeWidth = 6,
    width = 960 - margin.left - margin.right,
    height = (swaps.length + .5) * rowHeight;

var x = d3.scale.ordinal()
    .domain(d3.range(n))
    .rangePoints([0, width]);

var y = d3.scale.linear()
    .domain([0, 1])
    .range([0, rowHeight]);

var canvas = d3.select("body").append("canvas")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

d3.select(window)
    .on("keydown", keydown)
    .on("keyup", keydown);

var context = canvas.node().getContext("2d");
context.lineWidth = 6;
context.lineCap = "round";
context.lineJoin = "round";

context.translate(margin.left, margin.top);

(function next() {
  var time0 = time,
      time1 = ++time;

  d3.transition()
      .ease("linear")
      .duration(slow ? 2500 : 250)
      .each("start", function() {
        context.save();
        context.beginPath();
        context.moveTo(-strokeWidth, time0 ? y(time0) : -strokeWidth);
        context.lineTo(width + strokeWidth, time0 ? y(time0) : -strokeWidth);
        context.lineTo(width + strokeWidth, y(time1) + strokeWidth);
        context.lineTo(-strokeWidth, y(time1) + strokeWidth);
        context.closePath();
        context.clip();
      })
      .tween("path", function() {
        var swap = swaps.pop(), i = swap[0], j = swap[1], t;
        t = elements[i], elements[i] = elements[j], elements[j] = t;
        elements.forEach(function(d, i) { d.index0 = d.index1; d.index1 = i; });
        return function(t) {
          context.clearRect(-strokeWidth, -strokeWidth, width + strokeWidth * 2, height + strokeWidth * 2);
          elements.forEach(function(d) { if (d.index0 === d.index1) drawPath(d.value, d.index0, d.index1, time0, time1, t); });
          drawPath(elements[j].value, i, j, time0, time1, t);
          drawPath(elements[i].value, j, i, time0, time1, t);
        };
      }).each("end", function() {
        context.restore();
        if (swaps.length) next();
      });
})();

function drawPath(v, i0, i1, t0, t1, t) {
  context.beginPath();
  context.moveTo(x(i0), y(t0));
  if (i0 === i1 || t < 1 / 3) {
    context.lineTo(x(i0), y(t0) + (y(t1) - y(t0)) * Math.max(t, 1e-4));
  } else {
    context.lineTo(x(i0), y(t0) + (y(t1) - y(t0)) / 3);
    if (t < 2 / 3) {
      context.lineTo(x(i0) + (x(i1) - x(i0)) * (t - 1 / 3) * 3, y(t0) + (y(t1) - y(t0)) * t);
    } else {
      context.lineTo(x(i1), y(t0) + (y(t1) - y(t0)) * 2 / 3);
      context.lineTo(x(i1), y(t0) + (y(t1) - y(t0)) * t);
    }
  }
  context.lineWidth = strokeWidth + 2;
  context.strokeStyle = "#000";
  context.stroke();
  context.lineWidth = strokeWidth;
  context.strokeStyle = color(v);
  context.stroke();
}

function keydown() {
  slow = d3.event.altKey;
}

function quicksort(array) {
  var swaps = [];

  function partition(left, right, pivot) {
    var v = array[pivot];
    swap(pivot, --right);
    for (var i = left; i < right; ++i) if (array[i] <= v) swap(i, left++);
    swap(left, right);
    return left;
  }

  function swap(i, j) {
    if (i === j) return;
    var t = array[i];
    array[i] = array[j];
    array[j] = t;
    swaps.push([i, j]);
  }

  function recurse(left, right) {
    if (left < right - 1) {
      var pivot = partition(left, right, (left + right) >> 1);
      recurse(left, pivot);
      recurse(pivot + 1, right);
    }
  }

  recurse(0, array.length);
  return swaps;
}

d3.select(self.frameElement).style("height", height + margin.top + margin.bottom + "px");