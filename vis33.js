const margin = {top: 10, right: 200, bottom: 120, left: 100}
const margin2 = {top: 820, right: 200, bottom: 20, left: 100}
const width = 1500 - margin.left - margin.right
const height = 900 - margin.top - margin.bottom
const height2 = 900 - margin2.top - margin2.bottom
const parseDate = d3.timeParse("%Y")

const x = d3.scaleTime().range([0, width])
const x2 = d3.scaleTime().range([0, width])
const y = d3.scaleLinear().range([height, 0])
const y2 = d3.scaleLinear().range([height2, 0])
 
const xAxis = d3.axisBottom(x)
const xAxis2 = d3.axisBottom(x2)
const yAxis = d3.axisLeft(y)

const brushed = () => {
    const selection = d3.event.selection;
    x.domain(selection.map(x2.invert));

    console.log(d3.event.selection.map(x2.invert)[1].getFullYear())

    focus
    .selectAll("path.line")
    .attr("d",  (d) => line(d.values))
    focus.select(".x-axis").call(xAxis);
  }

const brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("end", brushed);

const line = d3.line()
    .curve(d3.curveCardinal)
    .x((d) => x(d.date) )
    .y((d) => y(d.rate) );
 
const line2 = d3.line()
    .curve(d3.curveCardinal)
    .x((d) => x2(d.date) )
    .y((d) => y2(d.rate) );


// Adding title to HTML page
d3.select("#titlePlaceholder1").insert("h1").text("USA states by robbery rates per 100 000 inhabitants");

const canvas = d3.select("#plotPlaceholder1").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);


// Y Axis title
canvas.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left/3)
    .attr("x", -1*(height/4) )
    .text("Robbery rate per 100 000 inhabitants")


// X Axis title
canvas.append("text")
  .attr("text-anchor", "end")
  .attr("x", width/1.75)
  .attr("y", height + 47)
  .text("Year");


canvas.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

const focus = canvas.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      
const context = canvas.append("g")
  .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");


const mouseoverHandler = function(id, data) {
    const selection = d3.select(id)

    // console.log(selection.data()) 
    
    selection
    .attr('class','line clicked')


    const textAdd = selection.data()[0].name
    const textX = width + margin.right

    
    const yearOrder = {}
    const years =  Object.keys(data[0]).splice(0, (Object.keys(data[0]).length - 1))
    years.forEach((e, i) => { yearOrder[e] = i } )


    // console.log(yearOrder)
    // console.log(selection.data()[0].values[yearOrder[x.domain()[1].getFullYear()]].rate)
    // console.log(yearOrder[x.domain()[1].getFullYear()])

    const textY = y(selection.data()[0].values[yearOrder[x.domain()[1].getFullYear()]].rate) + margin.top

    // console.log(textX)
    // console.log(textY)
    // console.log(textAdd)

    canvas.append("text")
    .attr("class", "mylabel")
    .attr("text-anchor", "middle")
    .attr("y", textY)
    .attr("x", textX + margin.left/4)
    // .attr("id", `label_${id}`) I dont know why its writes over the line id-s
    .text(textAdd)

    // console.log(`label_${id}`)
}


const mouseoutHandler = function(id) {

    const selection = d3.select(id)

    selection
    .attr('class','line')

    d3.selectAll(".mylabel").remove()

}
 

// 

d3.csv("usaRobery.csv")
  .then(data => {

    const returnArray = []

    let firstPass = true;
    
    data.forEach((el) => {
    
    
        const values =  Object.values(el).splice(0, (Object.values(el).length - 1)).map(d => d)
        const stateName = Object.values(el).splice((Object.keys(el).length)-1,Object.keys(el).length) 
    
    
        if (firstPass) {
            const years =  Object.keys(el).splice(0, (Object.keys(el).length - 1))
            years.forEach(e => { returnArray.push({date: e})} )
            firstPass = false;
        }
        
        values.forEach((e,i) => { returnArray[i][stateName] = e })    
    
        })

    

    const states = d3.keys(returnArray[0]).filter((key)  => key !== "date" );
   
    returnArray.forEach(function(d) {
        d.date = parseDate(d.date);
      });

   
    
    const lineKeys = states.map((name)  => {
        return {
          name: name,
          values: returnArray.map(function(d) {
            return {date: d.date, rate: +d[name]};
          })
        };
      });

    


      console.log(returnArray)
      console.log(lineKeys)

   
      x.domain(d3.extent(returnArray, (d) => { return d.date; }));
      y.domain([d3.min(lineKeys, (c) => { return d3.min(c.values, (v) => v.rate ); }),
                d3.max(lineKeys, (c) => { return d3.max(c.values, (v) => v.rate ); }) ]);
      x2.domain(x.domain());
      y2.domain(y.domain());
      
      const focuslineGroups = focus.selectAll("g")
        .data(lineKeys)
        .enter().append("g");
        
      const focuslines = focuslineGroups.append("path")
          .attr("class","line")
          .attr("d", function(d) { return line(d.values); })
          .attr("clip-path", "url(#clip)")
          .attr("id", (d, i) => `line_${i}`)
          .on("mouseover", (d, i) => mouseoverHandler(`#line_${i}`, data))
          .on("mouseout", (d, i) => mouseoutHandler(`#line_${i}`))
          ;
      
      focus.append("g")
          .attr("class", "axis x-axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);
   
      focus.append("g")
          .attr("class", "axis y-axis")
          .call(yAxis);
          
      const contextlineGroups = context.selectAll("g")
        .data(lineKeys)
        .enter().append("g");
      
      const contextLines = contextlineGroups.append("path")
          .attr("class", "line context")
          .attr("d", function(d) { return line2(d.values); })
          .attr("clip-path", "url(#clip)");
   
      context.append("g")
          .attr("class", "axis x-axis")
          .attr("transform", "translate(0," + height2 + ")")
          .call(xAxis2);
   
      context.append("g")
          .attr("class", "x brush")
          .call(brush)
          .call(brush.move, x.range())

  })

  .catch(error => {
    console.log(error); 
 })






