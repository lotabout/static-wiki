var all_files = []
var file_contents = {};
var cached_files = {};

//=============================================================================
// Routing

// add simple router, which handles hash URL
function load_url(url, callback) {
    var match = url.match(/#(.*)$/);
    fragment = match ? match[1] : url;

    history.pushState(null, null, '#' + fragment);
    callback(fragment);
}

function load_markdown(file) {
    history.pushState(null, null, '#' + file);
    handle_markdown(file)
}

window.onpopstate = function(e) {
    var hash = location.hash.slice(1);
    handle_markdown(hash);
};

// load markdown file and intercept the link
function handle_markdown(file) {
    fetch_file(file, function(data) {
        var content = marked(data);

        // set the content
        $('#content').html(content);
        //intercept_content_link();
    });
}

// fetch markdown content, with cache
function fetch_markdown(filename, callback) {
    if (file_contents[filename]) {
        callback(file_contents[filename]);
    } else {
        $.get(filename, function(data) {
            file_contents[filename] = data;
            callback(data);
        });
    }
}

// fetch markdown content, with cache
function fetch_file(file, callback) {
    if (cached_files[file]) {
        callback(cached_files[file]);
    } else {
        fetch_markdown(file, function(content) {
            var processed = marked(content);
            cached_files[file] = processed;
            callback(processed);
        });
    }
}

// initial loading, redirect to #index.md
var url = window.location.href;
if (!url.endsWith('.md')) {
    url += '#index.md';
}

load_url(url, handle_markdown);

function intercept_content_link() {
    // intercept all link clicks
    $('#content a').click(function(event) {
        var link = $(this).attr('href');
        if (link.endsWith('.md')) {
            event.preventDefault();
            console.log('processing', link);
            load_markdown(link, handle_markdown);
        }
    });
}

//=============================================================================
// Searching


// load all files
$.get('all.txt', function(data) {
    all_files = data.trim().split('\n');
    $('#log').html(data);
}).then(function() {
    // now we have the files, we want to retrieve all the contents of theme
    $(all_files).each(function(i, e) {
        // for each file, fetch its content
        $.get(e, function(data) {
            // save the data
            file_contents[e] = data.trim();
        });
    });
});


// add listener for search input box
var $input = $('#search-input');
var $searchResult = $('#search-result');
$input.on('input', function(e){
    var ret='<ul class=\"search-result-list\">';
    var keywords = this.value.trim().toLowerCase().split(/\s+/);

    $searchResult.html('');

    // no keywords, skip
    if (this.value.trim().length <= 0) {
        return;
    }

    // perform local searching
    $.each(file_contents, function(file, content) {
        var is_match = false;
        var match_index = -1;
        var first_occur = -1;

        if (content === '') {
            is_match = false;
        } else {
            for (var i = 0, len = keywords.length; i < len; i++) {
                var key = keywords[i];
                var match_title = file.indexOf(key);
                match_index = content.indexOf(key);
                if (match_title >= 0 || match_index >= 0) {
                    is_match = true;
                    break;
                }
            }

            // show search content
            if (is_match) {
                ret += '<li>';
                ret += "<a href='#" + file + "' class='search-result-title'>" + file + "</a>";

                // cut 100 characters
                var start = first_occur - 20;
                start = start < 0 ? 0 : start;
                var end = start + 100;
                end = end > content.length ? content.length : end;
                var match_content = content.substr(start, end);

                // highlight all keywords
                $.each(keywords, function(i, key){
                    var regS = new RegExp(key, "gi");
                    match_content = match_content.replace(regS, "<em class=\"search-keyword\">"+key+"</em>");
                });
                ret += "<p class=\"search-result\">" + match_content +"...</p>";
                ret += '</li>';
            }
        }
    });
    ret += "</ul>";
    $searchResult.html(ret);
});
