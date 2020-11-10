debug("Starting Microsoft Jobs extension...")

var isDebugLogsOn = false;
var isWarnLogsOn = true;
chrome.storage.sync.get({
    debugLogs: false
}, function(items) {
    isDebugLogsOn = items.debugLogs
});

function debug(message) {
    if (isDebugLogsOn) console.log(message);
}

function warn(message) {
    if (isWarnLogsOn) console.warn(message);
}

// a list of job nodes. each job node contains a ton of dom nodes that make up the row of the job
var jobs;

function run(noJobsListCallback, noJobsFoundCallback, jobsFoundCallback) {
    debug("Running the main logic...")

    var jobsList = document.querySelector('[class="phs-jobs-block"]') 
    if (!jobsList) {
        if (noJobsListCallback) noJobsListCallback();
        return;
    }
    var jobsFound = jobsList.querySelectorAll("li div.information-block")
    if (!jobsFound) {
        if (noJobsFoundCallback) noJobsFoundCallback();
        return;
    }

    jobs = jobsFound;
    updateHTMLWithJobsList();
}

function jobListChanged(mutations, observer) {
    debug("Jobs list changed");

    function noJobsListCallback() {
        warn("Jobs list disappeared. Stopping extension");
        observer.disconnect()
    }

    function noJobsCallback() {
        warn("No jobs found... This isn't expected, stop the extension.");
        observer.disconnect()
    }

    run(noJobsListCallback, noJobsCallback);
}

function updateHTMLWithJobsList() {
    jobs.forEach(job => {
        debug("Updating HTML for job: ");
        debug(job);

        var jobLink = job.querySelector("a");
        if (!jobLink || !jobLink.href) {
            warn("No job link found...");
            return
        }

        debug("Fetching for link: " + jobLink.href)
        fetch(jobLink.href).then(r => {debug("got response for url: " + jobLink.href + ", status code: " + r.status); return r.text();}).then(result => {
            // Result now contains the response text
            debug("Updating for link: " + jobLink.href)
            // get the job description
            var fullDescription = getJobDescription(result);
            if (!fullDescription) {
                warn("No description found for job");
                return;
            }

            var json = JSON.parse(fullDescription)
            if (!json) {
                warn("Job description wasn't correct JSON")
                return;
            }

            var jobNode = json.jobDetail.data.job;
            if (!jobNode) {
                warn("No job node found in the JSON.")
                return
            }

            // other fields on jobNode that we could use in the future:
            //      targetStandardTitle
            //      jobResponsibilities
            //      jobSummary
            var description = jobNode.description
            var qualifications = jobNode.jobQualifications

            // find the description node and remove its contents. The default description
            // is not valuable; it is short and vague 
            var descriptionNode = job.querySelector(".description");
            if (!descriptionNode) {
                warn("Could not find description node for job");
                return;
            }

            while (descriptionNode.lastChild) {
                descriptionNode.removeChild(descriptionNode.lastChild);
            }

            // append the description
            var header = document.createElement("h2");
            header.innerText = "Description"
            header.className = "job-description-header"
            descriptionNode.append(header);
            var newDivForDescription = document.createElement('div');
            newDivForDescription.innerHTML = description;
            newDivForDescription.className = "job-description-content"
            debug("divWithJobInfo description");
            debug(newDivForDescription);
            descriptionNode.append(newDivForDescription);

            // append the qualifications
            header = document.createElement("h2");
            header.innerText = "Qualifications"
            header.className = "job-description-header"
            descriptionNode.append(header);
            newDivForQualifications = document.createElement('div');
            newDivForQualifications.innerHTML = qualifications;
            newDivForQualifications.className = "job-description-content"
            debug("divWithJobInfo qualifications");
            debug(newDivForQualifications);
            descriptionNode.append(newDivForQualifications);
            // some job postings have paragraphs containing MSFT legal boiler plate in the qualifications description, so remove it if so
            removeNodesThatMatch(newDivForQualifications, ".//p[contains(., 'Microsoft is an') or contains(., 'Benefits/perks listed')]");
        })
    });
}

function removeNodesThatMatch(node, searchString) {
    var paragraphsToDelete = document.evaluate(searchString, node, null, XPathResult.ANY_TYPE, null);
    var paragraphToDelete = paragraphsToDelete.iterateNext();
    var list = []
    // don't edit them while iterating, otherwise we get an error
    while(paragraphToDelete) {
        list.push(paragraphToDelete);
        paragraphToDelete = paragraphsToDelete.iterateNext();
    }
    list.forEach(p => {
        debug("Setting the inner html to empty for paragraph: ")
        debug(p)
        p.innerHTML = ""
    })
}

function getJobDescription(response) {
    var startIndex = response.indexOf('{"siteConfig":')
    if (startIndex == -1) {
        warn("Could not find start of job description")
        return
    }
    var endIndex = response.indexOf(',"flashParams":{}}');
    if (endIndex == -1) {
        warn("Could not find end of job description")
        return
    }

    if (endIndex < startIndex) {
        warn("endIndex is less than startIndex");
        return;
    }

    return response.substring(startIndex, endIndex) + "}"
}

function performJobLinksSearch() {
    debug("Document changed");
    var jobsList = document.querySelector('[class="phs-jobs-list"] ul') 
    if (jobsList) {
        debug("Found jobs list")
        debug(jobsList);

        var jobItems = jobsList.querySelectorAll("li");
        debug("jobItems: ");
        debug(jobItems);

        // This hooks up an observer so we can run our core code whenever the jobs list changes in the future
        observer.disconnect();
        observerFunction = jobListChanged;
        observer.observe(jobsList, {
            childList: true
        });

        // Run our core code now since we found a jobs list
        run();
    } else {
        debug("No jobs list found")
    }
}

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observerFunction = performJobLinksSearch;

var observer = new MutationObserver(function(mutations, observer) {
    observerFunction(mutations, observer);
});

// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
  subtree: true,
  childList: true
  //...
});