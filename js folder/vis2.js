// vis2.js

const margin = { top: 40, right: 80, bottom: 60, left: 80 };
const width  = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;


let barRaw, tlData, pieRaw, hmRaw, selectedMetric = null;

const jurisdictionSelect = document.getElementById("jurisdiction-select");
const yearSelect = document.getElementById("year-select");
const methodSelect = document.getElementById("method-select");

function initSVG(selector, customHeight = height) {
  d3.select(selector).select("svg").remove();
  return d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", customHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
}



// Overlay control
function showOverlay(id) {
  const ov = document.getElementById("overlay");
  const content = ov.querySelector(".overlay-content");
  content.innerHTML = "";
  // Clone the section
  const sec = document.getElementById("section-" + id);
  content.appendChild(sec.cloneNode(true));
  ov.classList.remove("hidden");
}
function closeOverlay() {
  document.getElementById("overlay").classList.add("hidden");
}


// Then replace your existing drawBar with this:

function drawBar(data) {
  barRaw = barRaw || data;
  const g = initSVG("#chart-bar");

  const jurisdictions = Array.from(new Set(data.map(d => d.jurisdiction)));
  const metricsAll = Array.from(new Set(data.map(d => d.metric)));
  const metrics = selectedMetric ? [selectedMetric] : metricsAll;

  const pivot = Array.from(
    d3.group(data, d => d.jurisdiction),
    ([jur, rows]) => {
      const obj = { jurisdiction: jur };
      metricsAll.forEach(m => {
        obj[m] = d3.sum(rows.filter(r => r.metric === m), r => r.fines);
      });
      return obj;
    }
  );

  const x = d3.scaleBand()
    .domain(jurisdictions)
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(pivot, d => d3.sum(metrics, k => d[k]))])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(metricsAll)
    .range(d3.schemeTableau10);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2).attr("y", 40)
    .text("Jurisdiction");

  g.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2).attr("y", -60)
    .text("Total Fines");

  const series = d3.stack().keys(metrics)(pivot);

  // Tooltip setup
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  g.selectAll("g.layer")
    .data(series)
    .join("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d.map(item => ({ ...item, key: d.key })))
    .join("rect")
    .attr("x", d => x(d.data.jurisdiction))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => y(d[0]) - y(d[1]))
    .on("mouseover", function(event, d) {
      // Highlight bar
      g.selectAll("rect").attr("opacity", 0.3);
      d3.selectAll(`rect[x="${x(d.data.jurisdiction)}"]`).attr("opacity", 1);

      const breakdown = barRaw.filter(r => r.jurisdiction === d.data.jurisdiction);
      let html = `<strong>${d.data.jurisdiction}</strong><br>`;
      breakdown.forEach(r => {
        html += `${r.metric}: ${d3.format(",")(r.fines)}<br>`;
      });

      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip.html(html)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      g.selectAll("rect").attr("opacity", 1);
      tooltip.transition().duration(400).style("opacity", 0);
    })
    .on("click", (event, d) => {
      const selected = d.data.jurisdiction;
      g.selectAll("rect")
        .transition().duration(300)
        .attr("opacity", b => b.data.jurisdiction === selected ? 1 : 0.3)
        .attr("transform", b => b.data.jurisdiction === selected ? "scale(1.05,1.05)" : "scale(1,1)");
    });

  g.append("rect")
    .attr("class", "legend-bg")
    .attr("x", width - 160)
    .attr("y", -margin.top + 20)
    .attr("width", 150)
    .attr("height", metricsAll.length * 20 + 10)
    .attr("fill", "rgba(255,255,255,0.8)");

  const legend = g.append("g")
    .attr("transform", `translate(${width - 150}, ${-margin.top + 25})`);

  legend.selectAll("g")
    .data(metricsAll)
    .join("g")
    .attr("class", d =>
      `legend-item${selectedMetric && selectedMetric !== d ? " inactive" : ""}`
    )
    .attr("transform", (d, i) => `translate(0,${i * 20})`)
    .style("cursor", "pointer")
    .on("click", (e, d) => {
      selectedMetric = selectedMetric === d ? null : d;
      drawBar(barRaw);
    })
    .call(g => {
      g.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d => color(d));

      g.append("text")
        .attr("x", 16)
        .attr("y", 10)
        .attr("font-size", "0.8rem")
        .text(d => d.replace(/_/g, " "));
    });
}


  

