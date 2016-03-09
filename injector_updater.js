// Time to check to see what button the user pressed and click the appropriate tag
$(document).on('keypress', function(e) {
    // Get the keys either from storage or from the default keys.store file
    chrome.storage.local.get('keys', function(result) {
        var keys_info = result.keys;
        if (typeof keys_info == 'undefined') {
            console.log('undef here');
            keys_info = get_keys();
        }
        var keys = keys_info;
        // Loop through the keys and see if any contain the exact key we pressed
        // (Ex: [tip,a,b,Won Top] contains [a] but not [c]
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].indexOf(String.fromCharCode(e.which)) != -1) {
                var action = keys[i];
                // Make sure that we are on basketball pgb just to be sure
                var url = window.location.href;
                if (url.indexOf('basketball') != -1 && url.indexOf('pgb') != -1) {
                    // Look up all classes and see if any of the buttons match our wanted button to be pressed
                    // If so, click it...
                    var index = action.indexOf(String.fromCharCode(e.which));
                    var lookup_class;
                    if (action[3] == 'Undo') {
                        lookup_class = '.Undo-Button';
                    } else if (action[3] == 'End') {
                        lookup_class = '.Header-PeriodContainer';
                    } else if (action[3] == 'Options') {
                        lookup_class = '.Header-OptionsContainer';
                    } else if (action[3] == 'Official Timeout' || action[3] == 'Jump Ball') {
                        lookup_class = '.Footer-Tag';
                    } else if (index == 1) {
                        lookup_class = '.Tag-TeamOne'
                    } else if (index == 2) {
                        lookup_class = '.Tag-TeamTwo'
                    }
                    $(lookup_class).each(function (k, obj) {
                        if (obj.children[0].innerHTML.indexOf(action[3]) != -1) {
                            obj.children[0].click();
                            return false
                        }
                    });

                }
            }
        }
    })
});

// Gets the default keys.store from the accessible resources for the extension
function get_keys() {
    var oRequest = new XMLHttpRequest();
    oRequest.open("GET", chrome.extension.getURL('') + "keys.store", false);
    //oRequest.setRequestHeader("User-Agent",navigator.userAgent);
    oRequest.send(null);

    var key_list;
    if (oRequest.status == 200) {
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

// Listens for a message from the extension popup to tell us if a keymapping has changed
// and if so, update the inline text
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.keys == "refresh") {
            inline_inject(null);
            sendResponse({msg: "complete"});
        }
    }
);

// Every time react decides it wants to update the DOM nodes, check to see if we need new inline injection
document.addEventListener("DOMNodeInserted", function(e) {
  inline_inject(e.target);
}, false);

// Actually update the text of the buttons
function inline_inject(node) {
    // Make sure we on basketball pgb, yo
    if (window.location.href.indexOf('basketball') != -1 && window.location.href.indexOf('pgb') != -1) {
        // Get our key mappings, son
        chrome.storage.local.get('keys', function(result) {
            var keys_info = result.keys;
            if (typeof keys_info == 'undefined') {
                keys_info = get_keys();
            }
            var keys = keys_info;
            // See if any of our keys match the buttons on the screen and if so, inject our key maps
            for (var i = 0; i < keys.length; i++) {
                $('.Tag-TeamOne').each(function (k, obj) {
                    replace_text(keys[i], obj, 1);
                });
                $('.Tag-TeamTwo').each(function (k, obj) {
                    replace_text(keys[i], obj, 2);
                });
                $('.Undo-Button').each(function (k, obj) {
                    replace_text(keys[i], obj, 1);
                });
                $('.Header-PeriodContainer').each(function (k, obj) {
                    replace_text(keys[i], obj, 1);
                });
                $('.Header-OptionsContainer').each(function (k, obj) {
                    replace_text(keys[i], obj, 1);
                });
                $('.Footer-Tag').each(function (k, obj) {
                    replace_text(keys[i], obj, 1);
                });
            }
        })
    }
}

// Updates the button text to append (<KEY>) after it
function replace_text(key, obj, team) {
    for (var k=0; k < obj.children.length; k++) {
        if (obj.children[k].innerHTML.indexOf(key[3]) != -1 && obj.children[k].innerHTML.indexOf("(" + key[team] + ")") == -1) {
        //if (obj.children[k].innerHTML.split(' (')[0] == key[3] || (obj.children[k].innerHTML.split(' (')[0].indexOf("Quarter") && key[3] == "End")) {
            //console.log(obj.children[k].innerHTML + " (" + key[team] + ")");
            obj.children[k].innerHTML = obj.children[k].innerHTML.split(" (")[0] + " (" + key[team] + ")";
        }
    }
}