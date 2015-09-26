$(document).on("change", ".btn-file :file", function() {
  var input = $(this),
      numFiles = input.get(0).files ? input.get(0).files.length : 1,
      label = input.val().replace(/\\/g, "/").replace(/.*\//, "");
  input.trigger("fileselect", [numFiles, label]);
});

$(document).ready( function() {
    $(".btn-file :file").on("fileselect", function(event, numFiles, label) {
        var input = $(this).parents(".input-group").find(":text");
        input.val(label);
    });

    $("#upload_button").addClass("disabled");
});

window.addEventListener("load", hookListeners);

function hookListeners () {
  if (window.File && window.FileReader) {
    document.getElementById("upload_button").addEventListener("click", startUpload);
    document.getElementById("file_input").addEventListener("change", function(event) {
      selectedFile = event.target.files[0];
      $("#upload_button").removeClass("disabled");
    });
  } else {
    document.getElementById("file_input").innerHTML = "No browser support.";
  }
}

var selectedFile;
var fileReader;
var socket = io.connect();
function startUpload () {
 
  fileReader = new FileReader();
  name = $("#file_input").val().split("\\").pop();

  fileReader.onload = function(event) {
    console.log(event.target.result);
    socket.emit("upload", {name: name, data: event.target.result});
  }

  updateBar(0);
  socket.emit("start", {name: name, size: selectedFile.size});
}

//var chunkSize = 524288; // 0.5 MB
var chunkSize = 4096; // 4 KB
//var chunkSize = 10; // 10 B

socket.on("moreData", function(data) {
  console.log(data);
  updateBar(data.percent);
  if (data.percent < 100) {
    var cursor = data.cursor;
    var newData = selectedFile.slice(cursor, cursor + Math.min(chunkSize, (selectedFile.size - cursor)));
    fileReader.readAsBinaryString(newData);
    } 
})

function updateBar(percent) {
  $('#upload_progress').css("width", percent+"%").attr("aria-valuenow", percent);
}
