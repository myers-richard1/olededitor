//initialize the basics
applicationPath = window.location.protocol + window.location.pathname //used for redirecting after saves
const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
//get the saved data from the url, if any
if (urlParams.has("name"))
  document.getElementById("name").value = urlParams.get('name')
sizeX = 32
if (urlParams.has("sizeX"))
  sizeX = urlParams.get("sizeX")
sizeY = 32
if (urlParams.has("sizeY"))
  sizeY = urlParams.get("sizeY")
 
//initialize our editor/canvas state
var clicking = false
var erasing = false
var canvasSize = 600 //todo make this scale
var boxes = sizeX //todo make the axes independent
var boxData = []
//fill boxdata with 0s
for (var i = 0; i < (boxes * boxes); i++){
    boxData.push(0)
}

//overwrite the zeroes if image data was supplied in the urlparams
if (urlParams.has("data")){
  dataString = urlParams.get("data")
  for (var i = 0; i < dataString.length; i++){
    //get the encoded char, and convert it to an integer
    base32Char = dataString.charAt(i)
    numericalValue = parseInt(base32Char,32)
    //encode the integer into a binary string, and pad it with 0s
    binaryString = numericalValue.toString(2)
    binaryString = "00000".substring(binaryString.length) + binaryString
    //update the box data for these 5 pixels
    for (var j = 0; j < binaryString.length; j++){
      boxData[i*5+j] = parseInt(binaryString.charAt(j))
    }
  }
  document.getElementById("status").innerHTML = "Saved!"
}

//get reference to the canvas, the canvas context, and set up the box size
var canvas = document.getElementById("canvas")
var c = canvas.getContext("2d")
var boxSize = 600/boxes
//add our callbacks
document.addEventListener('mousedown', clickDown)
document.addEventListener('mouseup', clickUp)
canvas.addEventListener('mousemove', mouseMove)

//this function sets the draw/erase state and draws in the cells
function clickDown(e){
  //return if the user's clicking outside of the canvas
  if (e.target != canvas) return
  //set clicking to true if left mouse down, else set erasing to true if right mouse down (they get reset in clickUp)
  if (e.which === 1)
    clicking = true
  if (e.which === 3)
    erasing = true
  //calculate which cell we're in
  cellX = Math.floor(e.offsetX / boxSize)
  cellY = Math.floor(e.offsetY / boxSize)
  //call the fill function with our cell coords
  fill(cellX, cellY);
  return false
}

//this function resets the clicking and erasing state vars whenever the user releases the mouse button.
function clickUp(e){
    clicking = false
    erasing = false
}

//this function works just like the click function, except it's called whenever the user moves their mouse,
//and doesn't execute if we aren't clicking or erasing
function mouseMove(e){
  if (!(clicking || erasing)) return
  cellX = Math.floor(e.offsetX / boxSize)
  cellY = Math.floor(e.offsetY / boxSize)
  fill(cellX, cellY);
}

/*
Based on
https://stackoverflow.com/questions/13990128/how-to-fill-a-cell-on-clicking-the-grid-on-canvas-in-html5
*/
function drawBox() {
  c.beginPath();
  
  c.fillStyle = 'white'
  c.lineWidth = 3;
  c.strokeStyle = 'black'
  for (var row = 0; row < boxes; row++) {
    for (var column = 0; column < boxes; column++) {
      var x = column * boxSize
      var y = row * boxSize
      c.rect(x,y,boxSize, boxSize)
      c.fill()
      c.stroke()
    }
  }
  c.closePath()
  initGrid()
  document.getElementById("loadingLabel").style.display = 'none'
  document.getElementById("topBreak").style.display = 'none'
}

//this function allows the provided image data to overwrite the grid
function initGrid(){
  //loop through all the rows and columns
  for (var row = 0; row < boxes; row++){
    for (var column = 0; column < boxes; column++){
      //get the data for this cell
      data = boxData[(row * boxes + column)]
      //set the appropriate fill style, then fill and stroke
      c.fillStyle = (data === 0) ? "white" : "black"
      c.fillRect(column * boxSize,row * boxSize,boxSize, boxSize);
      c.stroke()
    }
  }
}

