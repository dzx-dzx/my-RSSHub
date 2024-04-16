const got = require('@/utils/got');
const timezone = require('@/utils/timezone');
const parseDate = require('@/utils/timezone');

module.exports = async (ctx) => {
    const response = await got({
        method: 'get',
        prefixUrl: 'https://cn.bing.com',
        url: 'HPImageArchive.aspx',
        searchParams: {
            format: 'js',
            idx: 0,
            n: ctx.query.limit ? Number.parseInt(ctx.query.limit, 10) : 7,
            mkt: 'zh-CN',
        },
    });
    const data = response.data;
    ctx.state.data = {
        title: 'Bing每日壁纸',
        link: 'https://cn.bing.com/',
        item: data.images.map((item) => ({
            title: item.copyright,
            description: `<img src="https://cn.bing.com${item.url}">`,
            link: item.copyrightlink,
            pubDate: timezone(parseDate(item.fullstartdate), 0),
        })),
    };
};
