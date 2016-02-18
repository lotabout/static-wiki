// add simple router, which handles hash URL
function route(url, callback) {
    var match = url.match(/#(.*)$/);
    fragment = match ? match[1] : url;

    console.log('route', fragment);

    history.pushState(null, null, '#' + fragment);
    callback(fragment);
}

function load_markdown(url) {
    route(url, handle_markdown);
}

// load markdown file and intercept the link
function handle_markdown(file) {
    $.get(file, function(data) {
        var content = marked(data);

        // set the content
        $('#content').html(content);
        intercept_content_link();
    });
}

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

// after load
var url = window.location.href;
if (!url.endsWith('.md')) {
    url += '#index.md';
}
load_markdown(url);

window.onpopstate = function(e) {
    console.log('here');
    load_markdown(location.hash);
};

// load all files
$.get('all.txt', function(data) {
    $('#log').html(data);
});