// 2. Dual-Line Timeline
function drawTimeline(data) {
  tlData = tlData || data;
  const g = initSVG("#chart-timeline");

  const years = data.map(d => d.year);
  const x = d3.scaleLinear().domain(d3.extent(years)).range([0, width]);
  const y = d3.scaleLinear()
              .domain([0, d3.max(data, d => Math.max(d.Camera, d.Police))])
              .nice()
              .range([height, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(years.length).tickFormat(d3.format("d")))
    .append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#000")
      .text("Year");

  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")))
    .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .text("Fines");

  // Line generators
  const lineCam = d3.line()
    .defined(d => d.Camera > 0)
    .x(d => x(d.year))
    .y(d => y(d.Camera))
    .curve(d3.curveMonotoneX);

  const linePol = d3.line()
    .defined(d => d.Police > 0)
    .x(d => x(d.year))
    .y(d => y(d.Police))
    .curve(d3.curveMonotoneX);

  // Draw lines
  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#f4a261")
    .attr("stroke-width", 2)
    .attr("d", lineCam);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2a9d8f")
    .attr("stroke-width", 2)
    .attr("d", linePol);

  // Tooltip setup (create only if doesn't exist)
  let tooltip = d3.select("body").select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "6px 10px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("opacity", 0);
  }

  // Draw points with tooltip
  g.append("g")
    .selectAll("circle")
    .data(data.flatMap(d => [
      { type: "Camera", year: d.year, value: d.Camera },
      { type: "Police", year: d.year, value: d.Police }
    ]).filter(d => d.value > 0))
    .join("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.value))
      .attr("r", 5)
      .attr("fill", d => d.type === "Camera" ? "#f4a261" : "#2a9d8f")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.2)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).transition().attr("r", 8);
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip.html(`<strong>${d.type}</strong><br>Year: ${d.year}<br>Fines: ${d3.format(",")(d.value)}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).transition().attr("r", 5);
        tooltip.transition().duration(300).style("opacity", 0);
      });

  // Highlight from dropdown (if applicable)
  const yearSel = document.getElementById("year-select-timeline");
  const selY = yearSel ? +yearSel.value : null;
  if (selY) {
    g.append("line")
      .attr("class", "highlight")
      .attr("x1", x(selY)).attr("x2", x(selY))
      .attr("y1", 0).attr("y2", height)
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 2");

    g.selectAll("circle")
      .filter(d => d.year === selY)
      .classed("highlight", true)
      .attr("r", 8);
  }
}


// 3. Pie Chart
function drawPie(data) {
  pieRaw = pieRaw || data;
  const g = initSVG("#chart-pie");
  const radius = Math.min(width, height) / 2;

  const pieG = g.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const pieGen = d3.pie()
    .value(d => d.fines)
    .sort((a, b) => a.age.localeCompare(b.age));

  const arcGen = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const labelArc = d3.arc()
    .innerRadius(radius * 0.5)
    .outerRadius(radius * 0.85);

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.age))
    .range(d3.schemeSet2);

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Draw slices
  const arcs = pieG.selectAll("path")
    .data(pieGen(data))
    .join("path")
    .attr("class", "arc")
    .attr("d", arcGen)
    .attr("fill", d => color(d.data.age))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget)
        .classed("arc-selected", true)
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`<strong>${d.data.age}</strong><br>Fines: ${d3.format(",")(d.data.fines)}`)
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY - 28) + "px");
    })
    .on("mouseout", (e, d) => {
      d3.select(e.currentTarget)
        .classed("arc-selected", false)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);

      tooltip.transition().duration(500).style("opacity", 0);
    })
    .on("click", (e, d) => {
      alert(`${d.data.age}: ${d3.format(",")(d.data.fines)} fines`);
    });

  // Add text labels to slices
  pieG.selectAll("text")
  .data(pieGen(data))
  .join("text")
  .filter(d => d.data.age !== "0-16") // Remove label only for 0-16
  .attr("transform", d => `translate(${labelArc.centroid(d)})`)
  .attr("text-anchor", "middle")
  .attr("alignment-baseline", "middle")
  .style("font-size", "0.7rem")
  .style("fill", "#333")
  .text(d => d.data.age);


  // Legend
  const legend = g.append("g")
    .attr("transform", `translate(${width - 100},20)`);
  data.forEach((d, i) => {
    const gg = legend.append("g").attr("transform", `translate(0,${i * 20})`);
    gg.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(d.age));
    gg.append("text").attr("x", 16).attr("y", 10).text(`${d.age} ages`).attr("font-size", "0.8rem");
  });
}


// 4. Heatmap
function drawHeatmap(data) {
  hmRaw = hmRaw || data;
  const g = initSVG("#chart-heatmap", height + 100); // ⬅️ add vertical room

  const jurisdictions = Array.from(new Set(data.map(d => d.jurisdiction)));
  const ageGroups = Array.from(new Set(data.map(d => d.age)));

  const x = d3.scaleBand().domain(ageGroups).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(jurisdictions).range([0, height]).padding(0.05);
  const color = d3.scaleSequential()
    .domain([0, d3.max(data, d => d.fines)])
    .interpolator(d3.interpolateBlues);

  // X Axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-0.5em")
    .attr("dy", "0.15em")
    .attr("transform", "rotate(-45)");

  // Y Axis
  g.append("g").call(d3.axisLeft(y));

  // Axis Labels
  g.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 60)
    .attr("text-anchor", "middle")
    .text("Age Group");

  g.append("text")
    .attr("class", "axis-label")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Jurisdiction");

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  g.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.age))
    .attr("y", d => y(d.jurisdiction))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.fines))
    .on("mouseover", function (event, d) {
      d3.select(this).classed("selected", true);
      tooltip.transition().duration(100).style("opacity", 1);
      tooltip.html(`<strong>${d.jurisdiction}, ${d.age}:</strong> ${d.fines} fines`)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).classed("selected", false);
      tooltip.transition().duration(200).style("opacity", 0);
    });

  // ✅ Add color legend (gradient bar)
  const defs = g.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", color.range()[0]);

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", color.range()[1]);

  const legendWidth = 200;
  const legendHeight = 10;
  const legendX = width / 2 - legendWidth / 2;
  const legendY = height + 80;

  g.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)")
    .attr("stroke", "#ccc");

  g.append("text")
    .attr("x", legendX)
    .attr("y", legendY + 20)
    .attr("text-anchor", "start")
    .style("font-size", "10px")
    .text("Low fines");

  g.append("text")
    .attr("x", legendX + legendWidth)
    .attr("y", legendY + 20)
    .attr("text-anchor", "end")
    .style("font-size", "10px")
    .text("High fines");
}



function drawChart1(data) {
  const grouped = d3.rollup(data, v => d3.sum(v, d => +d.FINES), d => d.YEAR, d => d.DETECTION_METHOD);
  const years = [...new Set(data.map(d => d.YEAR))].sort();
  const methods = [...new Set(data.map(d => d.DETECTION_METHOD))];

  const lines = methods.map(method => {
    return {
      name: method,
      values: years.map(year => ({ year, value: grouped.get(year)?.get(method) || 0 }))
    };
  });

  drawLineChart('#chart1', lines, 'Fines', 'YEAR');
}

function drawChart2(data) {
  const grouped = d3.rollup(data, v => d3.sum(v, d => +d.FINES), d => d.YEAR, d => d.JURISDICTION);
  const years = [...new Set(data.map(d => d.YEAR))].sort();
  const jurisdictions = [...new Set(data.map(d => d.JURISDICTION))];

  const lines = jurisdictions.map(jur => {
    return {
      name: jur,
      values: years.map(year => ({ year, value: grouped.get(year)?.get(jur) || 0 }))
    };
  });

  drawLineChart('#chart2', lines, 'Fines', 'YEAR');
}

function drawLineChart(container, lines, yLabel, xLabel) {
  const svg = d3.select(container).html('').append('svg').attr('width', 800).attr('height', 400);
  const margin = { top: 20, right: 100, bottom: 40, left: 60 }, width = 800 - margin.left - margin.right, height = 400 - margin.top - margin.bottom;
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scalePoint().domain(lines[0].values.map(d => d.year)).range([0, width]);
  const y = d3.scaleLinear().domain([0, d3.max(lines.flatMap(l => l.values), d => d.value)]).nice().range([height, 0]);

  const line = d3.line().x(d => x(d.year)).y(d => y(d.value));

  // Add axis labels
  g.append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 5)
    .style('text-anchor', 'middle')
    .text(xLabel);

  g.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 15)
    .style('text-anchor', 'middle')
    .text(yLabel);

  g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x));
  g.append('g').call(d3.axisLeft(y));

  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(lines.map(d => d.name));
  
  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Create legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);

  // Add interactive legend items
  lines.forEach((series, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`)
      .style('cursor', 'pointer')
      .on('click', function() {
        // Toggle visibility
        const active = series.active !== false;
        const newOpacity = active ? 0 : 1;
        
        // Hide or show the line
        d3.select(`.line-${i}`)
          .transition().duration(500)
          .style('opacity', newOpacity);
          
        // Hide or show the dots
        d3.selectAll(`.dot-${i}`)
          .transition().duration(500)
          .style('opacity', newOpacity);
          
        // Update active status
        series.active = !active;
        
        // Update legend item opacity
        d3.select(this).selectAll('text')
          .style('opacity', active ? 0.5 : 1);
      });

    legendRow.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', color(series.name));
      
    legendRow.append('text')
      .attr('x', 15)
      .attr('y', 10)
      .text(series.name);
  });

  // Add paths for each line series with animation
  lines.forEach((series, i) => {
    // Create line with transition
    g.append('path')
      .datum(series.values)
      .attr('class', `line-${i}`)
      .attr('fill', 'none')
      .attr('stroke', color(series.name))
      .attr('stroke-width', 2)
      .attr('d', line)
      .style('opacity', 1)
      .attr('stroke-dasharray', function() {
        const totalLength = this.getTotalLength();
        return `${totalLength} ${totalLength}`;
      })
      .attr('stroke-dashoffset', function() {
        return this.getTotalLength();
      })
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // Add interactive data points
    g.selectAll(`.dot-${i}`)
      .data(series.values)
      .enter().append('circle')
      .attr('class', `dot-${i}`)
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.value))
      .attr('r', 5)
      .attr('fill', color(series.name))
      .style('opacity', 0)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 8);
          
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
          
        tooltip.html(`${series.name}<br>${d.year}: ${d3.format(",.2f")(d.value)}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 5);
          
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      })
      .transition()
      .delay((d, i) => i * 150)
      .duration(500)
      .style('opacity', 1);
  });
}

function drawChart3(data) {
  const grouped = d3.rollup(data, v => d3.sum(v, d => +d.FINES), d => d.JURISDICTION);
  const barData = Array.from(grouped, ([jurisdiction, total]) => ({ 
    jurisdiction, 
    rate: total / 10000,
    isSelected: jurisdiction === jurisdictionSelect.value 
  }))
    .sort((a, b) => b.rate - a.rate); // Sort by rate descending

  const svg = d3.select('#chart3').html('').append('svg').attr('width', 800).attr('height', 400);
  const margin = { top: 20, right: 20, bottom: 30, left: 100 }, width = 800 - margin.left - margin.right, height = 400 - margin.top - margin.bottom;
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, d3.max(barData, d => d.rate)]).nice().range([0, width]);
  const y = d3.scaleBand().domain(barData.map(d => d.jurisdiction)).range([0, height]).padding(0.1);

  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  g.append('g').call(d3.axisLeft(y));
  g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x));

  // Add x-axis label
  g.append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 5)
    .style('text-anchor', 'middle')
    .text('Fines per 10,000 licenses');
  // Add bars with animations and interactivity
  g.selectAll('.bar')
    .data(barData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('y', d => y(d.jurisdiction))
    .attr('height', y.bandwidth())
    .attr('fill', d => d.isSelected ? '#ff7f0e' : '#4682b4')
    .attr('width', 0) // Start with width 0 for animation
    .attr('opacity', d => d.isSelected ? 1 : 0.7)
    .on('mouseover', function(event, d) {
      // Only highlight if not already selected
      if (!d.isSelected) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#ff7f0e')
          .attr('opacity', 0.9);
      }
        
      // Show tooltip
      tooltip.transition()
        .duration(200)
        .style('opacity', .9);
      
      tooltip.html(`<strong>${d.jurisdiction}</strong><br>Fines per 10k licenses: ${d3.format(",.2f")(d.rate)}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function(event, d) {
      // Only restore color if not selected
      if (!d.isSelected) {
        d3.select(this)
          .transition()
          .duration(500)
          .attr('fill', '#4682b4')
          .attr('opacity', 0.7);
      }
        
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    })
    .on('click', function(event, d) {
      // Update selection state for all bars
      barData.forEach(b => {
        b.isSelected = (b.jurisdiction === d.jurisdiction);
      });
      
      // Set the jurisdiction filter and update charts
      jurisdictionSelect.value = d.jurisdiction;
      updateCharts.calledFromBarClick = true;
      
      // Update all bars immediately
      g.selectAll('.bar')
        .transition()
        .duration(300)
        .attr('fill', b => b.isSelected ? '#ff7f0e' : '#4682b4')
        .attr('opacity', b => b.isSelected ? 1 : 0.7);
      
      updateCharts();
    })
    .transition() // Animate bars growing from left to right
    .duration(800)
    .delay((d, i) => i * 50)
    .attr('width', d => x(d.rate));
    
  // Add value labels at the end of each bar
  g.selectAll('.bar-label')
    .data(barData)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', d => x(d.rate) + 5)
    .attr('y', d => y(d.jurisdiction) + y.bandwidth() / 2 + 4)
    .style('font-size', '10px')
    .style('opacity', 0)
    .text(d => d3.format(",.2f")(d.rate))
    .transition()
    .duration(800)
    .delay((d, i) => i * 50 + 400)
    .style('opacity', 1);
}

