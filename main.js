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
    $.get(file, function(data) {
        var content = marked(data);

        // set the content
        $('#content').html(content);
        intercept_content_link();
    });
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


// load all files
$.get('all.txt', function(data) {
    $('#log').html(data);
});
