const got = require('@/utils/got');
const cheerio = require('cheerio');
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    const currentUrl = 'https://asia.nikkei.com/api/__service/next_api/v1/graphql';

    const response = await got({
        method: 'get',
        url: currentUrl,
        searchParams: {
            operationName: 'GetLatestHeadlinesStream',
            variables: '{}',
            extensions: '{"persistedQuery":{"version":1,"sha256Hash":"287aed8784a3f55ad444bb6b550ebdafb40b0da60c7800081e7343d889975fe8"}}',
        },
        headers: {
            'content-type': 'application/json',
        },
    });

    const list = response.data.data.getLatestHeadlines.items.map((item) => ({ ...item, link: new URL(item.path, 'https://asia.nikkei.com').href }));

    const items = await Promise.all(
        list.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const title = item.name;
                const pubDate = parseDate(item.displayDate * 1000);
                const category = item.primaryTag.name;

                const response = await got(item.link);
                const $ = cheerio.load(response.data);
                let description = $('div[class^="NewsArticle_newsArticleContentContainerWrapper"]').html() || '';

                const nextData = JSON.parse($('#__NEXT_DATA__').text());
                description = nextData.props.pageProps.data.body;

                const author = $('div[class^="NewsArticleDetails_newsArticleDetailsByline"]').text() || '';
                return {
                    title,
                    pubDate,
                    category,
                    description,
                    link: item.link,
                    author,
                };
            })
        )
    );

    ctx.state.data = {
        title: 'Nikkei Asia',
        link: 'https://asia.nikkei.com',
        image: 'https://asia.nikkei.com/images/frontend/favicons/288x288.png',
        item: items,
    };
};
