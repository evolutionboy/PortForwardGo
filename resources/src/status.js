var statusCard = new Vue({
    el: '#view',
    data: {
        nodes: {},
        is_admin: false,
    },
    methods: {
        toFixed2(f) {
            return f.toFixed(2)
        },

        secondToDate(s) {
            var d = Math.floor(s / 3600 / 24);
            if (d > 0) {
                return d + " 天"
            }
            var h = Math.floor(s / 3600 % 24);
            var m = Math.floor(s / 60 % 60);
            var s = Math.floor(s % 60);
            return h + ":" + ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2);
        },

        readableBytes(bytes) {
            if (!bytes) {
                return '0B'
            }
            var i = Math.floor(Math.log(bytes) / Math.log(1024)),
                sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
            return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + sizes[i];
        },

        readableNetBytes(bytes) {
            if (!bytes) {
                return '0B'
            }
            var Kbps = 125, Mbps = Kbps * 1000, Gbps = Mbps * 1000, Tbps = Gbps * 1000;
            if (bytes < Kbps) return (bytes * 8).toFixed(2) + 'bps';
            if (bytes < Mbps) return (bytes / Kbps).toFixed(2) + 'Kbps';
            if (bytes < Gbps) return (bytes / Mbps).toFixed(2) + 'Mbps';
            if (bytes < Tbps) return (bytes / Gbps).toFixed(2) + 'Gbps';
            else return (bytes / Tbps).toFixed(2) + 'Tbps';
        },

        formatTimestamp(t) {
            return new Date(t * 1000).toLocaleString()
        },

        formatByteSize(bs) {
            const x = this.readableBytes(bs)
            return x != "NaN undefined" ? x : 'NaN'
        },

        formatNetByteSize(bs) {
            const x = this.readableNetBytes(bs)
            return x != "NaN undefined" ? x : 'NaN'
        },

        formatTooltip(server) {
            var disk = this.formatByteSize(server.State.DiskUsed) + '/' + this.formatByteSize(server.Host.DiskTotal);
            var upTime = this.secondToDate(server.State.Uptime);
            var tooltip =
                `{content: 'System: ${server.Host.Platform}-${server.Host.PlatformVersion}[${server.Host.Arch}]<br>CPU: ${server.Host.CPU}<br>Disk: ${disk}<br>Online: ${upTime}<br>Version: ${server.Host.Version}'}`;
            return tooltip
        },

        open_terminal(node_id, session_id) {
            window.open(`/admin/terminal?id=${node_id}&session=${session_id}`, "_blank");
        },
    }
})

function connect(initial) {
    var ws = new WebSocket(window.location.href.replace("http", "ws"));

    var connected = false
    ws.onopen = function () {
        connected = true
        sendmsg("已连接服务器");
    }

    ws.onmessage = function (event) {
        if (initial) { initial = false; done(); }
        var data = JSON.parse(event.data)

        for (nodeid in data.Nodes) {
            if (statusCard.nodes[nodeid] == null) {
                load_nodes();
            }

            if (statusCard.nodes[nodeid] == null) {
                Vue.set(statusCard.nodes, node.id, {
                    name: "未知节点",
                    servers: [],
                })
            }

            var servers = data.Nodes[nodeid];
            if (statusCard.nodes[nodeid].servers.length == 0) {
                Vue.set(statusCard.nodes[nodeid], servers, servers)
            }

            statusCard.nodes[nodeid].servers = servers

            for (id in servers) {
                var server = servers[id]

                if (!server.Host) {
                    server.live = false
                    continue;
                }

                if (data.Now - server.Active > 30) {
                    server.live = false
                    continue;
                }

                server.live = true
            }
        }

        mdui.mutation();
    }

    ws.onclose = function () {
        if (connected) sendmsg("服务器连接断开");
        setTimeout(function () {
            connect(initial);
        }, 3000);
    }

    ws.onerror = function () {
        ws.close()
    }
}

function load_nodes() {
    $.ajax({
        method: "GET",
        url: "/ajax/node",
        dataType: "json",
        async: false,
    })
        .done(function (response) {
            if (response.Ok) {
                for (i in response.Data) {
                    var node = response.Data[i];

                    if (statusCard.nodes[node.id] == null) {
                        Vue.set(statusCard.nodes, node.id, {
                            name: node.name,
                            servers: [],
                        });
                    } else {
                        statusCard.nodes[node.id].name = node.name;
                    }
                }

                mdui.mutation()
            } else sendmsg(response.Msg);
        })
        .fail(function () {
            sendmsg("未能获取服务器数据, 请检查网络是否正常");
        });
}

$.ajax({
    method: "GET",
    url: "/ajax/userInfo",
    dataType: "json",
})
    .done(function (response) {
        if (response.Ok) {
            user = response.Data;

            if (user.permission == 2) {
                $("#admin_banner").removeAttr("style");
                statusCard.is_admin = true;
            }

            if (user.permission_id == 0) {
                statusCard.nodes = {};
                done();
                return;
            }

            load_nodes();
            connect(true);
        } else sendmsg(response.Msg);
    })
    .fail(function () {
        sendmsg("未能获取服务器数据, 请检查网络是否正常");
    });

