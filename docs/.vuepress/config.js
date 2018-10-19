module.exports = {
    base: '/tua-storage/',
    locales: {
        '/': {
            title: 'tua-storage',
            description: '📦统一封装各个端（小程序、web 端、React-Native）中对于缓存层的使用'
        }
    },
    head: [
        ['link', { rel: 'icon', href: `/logo.png` }],
    ],
    serviceWorker: true,
    themeConfig: {
        repo: 'tuateam/tua-storage',
        docsDir: 'docs',
        editLinks: true,
        editLinkText: '在 GitHub 上编辑此页',
        lastUpdated: '上次更新',
        nav: [
            {
                text: '快速上手',
                link: '/quick-start/',
            },
            {
                text: '配置',
                link: '/config/',
            },
            {
                text: '生态系统',
                items: [
                    { text: 'api 生成工具', link: 'https://tuateam.github.io/tua-api/' },
                    { text: '小程序框架', link: 'https://tuateam.github.io/tua-mp/' },
                ],
            },
        ],
        sidebar: {
            '/quick-start/': [
                {
                    title: '快速上手',
                    collapsable: false,
                    children: [
                        'installation',
                        '',
                        '../config/',
                    ],
                },
            ],
            '/config/': [
                {
                    title: '配置',
                    collapsable: false,
                    children: [
                        '',
                    ],
                },
            ],
        },
        serviceWorker: {
            updatePopup: {
               message: 'New content is available.',
               buttonText: 'Refresh',
            },
        },
    },
}
