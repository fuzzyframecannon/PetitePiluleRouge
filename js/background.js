var config;
var lastDomain = {};
var currentNotificationId = undefined;

// Fallback function that loads local json file
function storeConfig(c)
{
    // Save a copy in background
    config = c;
    // Store the json data, local or updated
    chrome.storage.sync.set({'config':c}, function() {
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
                    var c = JSON.parse(xhr.responseText);
                    storeConfig(c);
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
            else {
                // Need local copy
                config = data;
            }
        });
    }
    xhr.send();
}

function getDomainFromUrl(url)
{
    return (new URL(url).hostname.split('.').slice(-2).join('.'));
}

function getOwnerFromDomain(domain)
{
    if (config.hasOwnProperty(domain)) {
        return config[domain][1].join(', ');
    }
    return undefined;
}

function displayNotification(text ,time)
{
    chrome.notifications.create('Proprietaire', {type: 'basic', title: 'Petite Pilule Rouge', message: text, iconUrl:'images/red_pill.png', eventTime: time, isClickable: false}, function(id){
        currentNotificationId = id;
        timer = setTimeout(function(){chrome.notifications.clear(id);}, 2000);
    });
    return;
}

function tabCallback(tabId, url, active)
{
    if(!url.startsWith('chrome://')) {
        // Get the domain
        var domain  = new URL(url).hostname.split('.').slice(-2).join('.');
        if(!(tabId in lastDomain) || lastDomain[tabId][0] !== domain) {
            // Save URL as last URL and clear 'displayed' flag
            lastDomain[tabId] = [domain, undefined];
            // Get the owner
            owner = getOwnerFromDomain(getDomainFromUrl(url));
            // If the tab is currently active, display notification
            if(active && owner) {
                // Set the tooltip
                chrome.browserAction.setTitle({title: owner, tabId: tabId});
                displayNotification(owner, 2500);
                lastDomain[tabId][1] = true;
            }
            else {
                // Reset the tooltip
                chrome.browserAction.setTitle({title: 'Petite Pilule Rouge', tabId: tabId});
            }
        }
    }
}

// Add tab watchers
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if(changeInfo.status == 'loading' && changeInfo.url) {
        tabCallback(tabId, tab.url, tab.active);
    }
});
chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId){
    chrome.tabs.get(addedTabId, function(tab){
        tabCallback(tab.id, tab.url, tab.active);
    });
});
chrome.tabs.onActivated.addListener(function(activeInfo){
    // If we have a notification pending for this tab
    if(activeInfo.tabId in lastDomain && !lastDomain[activeInfo.tabId][1]) {
        displayNotification(getOwnerFromDomain(lastDomain[activeInfo.tabId][0]), 2500);
        lastDomain[activeInfo.tabId][1] = true;
    }
    // Otherwise clear current notification as it is for another tab
    else {
        if(currentNotificationId){
            chrome.notifications.clear(currentNotificationId);
        }
    }
});

// Add menus
chrome.contextMenus.removeAll();
chrome.contextMenus.create({
      title: "About",
      contexts: ["browser_action"],
      onclick: function() {
        alert('https://github.com/fuzzyframecannon/PetitePiluleRouge\nwww.monde-diplomatique.fr\nwww.acrimed.org');
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