function fill(cellX, cellY) {
  //set the stroke style just in case i end up changing it somewhere else later
  c.strokeStyle = "black"
  //set the fill style based on whether the user is drawing or erasing
  if (clicking)
    c.fillStyle = "black";
  else if (erasing)
    c.fillStyle = "white"

  //update the numerical representation of the grid
  boxData[cellX + (cellY*boxes)] = clicking ? 1 : 0
  //update the visual representation of the grid
  c.fillRect(cellX * boxSize,cellY * boxSize,boxSize, boxSize);
  c.stroke()
  document.getElementById("status").innerHTML = "Not saved!"
}

//this function transforms the data to match the column encodingn of the lcd, 
//then embeds it into a C header file
function exportCode(){
  var filename = document.getElementById("name").value
  if (filename === ""){
    alert("You must enter a name for this image in order to generate the code, as the name of the arrays are derived from the name you supply.")
    return;
  }
  var hexOutput = []
  //loop through the columns
  for (var column = 0; column < sizeX; column++){
    //divide the rows up in to groups of 8
    for (var rowOffset = 0; rowOffset < sizeY/8; rowOffset++){
      //loop through the 8 rows, building a bit string
      bitString = ""
      for(var row = 0; row < 8; row++){
        var cellX = column
        var cellY = (8 * rowOffset) + row
        //prepend value to the bit string, since pixels are drawn bottom to top on the lcd
        bitString += boxData[(cellY * sizeX) + cellX].toString()
      }
      //convert the bit string to a number
      var numericalValue = parseInt(bitString, 2)
      //convert the number to a hex string
      var hexString = numericalValue.toString(16);
      //pad just for aesthetics
      if (hexString.length < 2) hexString = "0" + hexString
      //add hex literal code
      hexString = "0x" + hexString
      hexOutput.push(hexString)
    }
  } 
  //create the array
  var headerText = "static const char PROGMEM " + filename + "[" + (sizeX * sizeY / 8).toString() + "]={"
  //populate the array
  for (var i = 0; i < hexOutput.length; i++){
    headerText += hexOutput[i] + ","
  }
  //close the array
  headerText += "};"
  //commence download
  download(filename + ".h", headerText);
}

//this function encodes the grid data into base32, puts the data in the url, 
//then redirects the user to the page with the updated url
function exportUrl(){
  binaryString = ""
  //loop through each row and column, putting the bits into the string
  for (var row = 0; row < boxes; row++){
    for (var column = 0; column < boxes; column++){
      binaryString += boxData[(row * boxes) + column].toString()
    }
  }
  finalBase32String = ""
  //loop through the bitstring
  for (var i = 0; i < binaryString.length;){
    //loop through 5 characters (since we're in base 32 and each digit is 5 bits)
    bitStringForConversion = ""
    for (var j = 0; j<5; j++){
      //if we still have bits to grab
      if (i < binaryString.length){
        //append to our current bitstring
        bitStringForConversion += binaryString.charAt(i++)
      }
      //else if we've reached the end of the grid, append zeros
      else{
      bitStringForConversion += "0"
      }
    }
    console.log("Converting " + bitStringForConversion + " to a number")
    //convert these 5 bits into a number
    base10Representation = parseInt(bitStringForConversion, 2)
    console.log("That number is " + base10Representation)
    //convert that number into a hexatridecimal string
    base32Representation = base10Representation.toString(32)
    console.log("Converted to base 32, it's " + base32Representation)
    //append the data to our htdRepresentation
    finalBase32String += base32Representation
  }
  //create a url template that we can insert our data into
  parameterTemplate = "?name=nameValue&sizeX=sizeXValue&sizeY=sizeYValue&data=dataValue"
  //insert the data
  parameterString = parameterTemplate.replace("dataValue", finalBase32String)
  parameterString = parameterString.replace("nameValue", document.getElementById("name").value)
  parameterString = parameterString.replace("sizeXValue", sizeX)
  parameterString = parameterString.replace("sizeYValue", sizeY)
  document.getElementById("status").innerHTML = "Saving..."
  //redirect the user
  setTimeout(function () {redirect(applicationPath + parameterString)}, 1)
}

function redirect(url){
  window.location = url
}

//from https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

drawBox();