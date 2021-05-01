var num = "1101"
var encoded = parseInt(num, 2)
var hex = encoded.toString(16)

//get the saved data from the url, if any
const queryString = window.location.search
console.log(queryString)
const urlParams = new URLSearchParams(queryString)
fileName = ""
if (urlParams.has("name"))
  fileName = urlParams.get("name")
sizeX = 16
if (urlParams.has("sizeX"))
  sizeX = urlParams.get("sizeX")
sizeY = 16
if (urlParams.has("sizeY"))
  sizeY = urlParams.get(sizeY)

applicationPath = window.location.protocol + window.location.pathname

var clicking = false
var erasing = false

var canvasSize = 600
var boxes = 16
var boxData = []
for (var i = 0; i < (boxes * boxes); i++){
    boxData.push(0)
}

if (urlParams.has("data")){
  alert("data found")
  dataString = urlParams.get("data")
  for (var i = 0; i < dataString.length; i++){
    base32Char = dataString.charAt(i)
    numericalValue = parseInt(base32Char,32)
    binaryString = numericalValue.toString(2)
    console.log("binaryString is " + binaryString)
    for (var j = 0; j < binaryString.length; j++){
      console.log("Setting " + (i*5+j) + " to "+ parseInt(binaryString.charAt(j)))
      boxData[i*5+j] = parseInt(binaryString.charAt(j))
    }
  }
  alert(boxData)
}

var canvas = document.getElementById("canvas"),
    c = canvas.getContext("2d"),
    boxSize = 600/boxes
document.addEventListener('mousedown', clickDown)
document.addEventListener('mouseup', clickUp)
canvas.addEventListener('mousemove', fill)

function clickDown(e){
  if (e.target != canvas) return
    if (e.which === 1)
        clicking = true
    if (e.which === 3)
        erasing = true
    fill(e);
    return false
}

function clickUp(e){
    clicking = false
    erasing = false
}

function drawBox() {
  c.beginPath();
  
  c.lineWidth = 3;
  c.strokeStyle = 'black';
  for (var row = 0; row < boxes; row++) {
    for (var column = 0; column < boxes; column++) {
      var x = column * boxSize;
      var y = row * boxSize; 
      c.fillStyle = (boxData[(row * boxes) + column] == 0) ? "white" : "black";
      c.rect(x, y, boxSize, boxSize);
      c.fill();
      c.stroke();
    }
  }
  c.closePath();
}

function fill(e) {
  if (!(clicking || erasing)) return
    c.strokeStyle = "black"
  if (clicking)
    c.fillStyle = "black";
  else if (erasing)
  c.fillStyle = "white"
  x = Math.floor(e.offsetX / boxSize)
  y = Math.floor(e.offsetY / boxSize)

  boxData[x + (y*boxes)] = clicking ? 1 : 0
  c.fillRect(x * boxSize,y * boxSize,boxSize, boxSize);
  c.stroke()
}

function exportCode(){
  alert(boxData)
}

function exportUrl(){
  binaryString = ""
  alert(boxData)
  for (var row = 0; row < boxes; row++){
    for (var column = 0; column < boxes; column++){
      binaryString += boxData[(row * boxes) + column].toString()
    }
  }
  alert(binaryString)
  finalBase32String = ""
  //loop through the string, backwards
  for (var i = binaryString.length; i >=0; i--){
    //loop through 5 characters
    bitStringForConversion = ""
    for (var j = 0; j<5; j++){
      //if we still have bits to grab
      if (i >= 0){
        //prepend to our current bitstring
        bitStringForConversion = binaryString.charAt(i--) + bitStringForConversion
      }
    }
    console.log("Converting " + bitStringForConversion + " to a number")
    //convert these 5 bits into a number
    base10Representation = parseInt(bitStringForConversion, 2)
    console.log("That number is " + base10Representation)
    //convert that number into a hexatridecimal string
    base32Representation = base10Representation.toString(32)
    console.log("Converted to base 32, it's " + base32Representation)
    //prepend the data to our htdRepresentation
    finalBase32String = base32Representation + finalBase32String
  }
  parameterTemplate = "?name=nameValue&sizeX=sizeXValue&sizeY=sizeYValue&data=dataValue"
  parameterString = parameterTemplate.replace("dataValue", finalBase32String)
  window.location = applicationPath + parameterString
}

drawBox();