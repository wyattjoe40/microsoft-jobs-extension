debug("Starting MicroHunt...")

var isDebugLogsOn = true;
var isWarnLogsOn = true;

function debug(message) {
    if (isDebugLogsOn) console.log("MicroHunt: Debug: " + message);
}

function warn(message) {
    if (isWarnLogsOn) console.warn("MicroHunt: WARN: " + message);
}

// a list of job nodes. each job node contains a ton of dom nodes that make up the row of the job
var jobs;

function run(noJobsListCallback, noJobsFoundCallback, jobsFoundCallback) {
    var jobsList = document.querySelector('[class="phs-jobs-block"]') 
    if (!jobsList) {
        warn("Jobs list disappeared. Stopping MicroHunt");
        if (noJobsListCallback) noJobsListCallback();
        return;
    }
    var jobsFound = jobsList.querySelectorAll("li div.information-block")
    if (!jobsFound) {
        warn("No jobs found... This isn't expected, but let's wait to see if they show up later.");
        if (noJobsFoundCallback) noJobsFoundCallback();
        noJobsFoundCallback();
        return;
    }

    jobs = jobsFound;
    if (jobsFoundCallback) jobsFoundCallback();
    updateHTMLWithJobsList();
}

function jobListChanged(mutations, observer) {
    debug("Jobs list changed");
    function disconnect() {
        observer.disconnect()
    }

    run(disconnect, null, disconnect);
}

function updateHTMLWithJobsList() {
    jobs.forEach(job => {
        //var job = jobs[0] // comment out the foreach and uncomment this for easy one job debugging
        // debug(job)
        var jobLink = job.querySelector("a");
        if (!jobLink || !jobLink.href) {
            warn("No job link found...");
            return
        }

        fetch(jobLink.href).then(r => r.text()).then(result => {
            // Result now contains the response text, do what you want...

            // get the job description
            var fullDescription = getJobDescription(result);
            if (fullDescription) {
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

                var title = jobNode.targetStandardTitle
                var description = jobNode.description
                var qualifications = jobNode.jobQualifications
                var responsibilities = jobNode.jobResponsibilities
                var summary = jobNode.jobSummary

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
                var divWithJobInfo = document.createElement('div');
                divWithJobInfo.innerHTML = description;
                divWithJobInfo.className = "job-description-content"
                debug("divWithJobInfo description");
                debug(divWithJobInfo);
                descriptionNode.append(divWithJobInfo);

                // append the qualifications
                header = document.createElement("h2");
                header.innerText = "Qualifications"
                header.className = "job-description-header"
                descriptionNode.append(header);
                divWithJobInfo = document.createElement('div');
                divWithJobInfo.innerHTML = qualifications;
                divWithJobInfo.className = "job-description-content"
                debug("divWithJobInfo qualifications");
                debug(divWithJobInfo);
                descriptionNode.append(divWithJobInfo);
                removeNodesThatMatch(divWithJobInfo, ".//p[contains(., 'Microsoft is an') or contains(., 'Benefits/perks listed')]");
            }
        })
    });
}

function removeNodesThatMatch(node, searchString) {
    var paragraphsToDelete = document.evaluate(searchString, node, null, XPathResult.ANY_TYPE, null );
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
    var jobsList = document.querySelector('[class="phs-jobs-list"]') 

    if (jobsList) {
        debug("Found jobs list")
        observer.disconnect();
        observerFunction = jobListChanged;
        observer.observe(jobsList, {
            subtree: true,
            attributes: true
        });
    } else {
        debug("No jobs list found")
    }
}

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observerFunction = performJobLinksSearch;

var observer = new MutationObserver(function(mutations, observer) {
    observerFunction(mutations, observer);
});

var jobListObserver = new MutationObserver(function(mutations, observer) {
    debug("jobListObserver fired, mutations: ");
    mutations.forEach( mutation => {
        debug(mutation);
    })
});

// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
  subtree: true,
  childList: true
  //...
});