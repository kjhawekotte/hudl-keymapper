function resize_popup_height(size) {
    $('#hotbod').height(size);
    $('html').height($('#hotbod').height())
}

function display_remote_status() {
    chrome.storage.local.get('remote_conn', function (res) {
        if (!$('#remote_cb').prop("checked")) {
            $('#remote_cb_text').html(' Use a Hudl USB remote.');
        } else if (res.remote_conn) {
            var tmp_txt = $('#remote_cb_text').html() + ' (Remote found)';
            $('#remote_cb_text').html(tmp_txt);
        } else {
            var tmp_txt = $('#remote_cb_text').html() + ' (Remote not found)';
            $('#remote_cb_text').html(tmp_txt);
        }
    })
}

function get_remote_options() {
    var input_list = $('input:text'),
        option_arr = [];
    for (var i = 0; i < input_list.length; i++) {
        if (typeof input_list[i + 1] != "undefined" && input_list[i + 1].id.indexOf("_t2") != -1) {
            //option_arr.push("<option value=\"" + input_list[i].getAttribute('data-btn') + " (Team 1)\">" + input_list[i].getAttribute('data-btn') + "</option>")
            //option_arr.push("<option value=\"" + input_list[i+1].getAttribute('data-btn') + "(Team 2)\">" + input_list[i+1].getAttribute('data-btn') + "</option>")

            option_arr.push([input_list[i].getAttribute('data-btn') + " (Team 1)", input_list[i].getAttribute('id')]);
            option_arr.push([input_list[i + 1].getAttribute('data-btn') + " (Team 2)", input_list[i + 1].getAttribute('id')]);

            i++;
        } else {
            //option_arr.push("<option value=\"" + input_list[i].getAttribute('data-btn') + "\">" + input_list[i].getAttribute('data-btn') + "</option>")

            option_arr.push([input_list[i].getAttribute('data-btn'), input_list[i].getAttribute('data-btn')]);
        }
    }

    return option_arr
}

function set_up_selects() {
    var option_arr = get_remote_options();
    // Loop over all inputs
    $('.selectable').each(function (ind, obj) {
        for (var i = 0; i < option_arr.length; i++) {
            $(obj).append($("<option></option>")
                .attr("value", option_arr[i][1])
                .text(option_arr[i][0]));
        }
    });
    // Set a couple of wanted defaults
    // TODO: Load from a store or set default
    chrome.storage.local.get('rm_keys', function(response) {
        if (typeof response.rm_keys == 'undefined')
        {
            $('#tag_rm').val("2fga_t1");
            $('#prev_rm').val("offrebound_t1");
            $('#rev_rm').val("Undo");
            $('#next_rm').val("defrebound_t2");

        } else {
            console.log('turdz')
        }
    })
}

$(document).ready(function () {
    // This makes sure that we are for sure on a post game breakdown hudl page
    // by grabbing the storage value that is set by the background script to tell us
    // if the current page is hudl or nah
    chrome.storage.local.get('is_hudl', function (result) {
        var is_hudl = result.is_hudl;
        if (!is_hudl) {
            $('#nope').show();
            $('div').each(function (i, obj) {
                if (obj.id != 'nope') {
                    $('#' + obj.id).hide()
                }
            });
            resize_popup_height(75);
        }
    });

    // Populate the remote drop downs
    set_up_selects();

    // Check to see if we have a value stored for remote capabilities and either
    // check the box or get the value from the checkbox
    chrome.storage.local.get('have_remote', function (result) {
        if (result.have_remote == true || result.have_remote == false) {
            $('#remote_cb').prop('checked', result.have_remote);
            if (result.have_remote) {
                $('#remote_div').show();
                resize_popup_height(700);
                display_remote_status();
            } else {
                $('#remote_div').hide();
                resize_popup_height(500);
                display_remote_status();
            }
        } else { // includes case where typeof result.have_remote == "undefined"
            chrome.storage.local.set({'have_remote': false}, function () {
            });
            $('#remote_cb').prop('checked', false);
            $('#remote_div').hide();
            resize_popup_height(500);
            display_remote_status();
        }
    });

    // What to do when the remote checkbox button is clicked
    $('#remote_cb').change(function () {
        chrome.storage.local.set({'have_remote': this.checked}, function () {
        });
        if (this.checked) {
            $('#remote_div').show();
            resize_popup_height(700);
            display_remote_status();
        } else {
            $('#remote_div').hide();
            display_remote_status();
        }
    });

    // Always select all text in fields
    $("input:text").focus(function () {
        $(this).select();
    });
    $(document).on('click', 'input[type=text]', function () {
        this.select();
    });

    // Get all key inputs and set the proper variables
    // TODO: Add ability for arrow keys and other special keys
    // Grab from storage or read from the keys.store file if nothing stored yet
    // Then set the keys...
    // chrome.storage.local.remove('keys'); // <-- used to flush chrome of keys storage -- DEBUG ONLY
    chrome.storage.local.get('keys', function (result) {
        var keys_info = result.keys;
        if (typeof keys_info == 'undefined') {
            console.log('Keys not found in storage. Using defaults.');
            keys_info = get_keys();
        }
        set_keys(keys_info);
        chrome.storage.local.set({'keys': keys_info}, function () {
        });
    });

    // Time to check to see what button the user pressed and update the input area
    $('input').keyup(function () {
        $(this).select(); // Select the entire textbox
        var txt = convert_to_txt(); // Get all available keys (in txt format)
        // Convert text format back into list format
        var key_list = txt.split('\n');
        for (var i = 0; i < key_list.length; i++) {
            key_list[i] = key_list[i].split(',');
        }
        // Send message to `injector_updater` to refresh keymappings
        chrome.storage.local.set({'keys': key_list}, function () {
        }); // Sets the storage values for the keys
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {keys: "refresh"}, function (response) {
                if (response.msg != "complete") {
                    console.log('For some reason our inline injection failed. Sawry.');
                    $('#main-heading').animate({color: '#cc0000'}, 500);
                    $('#main-heading').animate({color: '#000000'}, 1000);
                } else {
                    console.log('Injections updated.');
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
        //if (keys_info[i][1] != keys_info[i][2]) {
        $("#" + keys_info[i][0] + "_t1").val(keys_info[i][1]);
        $("#" + keys_info[i][0] + "_t2").val(keys_info[i][2]);
        //} else {
        //    $("#" + keys_info[i][0]).val(keys_info[i][1]);
        //}
    }
}

// Convert the values of the key inputs from the extension popup into txt format
function convert_to_txt() {
    var input_list = $('input:text');
    var txt = '';
    for (var i = 0; i < input_list.length; i++) {
        txt += input_list[i].id.split('_')[0] + "," + $('#' + input_list[i].id).val();
        if (typeof input_list[i + 1] != "undefined" && input_list[i + 1].id.indexOf('_t2') != -1) {
            i++;
            txt += "," + $('#' + input_list[i].id).val() + "," + input_list[i].getAttribute("data-btn") + "\n";
        } else {
            txt += "," + $('#' + input_list[i].id).val() + "," + input_list[i].getAttribute("data-btn") + "\n";
        }
    }
    return txt
}

// Gets the default keys.store from the accessible resources for the extension
function get_keys() {
    var oRequest = new XMLHttpRequest();
    oRequest.open("GET", chrome.extension.getURL('') + "keys.store", false);
    oRequest.setRequestHeader("User-Agent", navigator.userAgent);
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