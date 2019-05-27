const { name } = require('../../package.json')

const description = '📦统一封装各个端（小程序、web 端、React-Native、Node 端）中对于缓存层的使用'

module.exports = {
    base: '/' + name + '/',
    locales: {
        '/': { title: name, description },
    },
    head: [
        ['link', { rel: 'icon', href: `/logo.png` }],
    ],
    evergreen: true,
    serviceWorker: true,
    themeConfig: {
        repo: 'tuateam/tua-storage',
        docsDir: 'docs',
        editLinks: true,
        lastUpdated: '上次更新',
        sidebarDepth: 2,
        editLinkText: '在 GitHub 上编辑此页',
        nav: [
            {
                text: '🌱指南',
                link: '/guide/',
            },
            {
                text: '⚙️配置和方法',
                link: '/config-methods/',
            },
            {
                text: '🔥生态系统',
                items: [
                    { text: '🏗API 生成工具', link: 'https://tuateam.github.io/tua-api/' },
                    { text: '🖖小程序框架', link: 'https://tuateam.github.io/tua-mp/' },
                    { text: '🔐轻松解决滚动穿透', link: 'https://tuateam.github.io/tua-body-scroll-lock/' },
                ],
            },
        ],
        sidebar: {
            '/guide/': [
                {
                    title: '🌱指南',
                    collapsable: false,
                    children: [
                        'installation',
                        '',
                        'sync-data',
                        'vue-plugin',
                        '../config-methods/',
                    ],
                },
            ],
            '/config-methods/': [
                {
                    title: '⚙️配置和方法',
                    collapsable: false,
                    children: [
                        '',
                        'default',
                        'methods',
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
