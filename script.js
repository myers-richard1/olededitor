var num = "1101"
var encoded = parseInt(num, 2)
var hex = encoded.toString(16)

var clicking = false
var erasing = false

var canvasSize = 600
var boxes = 16
var canvas = document.getElementById("canvas"),
    c = canvas.getContext("2d"),
    boxSize = 600/32
document.addEventListener('mousedown', clickDown);
document.addEventListener('mouseup', clickUp);
canvas.addEventListener('mousemove', fill)


function clickDown(e){
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
  c.fillStyle = "white";
  c.lineWidth = 3;
  c.strokeStyle = 'black';
  for (var row = 0; row < 32; row++) {
    for (var column = 0; column < 32; column++) {
      var x = column * boxSize;
      var y = row * boxSize;
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

  c.fillRect(Math.floor(e.offsetX / boxSize) * boxSize,
    Math.floor(e.offsetY / boxSize) * boxSize,
    boxSize, boxSize);
    c.stroke()
}

function exportCode(){

}

drawBox();