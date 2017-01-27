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
    // Process all elements
    var elements = document.getElementsByTagName('*');
    for (var i=0; i<elements.length; i++) {
        var element = elements[i];
        for (var j=0; j<element.childNodes.length; j++) {
            var node = element.childNodes[j];
            // Only perform substitution if the node has not been processed already
            if (node.nodeType===Node.TEXT_NODE &&
            textNodes.find(n => node.isSameNode(n))===undefined) {
                var text = node.nodeValue;
                var replacedText = replaceText(text, config);
                if (replacedText !== text) {
                    // Perform the subsitution
                    newNode = document.createTextNode(replacedText);
                    element.replaceChild(newNode, node);
                    // Add modified node to list
                    textNodes.push(newNode);
                }
            }
        }
    }
    return;
}

window.addEventListener('load', function load(event){
    window.removeEventListener('load', load, false); //remove listener, no longer needed
    GetConfigAndRun(ReplaceAll);
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
    }
});
