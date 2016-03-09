$(document).ready(function() {
    //,
    //"usb",
    //{
    //  "usbDevices": [
    //    {
    //      "vendorId": 1027,
    //      "productId": 24597
    //    }
    //  ]
    //}
    //function onDeviceFound(devices) {
    //  this.devices=devices;
    //  if (devices) {
    //    if (devices.length > 0) {
    //      console.log("Device(s) found: "+devices.length);
    //    } else {
    //      console.log("Device could not be found");
    //    }
    //  } else {
    //    console.log("Permission denied.");
    //  }
    //}
    //
    //chrome.usb.getDevices({"vendorId": vendorId, "productId": productId}, onDeviceFound);

    // ^^ All of that is test code

    // This makes sure that we are for sure on a post game breakdown hudl page
    // by grabbing the storage value that is set by the background script to tell us
    // if the current page is hudl or nah
     chrome.storage.local.get('is_hudl', function(result) {
         var is_hudl = result.is_hudl;
         if (!is_hudl) {
             $('#nope').show();
             $('div').each(function (i, obj) {
                 if (obj.id != 'nope') {
                     $('#' + obj.id).hide()
                 }
             });
             //$('#hotbod').height(75);//("auto")
         }
     });

    // Always select all text in fields
    $("input:text").focus(function() { $(this).select(); } );
    $(document).on('click','input[type=text]',function(){ this.select(); });

    // Get all key inputs and set the proper variables
    // TODO: Add ability for arrow keys and other special keys
    // Grab from storage or read from the keys.store file if nothing stored yet
    // Then set the keys
    chrome.storage.local.get('keys', function(result) {
        var keys_info = result.keys;
        if (typeof keys_info == 'undefined') {
            console.log('undef here');
            keys_info = get_keys();
        }
        set_keys(keys_info);
        chrome.storage.local.set({'keys': keys_info}, function() {})
    });

    // Time to check to see what button the user pressed and update the input area
    $('input').keyup(function() {
        $(this).select(); // Select the entire textbox
        var txt = convert_to_txt(); // Get all available keys (in txt format)
        // Convert text format back into list format
        var key_list = txt.split('\n');
        for (var i = 0; i < key_list.length; i++) {
            key_list[i] = key_list[i].split(',');
        }
        // Send message to `injector_updater` to refresh keymappings
        chrome.storage.local.set({'keys': key_list}, function() {}); // Sets the storage values for the keys
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {keys: "refresh"}, function(response) {
              if (response.msg != "complete") {
                  console.log('For some reason our inline injection failed. Sawry.');
                  $('#main-heading').animate({color: '#cc0000'}, 500);
                  $('#main-heading').animate({color: '#000000'}, 1000);
              } else {
                  console.log(response.msg);
                  $('#main-heading').animate({color: "#00cc00"}, 500);
                  $("#main-heading").animate({color: "#000000"}, 1000);
              }
          });
        });
    })
});

// Sets the values of the keys in the input areas within the extension popup
function set_keys(keys_info) {
    for (var i = 0; i < keys_info.length; i++) {
        // id (need to append '_t1' and '_t2'), team 1 key, team 2 key
        if (keys_info[i][1] != keys_info[i][2]) {
            $("#" + keys_info[i][0] + "_t1").val(keys_info[i][1]);
            $("#" + keys_info[i][0] + "_t2").val(keys_info[i][2]);
        } else {
            $("#" + keys_info[i][0]).val(keys_info[i][1]);
        }
    }
}

// Convert the values of the key inputs from the extension popup into txt format
function convert_to_txt() {
    var input_list = $('input');
    var txt = '';
    for (var i=0; i < input_list.length; i++) {
        txt += input_list[i].id.split('_')[0] + "," + input_list[i].value;
        if (input_list[i].id.indexOf('_t') != -1) {
            i++;
            txt += "," + input_list[i].value + "," + input_list[i].getAttribute("data-btn") + "\n";
        } else {
            txt += "," + input_list[i].value + "," + input_list[i].getAttribute("data-btn") + "\n";
        }
    }
    return txt
}

// Gets the default keys.store from the accessible resources for the extension
function get_keys() {
    var oRequest = new XMLHttpRequest();
    oRequest.open("GET", "chrome-extension://ahbkiikoclmfblcohfpnjpjgkggefbdk/keys.store", false);
    oRequest.setRequestHeader("User-Agent",navigator.userAgent);
    oRequest.send(null);

    var key_list;
    if (oRequest.status==200) {
        key_list = oRequest.responseText.split('\n');
        for (var i = 0; i < key_list.length; i++) {
            key_list[i] = key_list[i].split(',');
        }
    }
    else {
        key_list = -1;
        alert("Error grabbing stored keys!");
    }
    return key_list
}