// Add zoom capability for line charts
function enableChartZoom(container) {
  const svg = d3.select(`${container} svg`);
  svg.call(d3.zoom()
    .extent([[0, 0], [800, 400]])
    .scaleExtent([1, 5])
    .on('zoom', function(event) {
      svg.select('g').attr('transform', event.transform);
    }));
}

async function drawAustraliaMap(data, year) {
  const filteredData = year === 'All' ? data : data.filter(d => d.year === year);


  // Group by jurisdiction and calculate total fines
  const finesByJurisdiction = d3.rollup(
    filteredData, 
    v => d3.sum(v, d => +d.fines), 
    d => d.jurisdiction
  );

  console.log("Fines by jurisdiction:", finesByJurisdiction);

  const jurisdictionMap = {
    'NSW': '1',
    'VIC': '2',
    'QLD': '3',
    'SA':  '4',
    'WA':  '5',
    'TAS': '6',
    'NT':  '7',
    'ACT': '8'
  };

  const width = 800;
  const height = 500;

  d3.select('#map-chart').select('svg').remove();

  const svg = d3.select('#map-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const mapGroup = svg.append('g').attr('class', 'map-group');

  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', event => {
      mapGroup.attr('transform', event.transform);
      svg.selectAll('.reset-button, .legend-box, text.map-title')
        .attr('transform', `translate(0,0)`);
    });

  svg.call(zoom);

  
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  try {
    const australiaData = await d3.json("data folder/australia-states.json");

    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(Array.from(finesByJurisdiction.values()))])
      .interpolator(d3.interpolateBlues);

    const projection = d3.geoMercator()
      .center([134, -28])
      .scale(800)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    mapGroup.selectAll('.state')
      .data(australiaData.features)
      .enter()
      .append('path')
      .attr('class', 'state')
      .attr('d', path)
      .attr('fill', d => {
        const stateCode = d.properties.STATE_CODE;
        for (const [jurisdiction, value] of finesByJurisdiction.entries()) {
          if (jurisdictionMap[jurisdiction] === stateCode) {
            return colorScale(value);
          }
        }
        return '#ccc';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('fill-opacity', 1)
      .on('mouseover', function(event, d) {
        const stateName = Object.keys(jurisdictionMap).find(
          key => jurisdictionMap[key] === d.properties.STATE_CODE
        );
        const value = stateName ? finesByJurisdiction.get(stateName) || 0 : 0;

        d3.select(this).attr('stroke', '#333').attr('stroke-width', 2);

        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`<strong>${stateName}</strong><br>Total Fines: ${d3.format(",")(value)}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 0.5);
        tooltip.transition().duration(500).style('opacity', 0);
      })
      .on('click', function(event, d) {
        const stateName = Object.keys(jurisdictionMap).find(
          key => jurisdictionMap[key] === d.properties.STATE_CODE
        );

        if (stateName) {
          jurisdictionSelect.value = stateName;
          updateCharts.calledFromMapClick = true;
          updateCharts();

          mapGroup.selectAll('.state')
            .transition().duration(300)
            .attr('fill-opacity', 0.3);

          d3.select(this)
            .transition().duration(300)
            .attr('fill-opacity', 1)
            .attr('stroke', '#000')
            .attr('stroke-width', 2);

          if (!svg.select('.reset-button').size()) {
            svg.append('g')
              .attr('class', 'reset-button')
              .attr('transform', `translate(${width - 100}, 50)`)
              .style('cursor', 'pointer')
              .on('click', function() {
                event.stopPropagation();
                mapGroup.selectAll('.state')
                  .transition().duration(300)
                  .attr('fill-opacity', 1)
                  .attr('stroke', '#fff')
                  .attr('stroke-width', 0.5);
                svg.select('.reset-button').remove();
                svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);

                if (jurisdictionSelect.value !== 'All') {
                  jurisdictionSelect.value = 'All';
                  updateCharts();
                }
              })
              .append('rect')
              .attr('width', 80)
              .attr('height', 25)
              .attr('rx', 5)
              .attr('fill', '#f8f8f8')
              .attr('stroke', '#ccc');

            svg.select('.reset-button')
              .append('text')
              .attr('x', 40)
              .attr('y', 16)
              .attr('text-anchor', 'middle')
              .style('font-size', '12px')
              .text('Reset View');
          }

          const bounds = path.bounds(d);
          const dx = bounds[1][0] - bounds[0][0];
          const dy = bounds[1][1] - bounds[0][1];
          const x = (bounds[0][0] + bounds[1][0]) / 2;
          const y = (bounds[0][1] + bounds[1][1]) / 2;
          const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
          const translate = [width / 2 - scale * x, height / 2 - scale * y];

          svg.transition().duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        }
        document.getElementById("reset-map").addEventListener("click", () => {
          jurisdictionSelect.value = "All";
          updateCharts.calledFromMapClick = true;
          updateCharts();
        
          // Reset zoom and opacity
          const svg = d3.select("#map-chart svg");
          const mapGroup = svg.select(".map-group");
        
          mapGroup.selectAll(".state")
            .transition().duration(300)
            .attr("fill-opacity", 1)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5);
        
          svg.transition().duration(750).call(
            d3.zoom().transform,
            d3.zoomIdentity
          );
        
          // Remove reset button overlay if dynamically added before
          svg.select(".reset-button").remove();
        });
        
      });

      // ✅ Global reset button handler for map
const resetButton = document.getElementById("reset-map");
if (resetButton) {
  resetButton.onclick = () => {
    jurisdictionSelect.value = "All";
    updateCharts.calledFromMapClick = true;
    updateCharts();

    // Reset zoom & state styles
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);

    mapGroup.selectAll('.state')
      .transition().duration(300)
      .attr('fill-opacity', 1)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);

    // Remove internal map reset icon if it exists
    svg.select(".reset-button").remove();
  };
}


    // Legend
    const legendWidth = 200;
    const legendHeight = 15;
    const legendX = width - legendWidth - 20;
    const legendY = height - 50;

    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    const colorDomain = colorScale.domain();
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colorScale(colorDomain[0]));
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colorScale(colorDomain[1]));

    svg.append('rect')
      .attr('class', 'legend-box')
      .attr('x', legendX - 10)
      .attr('y', legendY - 20)
      .attr('width', legendWidth + 20)
      .attr('height', 60)
      .attr('rx', 5);

    svg.append('text')
      .attr('x', legendX + legendWidth / 2)
      .attr('y', legendY - 5)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .text('Total Fines');

    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    svg.append('text')
      .attr('x', legendX)
      .attr('y', legendY + legendHeight + 15)
      .style('text-anchor', 'start')
      .style('font-size', '10px')
      .text(d3.format(",.0f")(colorDomain[0]));

    svg.append('text')
      .attr('x', legendX + legendWidth)
      .attr('y', legendY + legendHeight + 15)
      .style('text-anchor', 'end')
      .style('font-size', '10px')
      .text(d3.format(",.0f")(colorDomain[1]));

  } catch (error) {
    console.error("Error loading or processing map data:", error);
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .style('text-anchor', 'middle')
      .style('fill', 'red')
      .text('Error loading map data.');
  }
}

function filterData() {
  return rawData.filter(d =>
    (jurisdictionSelect.value === "All" || d.jurisdiction === jurisdictionSelect.value) &&
    (yearSelect.value === "All" || d.year === yearSelect.value) &&
    (methodSelect.value === "All" || d.detection_method === methodSelect.value)
  );
}

// Update all charts based on filter selections
// Update all charts based on filter selections
const updateCharts = function () {
  const data = filterData();               // filters jurisdiction/method/year for other charts
  const selectedYear = yearSelect.value;

  // ✅ 1. Timeline chart (Police vs Camera): uses separate dataset
  const timelineFiltered = selectedYear === 'All'
    ? tlData
    : tlData.filter(d => d.year === +selectedYear);
  drawTimeline(timelineFiltered);         // ↪ no effect from map or jurisdiction filter

  // ✅ 2. Main charts (use filtered base data)
  drawBar(barRaw);                        // base dataset, unfiltered
  drawPie(pieRaw);                        // pie (2023 data)
  drawHeatmap(hmRaw);                     // heatmap fixed to 2023

  // ✅ 3. Map – only update if not triggered by map click
  if (!updateCharts.calledFromMapClick) {
    drawAustraliaMap(rawData, selectedYear);  // uses raw fines data by jurisdiction/year
  }

  // ✅ 4. Zoomable trend line charts (filtered by all selections)
  drawChart1(data);                       // method-based
  drawChart2(data);                       // jurisdiction-based
  enableChartZoom('#chart1');
  enableChartZoom('#chart2');

  // 🔁 Reset flags after update
  updateCharts.calledFromMapClick = false;
  updateCharts.calledFromBarClick = false;
};



function populateDropdown(selectEl, values) {
  selectEl.innerHTML = '<option value="All">All</option>';
  [...new Set(values)].sort().forEach(v => {
    selectEl.add(new Option(v, v));
  });
}
function setupEventListeners() {
  jurisdictionSelect.addEventListener('change', () => {
    updateCharts.calledFromMapClick = false;
    updateCharts();
  });
  yearSelect.addEventListener('change', () => {
    updateCharts.calledFromMapClick = false;
    updateCharts();
  });
  methodSelect.addEventListener('change', () => {
    updateCharts.calledFromMapClick = false;
    updateCharts();
  });
}

// 5. Load & initialize
Promise.all([
  d3.csv("data folder/annual_fines_by_metric.csv", d => ({
    jurisdiction: d.JURISDICTION,
    metric: d.METRIC,
    fines: +d["Sum(FINES)"]
  })),
  d3.csv("data folder/mobile_timeline_camera_police.csv", d => ({
    year: +d.YEAR,
    method: d.DETECTION_METHOD,
    fines: +d["Sum(FINES)"]
  })),
  d3.csv("data folder/agegroup_pie_2023.csv", d => ({
    age: d.AGE_GROUP,
    fines: +d["Sum(FINES)"]
  })),
  d3.csv("data folder/mobile_age_heatmap_2023.csv", d => ({
    jurisdiction: d.JURISDICTION,
    age: d.AGE_GROUP,
    fines: +d["Sum(FINES)"]
  })),
  d3.csv("data folder/cleaned_fines_data.csv", d => ({
    jurisdiction: d.JURISDICTION,
    detection_method: d.DETECTION_METHOD,
    fines: +d.FINES,
    year: d.YEAR.toString()
  }))
]).then(([barDataRaw, tlRaw, pieDataRaw, hmRawData, cleanedFines]) => {
  // Store global data
  barRaw = barDataRaw;
  pieRaw = pieDataRaw;
  hmRaw = hmRawData;
  rawData = cleanedFines;

  // --- Draw base charts ---
  drawBar(barRaw);
  drawPie(pieRaw);
  drawHeatmap(hmRaw);

  // --- Timeline setup ---
  tlData = Array.from(
    d3.group(tlRaw, d => d.year),
    ([year, rows]) => ({
      year,
      Camera: rows.find(r => r.method === "Camera")?.fines || 0,
      Police: rows.find(r => r.method.includes("Police"))?.fines || 0
    })
  ).sort((a, b) => a.year - b.year);
  drawTimeline(tlData);

  // --- Timeline filter ---
  // --- Timeline filter ---
const yearSel = document.getElementById("year-select-timeline");
if (yearSel) {
  tlData.forEach(d => yearSel.add(new Option(d.year, d.year)));

  yearSel.addEventListener("change", () => {
    const v = +yearSel.value;
    drawTimeline(v ? tlData.filter(d => d.year === v) : tlData);
  });

  const resetBtn = document.getElementById("reset-timeline");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      yearSel.value = "";
      drawTimeline(tlData);
    });
  }
} else {
  // No dropdown, just draw full timeline
  drawTimeline(tlData);
}


  // --- Reset Buttons ---
  document.getElementById("reset-bar").addEventListener("click", () => {
    selectedMetric = null;
    drawBar(barRaw);
  });
  document.getElementById("reset-pie").addEventListener("click", () => drawPie(pieRaw));
  document.getElementById("reset-heatmap").addEventListener("click", () => drawHeatmap(hmRaw));

  // --- View Data Overlay ---
  document.querySelectorAll(".view-data").forEach(btn => {
    btn.addEventListener("click", e => showOverlay(e.target.dataset.chart));
  });
  document.getElementById("close-overlay").addEventListener("click", closeOverlay);

  // --- Interactive Filter Dropdowns (for map and filter) ---
  const jurisdictionSelect = document.getElementById("jurisdiction-select");
  const yearSelect = document.getElementById("year-select");
  const methodSelect = document.getElementById("method-select");

  populateDropdown(jurisdictionSelect, cleanedFines.map(d => d.JURISDICTION));
  populateDropdown(yearSelect, cleanedFines.map(d => d.YEAR));
  populateDropdown(methodSelect, cleanedFines.map(d => d.DETECTION_METHOD));

  jurisdictionSelect.value = "All";
  yearSelect.value = "2023";
  methodSelect.value = "All";

  // --- Setup interaction flags ---
  updateCharts.calledFromMapClick = false;
  updateCharts.calledFromBarClick = false;

  // --- Setup event listeners for filters ---
  jurisdictionSelect.addEventListener("change", () => {
    updateCharts.calledFromMapClick = false;
    updateCharts();
  });
  yearSelect.addEventListener("change", () => {
    updateCharts.calledFromMapClick = false;
    updateCharts();
  });
  methodSelect.addEventListener("change", () => {
    updateCharts.calledFromMapClick = false;
    updateCharts();
  });

  // --- Final initial render for the map ---
  drawAustraliaMap(cleanedFines, "2023");
});

