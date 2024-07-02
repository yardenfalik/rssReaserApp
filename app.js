let feeds = [];

if(window.navigator.standalone == true)
{
    document.getElementById('instruction').style.display = 'none';
}
else
{
    document.getElementById('main').style.display = 'none';
}

loadFeeds();

function loadFeeds() 
{
    if (localStorage.getItem('feeds')) 
    {
        feeds = JSON.parse(localStorage.getItem('feeds'));
    }
    updateFeedList();
    fetchFeeds();
}

function updateDatabase()
{
    localStorage.setItem('feeds', JSON.stringify(feeds));
}

function addFeed() 
{
    const feedUrl = document.getElementById('feed-url').value.trim();
    if (feedUrl && !feeds.includes(feedUrl)) {
        feeds.push(feedUrl);
        updateFeedList();
        document.getElementById('feed-url').value = '';
    }
    updateDatabase();
    fetchFeeds();
}

function showAddFeed() 
{
    if (document.getElementById('addFeed').style.display == 'block')
    {
        document.getElementById('addFeed').style.display = 'none';
        document.getElementById('addFeedBtn').innerHTML = '+';
    }
    else
    {
        document.getElementById('addFeed').style.display = 'block';
        document.getElementById('addFeedBtn').innerHTML = '-';
    }
}

function removeFeed() 
{
    const selectedIndex = this.textContent;
    if (selectedIndex !== -1) {
        feeds.splice(selectedIndex, 1);
        updateFeedList();
    }
    updateDatabase();
    fetchFeeds();
}

function updateFeedList() 
{
    const feedList = document.getElementById('feedList');
    feedList.innerHTML = '';
    feeds.forEach(feed => {
        var li = document.createElement("li");
        li.appendChild(document.createTextNode(feed));
        li.addEventListener('click', removeFeed);
        feedList.appendChild(li);
    });
    fetchFeeds();
}

function fetchFeeds() 
{
    const feedItems = document.getElementById('feed-items');
    feedItems.innerHTML = 'Loading...';

    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    
    Promise.all(feeds.map(feed => 
        fetch(proxyUrl + encodeURIComponent(feed))
            .then(response => response.text())
            .then(str => ({feed, data: new window.DOMParser().parseFromString(str, "text/xml")}))
    ))
    .then(results => {
        let allItems = [];

        results.forEach(({feed, data}) => {
            const items = data.querySelectorAll('item');
            items.forEach(el => {
                const title = el.querySelector('title').textContent;
                const link = el.querySelector('link').textContent;
                const description = el.querySelector('description').textContent;
                const pubDate = el.querySelector('pubDate').textContent;

                allItems.push({
                    title,
                    link,
                    description,
                    pubDate: new Date(pubDate),
                    feed
                });
            });
        });

        // Sort all items by date, most recent first
        allItems.sort((a, b) => b.pubDate - a.pubDate);

        allItems = allItems.slice(0, 7);

        let html = '';
        allItems.forEach(item => {
            html += `
                <div class="feedItem">
                    <h2><a href="${item.link}" target="_blank">${item.title}</a></h2>
                    <p>${item.description}</p>
                    <small>Published: ${item.pubDate.toLocaleString()}</small>
                    <p class="feed-source">${item.feed}</p>
                </div>
            `;
        });

        feedItems.innerHTML = html || 'No Updates :)';
    })
    .catch(error => {
        console.error('Error fetching RSS feeds:', error);
        feedItems.innerHTML = 'Error fetching RSS feeds. Please check the URLs and try again.';
    });
}