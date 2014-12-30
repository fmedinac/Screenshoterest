var defaultText = "Nice website: ";

$(document).ready(function(){
    function loadOptions() {
        var statusText = localStorage["statusText"];

        if(!statusText){
            statusText = defaultText;
        }

        var input = document.getElementById("statusText");
        input.value = statusText;
    }
    loadOptions();

    $("#saveBtn").click(function () {
        var input = document.getElementById("statusText");
        localStorage["statusText"] = input.value;
        alert("Saved");
    });

    $("#eraseBtn").click(function () {
        localStorage.removeItem("statusText");
        location.reload();
        alert("Erased");
    });
});