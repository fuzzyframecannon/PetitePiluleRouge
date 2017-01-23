// Fallback function that loads local json file
function storeConfig(config)
{
    // Store the json data, local or updated
    chrome.storage.sync.set({'config':config}, function() {
        if (chrome.runtime.lastError) {
            alert('LMDCHROMIUM: Failed to store config')
        }
    });
}

// Attempt GET on updated json
function loadConfig(verbose=false)
{
    var xhr = new XMLHttpRequest();
    xhr.open('GET', updateURL, true);
    xhr.onreadystatechange = function() {
        if(xhr.readyState==XMLHttpRequest.DONE) {
            if(xhr.status==200) {
                try {
                    var config = JSON.parse(xhr.responseText);
                    storeConfig(config);
                    if (verbose) {
                        alert('Update from URL successful');
                    }
                    return;
                }
                catch(err) {
                    if (verbose) {
                        alert('Config from URL invalid');
                    }
                }
            }
        }
        else {
            // Request not completed
            return;
        }
        // Failed to update from URL
        if (verbose) {
            alert('Failed to update from ' + updateURL + ', loading local config');
        }
        // Check if current storage contains a more recent config
        chrome.storage.sync.get('config', function(data) {
            // if error or no data or empty json object
            if (chrome.runtime.lastError || !data || Object.getOwnPropertyNames(data).length==0) {
                storeConfig(localBackup);
            }
        });
    }
    xhr.send();
}

// Add menus
chrome.contextMenus.removeAll();
chrome.contextMenus.create({
      title: "About",
      contexts: ["browser_action"],
      onclick: function() {
        alert('www.monde-diplomatique.fr\nwww.acrimed.org');
      }
});
chrome.contextMenus.create({
      title: "Update Config",
      contexts: ["browser_action"],
      onclick: function() {
        loadConfig(true);
      }
});

// Initial config load
loadConfig(false);

