//=============================================================================
// configurations
var file_all = 'all.txt';
var file_index = 'index.md';

//=============================================================================


var all_files = []; // file list of all markdown
var file_contents = {}; // markdown contents
var cached_files = {}; // html contents
var current_file = '';

//=============================================================================
// Routing

// hash in format: #!file.md#anchor
// return [file, anchor], if not found, return undefined
function parse_hash(hash) {
    var match = hash.match(/(?:#!([^#]+))?(?:#(.*))?$/);
    var filename = match ? match[1]: match;
    var anchor = match ? match[2]: match;

    return [filename, anchor];
}

// add simple router, which handles hash URL
function load_url(url, state) {
    var parse = parse_hash(url);
    var filename = parse[0];
    var anchor = parse[1];

    //console.log(url, state);

    // handle history
    var new_url = '#!' + (filename ? filename : current_file) + (anchor ? '#' + anchor : '');

    var changeState = $.proxy(history.pushState, history);
    if (anchor || anchor === '') {
        changeState = $.proxy(history.replaceState, history);
    }
    if (state && state.history) {
        changeState = function () {};
    }

    changeState({history: true, anchor: anchor}, null, new_url);

    if (filename && filename != current_file) {
        current_file = filename;
        handle_markdown(filename);
    }

    // anchor jump, '' or
    var $anchor = anchor === '' ? document.body : document.getElementById(anchor);
    if ($anchor) {
        $anchor.scrollIntoView(true);
    }
}

function load_markdown(file) {
    load_url('#!'+file)
}

window.onpopstate = function(e) {
    //console.log('popstate', e, e.state);
    load_url(location.hash, e.state);
};

$(document).ready(function() {
    // redirect URL
    load_url('#!'+file_index);
});

//=============================================================================
// Routing

// generate table of contents automatically, h2 > h3
function generate_toc($content) {
    var prefix = "<nav class='toc'>" +
        "<h2>Contents</h2>" +
        "<ul>";
    var toc = '';

    $content.find('h2,h3').each(function(i, e) {
        var cur = $(this);
        toc += "<li class='" + cur.prop('tagName') + "'>";
        toc += "<a href='#" + cur.prop('id') + "'>";
        toc += cur.text();
        toc += "</a></li>";
    });
    if (toc === '') {
        // no toc is generated
        toc = 'No Contents Avaliable';
    }
    var postfix = '</ul></nav>';
    return prefix + toc + postfix;
}

// handle the processed markdown data
function handle_html_content(html) {
    // set the content
    $('#content').html(html);
    $('#content pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });

    intercept_content_link($('#content a'));
    var toc = generate_toc($('#content'));
    $('#toc').html(toc);

}

// load markdown file and intercept the link
function handle_markdown(file) {
    fetch_file(file, function(data) {
        handle_html_content(data);
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

function intercept_content_link($element) {
    // intercept all link clicks
    $element.click(function(event) {
        var link = $(this).attr('href');
        var match = link.match(/.*\.md$/);
        if (match) {
            event.preventDefault();
            load_markdown(link, handle_markdown);
        }
    });
}

//=============================================================================
// Searching

$(document).ready(function () {
    // load all files
    $.get(file_all, function(data) {
        all_files = data.trim().split('\n');
    }).then(function() {
        // now we have the files, we want to retrieve all the contents of theme
        $(all_files).each(function(i, e) {
            if (!file_contents[e]) {
                // for each file, fetch its content
                $.get(e, function(data) {
                    // save the data
                    file_contents[e] = data.trim();
                });
            }
        });
    });
});

// add listener for search input box
var $input = $('#search-input');
var $searchResult = $('#search-result');
var $searchResultWrapper = $('#search-result-wrapper');

function showSearchResult(data) {
    if (data) {
        $searchResultWrapper.removeClass('hide');
        $searchResult.html(data);
        intercept_content_link($('#search-result a'));
    } else {
        $searchResultWrapper.addClass('hide');
        $searchResult.html('');
    }
}

function search_and_show(e) {
    var ret = '<ul class=\"search-result-list\">';
    var keywords = e.target.value.trim().toLowerCase().split(/\s+/);

    showSearchResult(false);

    // no keywords, skip
    if (e.target.value.trim().length <= 0) {
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
            content = content.toLowerCase();
            for (var i = 0, len = keywords.length; i < len; i++) {
                var key = keywords[i];
                var match_title = file.toLowerCase().indexOf(key);
                match_index = content.indexOf(key);
                if (match_title >= 0 || match_index >= 0) {
                    is_match = true;
                    break;
                }
            }

            // show search content
            if (is_match) {
                ret += '<li>';
                ret += "<a href='" + file + "' class='search-result-title'>" + file + "</a>";

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
    ret += '</ul>';
    showSearchResult(ret);
}

//=============================================================================
// Searching input box and result

$input.on('click', function (e){
    $(this).select();
});

$input.on('input', function(e){
    search_and_show(e);
});

var $tocWrapper = $('#toc-wrapper');
$('html').click(function(e) {
    if (!$.contains($searchResultWrapper.get(0), e.target)) {
        $searchResultWrapper.addClass('hide');
    }
    if (!$.contains($tocWrapper.get(0), e.target)) {
        $tocWrapper.addClass('hide');
    }
});

//=============================================================================
// Page Navigation -- random/all

function page_all_files() {
    var ret = '<h1>All files</h1>';
    ret += '<ul>';
    ret += $.map(all_files, function(file) {
        return "<li><a href='" + file + "'>" + file + '</a></li>';
    }).join('');
    ret += '</ul>';
    return ret;
}

$('#all_pages').on('click', function(e) {
    current_file = file_all;
    handle_html_content(page_all_files());
});

$('#random_pages').on('click', function(e){
    if (all_files.length <= 0) {
        var content = 'Please add `' + file_all + '` to your wiki for this function to work';
        handle_html_content(content);
        return;
    }
    var idx = Math.floor(Math.random() * all_files.length);
    load_markdown(all_files[idx]);
});

$('#toc-button').on('click', function(e) {
    $tocWrapper.toggleClass('hide');
    e.stopPropagation();
})
