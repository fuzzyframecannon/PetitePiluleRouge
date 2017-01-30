// The config contains the substitions map
var config = null;
var textNodes = [];

function GetConfigAndRun(callback)
{
    if (!config) {
        // Need to get the config from storage
        chrome.storage.sync.get('config', function(data) {
            if (!chrome.runtime.error) {
                if (data) {
                    config = data['config'];
                    callback(config);
                }
            }
            else {
                alert('LMDCHROMIUM: Failed to load config');
            }
        });
    }
    else {
        // Already got it
        callback(config);
    }
    return;
}

var nfc = '[^a-zA-Z0-9àâäèéêëîïôœùûüÿçÀÂÄÈÉÊËÎÏÔŒÙÛÜŸÇ]'; // spaces or punctuation only
function replaceText(text, config)
{
    var regex = undefined;
    var newText = text;
    for (var key in config) {
        if (config.hasOwnProperty(key)) {
            try {
                regex = new RegExp('(^|'+nfc+')('+key+')'+'(?:$|'+nfc+')', 'g');
            }
            catch(err) {
                // Skip bad regex
                console.log('[Petite Pilule Rouge] Bad regex skipped: "' + key + '"');
                continue;
            }
            newText = newText.replace(regex, '$1$2 ['+config[key].join(', ')+']');
        }
    }
    return newText;
}

function ReplaceAll(config)
{
    var node;
    var walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    // Process all text nodes
    while(node = walker.nextNode()) {
        // Only perform substitutions if the node has not been processed already
        if(textNodes.find(n => node.isSameNode(n))===undefined) {
            var text = node.nodeValue;
            var replacedText = replaceText(text, config);
            if (replacedText !== text) {
                // Perform the subsitution
                node.nodeValue = replacedText;
                // Add modified node to list
                textNodes.push(node);
            }
        }
    }
    return;
}

document.addEventListener('DOMContentLoaded', function load(event){
    GetConfigAndRun(ReplaceAll);
    document.removeEventListener('DOMContentLoaded', load, false); //remove listener, no longer needed
}, false);

var timeout = null;
document.addEventListener('DOMSubtreeModified', function() {
    if(timeout) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(function(){GetConfigAndRun(ReplaceAll);}, 500);
}, false);

chrome.storage.onChanged.addListener(function(changes, areaName){
    if(areaName === 'sync') {
        config = changes['config'].newValue;
        GetConfigAndRun(ReplaceAll);
    }
});
