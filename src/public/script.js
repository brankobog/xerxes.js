$(document).on("change", ".btn-file :file", function() {
  var input = $(this),
      numFiles = input.get(0).files ? input.get(0).files.length : 1,
      label = input.val().replace(/\\/g, "/").replace(/.*\//, "");
  input.trigger("fileselect", [numFiles, label]);
});

$(document).ready( function() {
    $(".btn-file :file").on("fileselect", function(event, numFiles, label) {
        
        var input = $(this).parents(".input-group").find(":text"),
            log = numFiles > 1 ? numFiles + " files selected" : label;
        
        if( input.length ) {
            input.val(log);
        } else {
            if( log ) alert(log);
        }
        
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
    socket.emit("upload", {"name": name, data : event.target.result});
  }
  socket.emit("start", {"name": name, "size" : selectedFile.size});
}

var chunkSize = 524288; // 0.5 MB

socket.on("moreData", function(data) {
  updateBar(data["percent"]);
  var cursor = data["cursor"] * chunkSize;
  var newData = selectedFile.slice(cursor, cursor + Math.min(chunkSize, (selectedFile.size - cursor)));
  fileReader.readAsBinaryString(newData); 
})

function updateBar(percent) {
  $('#upload_progress').css('width', percent+'%').attr('aria-valuenow', percent);
}
