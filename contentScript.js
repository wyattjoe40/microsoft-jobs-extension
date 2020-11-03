console.log("Starting MicroHunt...")

function log(message) {
    console.log("MicroHunt: " + message);
}

var foundJobsList = false;

function performJobLinksSearch() {
    // check to see if the jobs list has been loaded
    if (!foundJobsList) {
        var jobsList = document.querySelector('[class="phs-jobs-list"]') 
        if (!jobsList) {
            return
        }

        log("Found job list")
        foundJobsList = true
    }

    const jobLinks = document.querySelectorAll('[class="job-title"]')
    log("Job Links: ");
    for (var i = 0; i < jobLinks.length; i++) {
        log(jobLinks[i].parentElement.getAttribute("href"))
        // TODO wydavis: Test calling the href's to get the contents...
    }
}

function performHintSentenceSearch() {
    const hintSentenceSpans = document.querySelectorAll('[data-test="hint-sentence"]');
    if (hintSentenceSpans.length == 0) {
        log("No hint sentence found.");
    } else if (hintSentenceSpans.length > 1) {
        log("Multiple hint sentences found.");
    } else { // length == 1
        // get the only hint sentence element
        // change the children to nothing
        log("Found one hint sentence.")
        var hintSentenceSpan = hintSentenceSpans[0];
        for (var i = 0; i < hintSentenceSpan.children.length; i++) {
            if (!hintSentenceSpan.children[i].classList.contains("powerlingo-hint-token")) {
                hintSentenceSpan.children[i].classList.add("powerlingo-hint-token");
            }
        }
        if (!hintSentenceSpan.classList.contains("powerlingo-hint-sentence")) {
            hintSentenceSpan.classList.add("powerlingo-hint-sentence");
        };
    }
}

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observer = new MutationObserver(function(mutations, observer) {
    /*
    log(mutations)
    mutations.forEach(function(mutation) {
        log(mutation.target.innerText);
        switch (mutation.type) {
            case "childList":
                log(mutation);
                break;
            default:
                log(mutation.type);
                break;
        }
    });
    */
    //console.log(mutations)
    // fired when a mutation occurs

    //performHintSentenceSearch();
    performJobLinksSearch();
    // ...
});

// define what element should be observed by the observer
// and what types of mutations trigger the callback
var jobsList = document.querySelector('[class="phs-jobs-list"]') 
log("JobsList: ")
log(jobsList)
observer.observe(document, {
  subtree: true,
  attributes: true
  //...
});