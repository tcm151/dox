module.exports = {
    configureWebpack: {
        devServer: {
            Headers: {
                "Access-Control-Allow-Origin": "*",
            },
        },
    },
}
