var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var async = require('async');

var q = async.queue(function(task, callback) {
	console.log(task.url)
    request(task.url, function(error, response, body) {
        // Check status code (200 is HTTP OK)
        if(!response){
        	callback();
            return;
        }
        console.log("Status code: " + response.statusCode);
        if (response.statusCode !== 200) {
            Crawlwer.crawl();
            callback();
            return;
        }
        // Parse the document body
        var $ = cheerio.load(body);
        Crawlwer.collectInternalLinks($, Crawlwer.crawl);
        callback();
    });

});

var Crawlwer = {
    START_URL: "https://samplesite.com",// your link for starting point
    MAX_PAGES_TO_VISIT: 10,
    pagesVisited: {},
    numPagesVisited: 0,
    pagesToVisit: []
};
Crawlwer.url= new URL(Crawlwer.START_URL);
Crawlwer.baseUrl= Crawlwer.url.protocol + "//" + Crawlwer.url.hostname;
Crawlwer.pagesToVisit.push(Crawlwer.START_URL);

Crawlwer.crawl = function() {
    // if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
    //   console.log("Reached max limit of number of pages to visit.");
    //   return;
    // }
    var nextPage = Crawlwer.pagesToVisit.pop();
    if(!nextPage){
    	return;
    }
    console.log(Crawlwer.pagesVisited[nextPage],"pagesVisited");
    if (Crawlwer.pagesVisited[nextPage]) {
        // We've already visited this page, so repeat the crawl
        Crawlwer.crawl();
    } else {
        // New page we haven't visited
        Crawlwer.visitPage(nextPage, Crawlwer.crawl);
    }
}

Crawlwer.visitPage = function(url, callback) {
    // Add page to our set
    Crawlwer.pagesVisited[url] = true;
    Crawlwer.numPagesVisited++;

    // Make the request
    console.log("Visiting page " + url);
    q.push({ url: url })
}


Crawlwer.collectInternalLinks=function($,callback) {
    var relativeLinks = $("a[href]");
    relativeLinks.each(function() {
    	//console.log($(this).attr('href'))
    	if($(this).attr('href').indexOf(Crawlwer.url.hostname)>0){
    		Crawlwer.pagesToVisit.push($(this).attr('href'));
    	}
    });
    callback();
}

// assign a callback
q.drain = function() {
    console.log( "END",Crawlwer.pagesVisited);
}

// add some items to the queue

q.concurrency = 5;
Crawlwer.crawl();
