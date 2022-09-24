var domparser = new DOMParser();
var statistics = [];
var nodes = [];
var devices = [];
var users = [];
var rules = [];

var infoRule = new mdui.Dialog("#infoRule");
var debugRule = new mdui.Dialog("#debugRule");

var protocol = {
  tcpudp: "TCP+UDP",
  http: "HTTP",
  https: "HTTPS",
  host: "TLS HOST",
  secure: "Secure隧道",
  securex: "SecureX隧道",
  tls: "TLS隧道",
};

var Status = {
  Created: '<strong class="mdui-text-color-light-blue">待创建</strong>',
  Sync: '<strong class="mdui-text-color-light-blue">待同步</strong>',
  Disabled: '<strong class="mdui-text-color-grey">停用</strong>',
  Suspend: '<strong class="mdui-text-color-orange">已暂停</strong>',
  Active: '<strong class="mdui-text-color-green">正常</strong>',
  Error: '<strong class="mdui-text-color-red">创建失败</strong>',
  Exhaust: '<strong class="mdui-text-color-red">超流量</strong>',
};

var errorCodes = [
  "无",

  "监听失败",
  "连接目标失败",

  "无效的客户端请求",
  "无效的服务器响应",

  "SNI为空",
  "使用了特殊的TLS设置",
  "无效的TLS服务器证书",

  "达到账户限制",
  "初始化错误",

  "协议已被管理员禁用",
  "SNI包含已被管理员禁用的敏感字符",
  "Path包含已被管理员禁用的敏感字符",
];

$("#node-select").on('change', function () {
  reload_rules();
})

function info_rule(rule) {
  $("#info_id").html(rule.id);
  $("#info_name").html(rule.name);

  $("#info_node").html(nodes[rule.node_id].name);
  $("#info_node_addr").html(nodes[rule.node_id].addr);

  $("#info_protocol").html(protocol[rule.protocol]);
  switch (rule.protocol) {
    case "http": case "https":
      $("#tag_info_bind").html("绑定域名");
      break;
    default:
      $("#tag_info_bind").html("监听端口");
      break;
  }
  $("#info_bind").html(rule.bind);

  switch (rule.mode) {
    case 0:
      $("#info_mode").html("单转发");
      break;
    case 1:
      $("#info_mode").html("负载均衡");
      break;
    case 2:
      $("#info_mode").html("故障转移");
      break;
  }

  $("#info_targets").empty();
  for (i in rule.targets) {
    $("#info_targets").append(rule.targets[i].Host + ":" + rule.targets[i].Port + "<br>");
  }


  if (rule.outbound == "") $("#info_outbound").html("系统默认"); else $("#info_outbound").html(rule.outbound);

  switch (rule.proxy_protocol) {
    case 0:
      $("#info_proxy").html("关闭");
      break;
    case 1:
      $("#info_proxy").html("v1");
      break;
    case 2:
      $("#info_proxy").html("v2");
      break;
  }

  $("#tag_info_dest").attr("style", "display: none;");
  if (rule.dest_node != 0) {
    $("#tag_info_dest").removeAttr("style");
    $("#info_dest").html(nodes[rule.dest_node].name);
  }
  if (rule.dest_device != 0) {
    $("#tag_info_dest").removeAttr("style");
    $("#info_dest").html(devices[rule.dest_device].name);
  }

  $("#info_conf").empty();
  if (rule.conf != null) {
    for (key in rule.conf) {
      $("#info_conf").append(key + "=" + rule.conf[key] + "<br>");
    }
  }

  infoRule.open();
}

$("#info_close").on("click", function () {
  infoRule.close();
});

function delete_rule(id) {
  mdui.confirm("删除后规则无法被恢复", "确认删除", function () {
    $.ajax({
      method: "DELETE",
      url: "/ajax/forward_rule?id=" + id,
      dataType: "json",
    })
      .done(function (response) {
        if (response.Ok) {
          sendmsg("删除成功");
          load_rules();
        } else sendmsg(response.Msg);
      })
      .fail(function () {
        sendmsg("请求失败, 请检查网络是否正常");
      });
  });
}

function load_rules() {
  load_statistics();

  rules = [];
  search = $("#search").val();

  $("#rule_list").empty();
  view_node = $("#node-select option:selected").val();

  $.ajax({
    method: "GET",
    url: "/ajax/admin/forward_rule",
    dataType: "json",
    async: false,
  })
    .done(function (response) {
      if (response.Ok) {
        if (response.Data == null) {
          mdui.updateTables("#rule_table");
          return;
        }

        for (id in response.Data) {
          var rule = response.Data[id];
          rules[rule.id] = rule

          if (search != "" && rule.name.indexOf(search) == -1) continue;
          if (view_node != 0 && rule.node_id != view_node && rule.dest_node != view_node) continue;
          if (rule.targets == null) rule.targets = [];

          if (users[rule.user_id] == null) {
            load_users();
          }

          if (users[rule.user_id] == null) {
            users[rule.user_id] = { name: "未知用户" }
          }

          var traffic_used = '<br><small class="mdui-text-color-grey">已用流量 0 GB</small';
          if (!isNaN(statistics[rule.id])) {
            traffic_used = '<br><small class="mdui-text-color-grey">已用流量 ' + (statistics[rule.id] / 1073741824).toFixed(2).toString() + " GB</small>";
          }

          var mode_text = "";
          switch (rule.mode) {
            case 1:
              mode_text = '<br><small class="mdui-text-color-grey">负载均衡 (共' + rule.targets.length + '个)</small>';
              break;
            case 2:
              mode_text = '<br><small class="mdui-text-color-grey">故障转移 (共' + rule.targets.length + '个)</small>';
              break;
          }

          var status_text = "";
          if (!rule.sync) {
            status_text = `<br><small>${Status["Sync"]}</small>`;
          }

          var outbound_text = "";
          if (rule.dest_node != 0) {
            outbound_text = `<br><small class="mdui-text-color-grey">出口: ${nodes[rule.dest_node].name}</small>`;
          } else if (rule.dest_device != 0) {
            outbound_text = `<br><small class="mdui-text-color-grey">出口: ${devices[rule.dest_device].name}</small>`;
          }

          var html = `<tr id="rule_${rule.id}" data-rule="${rule.id}">
            <td class="mdui-table-cell-checkbox">
              <label class="mdui-checkbox">
                <input type="checkbox">
                <i class="mdui-checkbox-icon"></i>
              </label>
            </td>
            <td>${rule.name}<br><small class="mdui-text-color-grey">#${rule.id}</small></td>
            <td>${users[rule.user_id].name}<br><small class="mdui-text-color-grey">#${rule.user_id}</small></td>
            <td>${nodes[rule.node_id].name}<br><small class="mdui-text-color-grey">${nodes[rule.node_id].addr}</small></td>
            <td>${rule.bind}${traffic_used}</td>`;

          if (rule.targets.length < 1) {
            html += `<td>无${mode_text}</td>`;
          } else {
            html += `<td>${rule.targets[0].Host}:${rule.targets[0].Port}${mode_text}</td>`;
          }

          html += `<td>${protocol[rule.protocol]}${outbound_text}</td>
            <td>${Status[rule.status]}${status_text}</td>`;

          if (rule.status == "Suspend") {
            html += `<td></td></tr>`;

            $("#rule_list").append(html);
            continue;
          }

          html += `<td>
            <span id="info_${rule.id}" class="mdui-btn mdui-btn-icon" mdui-tooltip="{content: '详细'}">
              <i class="mdui-icon material-icons">info_outline</i>
            </span>
            <span id="restart_${rule.id}" class="mdui-btn mdui-btn-icon" mdui-tooltip="{content: '重启'}">
              <i class="mdui-icon material-icons">power_settings_new</i>
            </span>
            <span id="stop_${rule.id}" class="mdui-btn mdui-btn-icon" style="display: none;" mdui-tooltip="{content: '暂停'}">
              <i class="mdui-icon material-icons">pause_circle_outline</i>
            </span>
            <span id="start_${rule.id}" class="mdui-btn mdui-btn-icon" style="display: none;" mdui-tooltip="{content: '启用'}">
              <i class="mdui-icon material-icons">play_circle_outline</i>
            </span>
            <span id="delete_${rule.id}" class="mdui-btn mdui-btn-icon" mdui-tooltip="{content: '删除'}">
              <i class="mdui-icon material-icons">delete</i>
            </span>
            <span id="debug_${rule.id}" class="mdui-btn mdui-btn-icon" mdui-tooltip="{content: '诊断'}">
              <i class="mdui-icon material-icons">help_outline</i>
            </span>     
          </td></tr>`;
          $("#rule_list").append(html);

          switch (rule.status) {
            case "Active":
              $(`#stop_${rule.id}`).removeAttr("style");
              break;
            case "Disabled":
              $(`#start_${rule.id}`).removeAttr("style");
              break;
          }

          $(`#info_${rule.id}`).on("click", null, rule, function (event) {
            info_rule(event.data);
          });

          $(`#restart_${rule.id}`).on("click", null, rule.id, function (event) {
            restart_rule(event.data);
          });

          $(`#start_${rule.id}`).on("click", null, rule.id, function (event) {
            start_rule(event.data);
          });

          $(`#stop_${rule.id}`).on("click", null, rule.id, function (event) {
            stop_rule(event.data);
          });

          $(`#debug_${rule.id}`).on("click", null, rule.id, function (event) {
            debug_rule(event.data);
          });

          $(`#delete_${rule.id}`).on("click", null, rule.id, function (event) {
            delete_rule(event.data);
          });
        }

        mdui.updateTables("#rule_table");
      } else sendmsg(response.Msg);
    })
    .fail(function () {
      sendmsg("未能获取服务器数据, 请检查网络是否正常");
    });
}

function reload_rules() {
  search = $("#search").val();

  $("#rule_list").empty();
  view_node = $("#node-select option:selected").val();

  for (id in rules) {
    var rule = rules[id];

    if (search != "" && rule.name.indexOf(search) == -1) continue;
    if (view_node != 0 && rule.node_id != view_node && rule.dest_node != view_node) continue;
    if (rule.targets == null) rule.targets = [];

    if (users[rule.user_id] == null) {
      load_users();
    }

    if (users[rule.user_id] == null) {
      users[rule.user_id] = { name: "未知用户" }
    }

    var traffic_used = '<br><small class="mdui-text-color-grey">已用流量 0 GB</small';
    if (!isNaN(statistics[rule.id])) {
      traffic_used = '<br><small class="mdui-text-color-grey">已用流量 ' + (statistics[rule.id] / 1073741824).toFixed(2).toString() + " GB</small>";
    }

    var mode_text = "";
    switch (rule.mode) {
      case 1:
        mode_text = '<br><small class="mdui-text-color-grey">负载均衡 (共' + rule.targets.length + '个)</small>';
        break;
      case 2:
        mode_text = '<br><small class="mdui-text-color-grey">故障转移 (共' + rule.targets.length + '个)</small>';
        break;
    }

    var status_text = "";
    if (!rule.sync) {
      status_text = `<br><small>${Status["Sync"]}</small>`;
    }

    var outbound_text = "";
    if (rule.dest_node != 0) {
      outbound_text = `<br><small class="mdui-text-color-grey">出口: ${nodes[rule.dest_node].name}</small>`;
    } else if (rule.dest_device != 0) {
      outbound_text = `<br><small class="mdui-text-color-grey">出口: ${devices[rule.dest_device].name}</small>`;
    }

    var html = `<tr id="rule_${rule.id}" data-rule="${rule.id}">
            <td class="mdui-table-cell-checkbox">
              <label class="mdui-checkbox">
                <input type="checkbox">
                <i class="mdui-checkbox-icon"></i>
              </label>
            </td>
            <td>${rule.name}<br><small class="mdui-text-color-grey">#${rule.id}</small></td>
            <td>${users[rule.user_id].name}<br><small class="mdui-text-color-grey">#${rule.user_id}</small></td>
            <td>${nodes[rule.node_id].name}<br><small class="mdui-text-color-grey">${nodes[rule.node_id].addr}</small></td>
            <td>${rule.bind}${traffic_used}</td>`;

    if (rule.targets.length < 1) {
      html += `<td>无${mode_text}</td>`;
    } else {
      html += `<td>${rule.targets[0].Host}:${rule.targets[0].Port}${mode_text}</td>`;
    }

    html += `<td>${protocol[rule.protocol]}${outbound_text}</td>
            <td>${Status[rule.status]}${status_text}</td>`;

    if (rule.status == "Suspend") {
      html += `<td></td></tr>`;

      $("#rule_list").append(html);
      continue;
    }

    html += `<td>
            <span id="info_${rule.id}" class="mdui-btn mdui-btn-icon" mdui-tooltip="{content: '详细'}">
              <i class="mdui-icon material-icons">info_outline</i>
            </span>
            <span id="restart_${rule.id}" class="mdui-btn mdui-btn-icon" mdui-tooltip="{content: '重启'}">
              <i class="mdui-icon material-icons">power_settings_new</i>
            </span>
            <span id="stop_${rule.id}" class="mdui-btn mdui-btn-icon" style="display: none;" mdui-tooltip="{content: '暂停'}">
              <i class="mdui-icon material-icons">pause_circle_outline</i>
            </span>
            <span id="start_${rule.id}" class="mdui-btn mdui-btn-icon" style="display: none;" mdui-tooltip="{content: '启用'}">
              <i class="mdui-icon material-icons">play_circle_outline</i>
            </span>
            <span id="delete_${rule.id}" class="mdui-btn mdui-btn-icon" mdui-tooltip="{content: '删除'}">
              <i class="mdui-icon material-icons">delete</i>
            </span>
            <span id="debug_${rule.id}" class="mdui-btn mdui-btn-icon" mdui-tooltip="{content: '诊断'}">
              <i class="mdui-icon material-icons">help_outline</i>
            </span>     
          </td></tr>`;
    $("#rule_list").append(html);

    switch (rule.status) {
      case "Active":
        $(`#stop_${rule.id}`).removeAttr("style");
        break;
      case "Disabled":
        $(`#start_${rule.id}`).removeAttr("style");
        break;
    }

    $(`#info_${rule.id}`).on("click", null, rule, function (event) {
      info_rule(event.data);
    });

    $(`#restart_${rule.id}`).on("click", null, rule.id, function (event) {
      restart_rule(event.data);
    });

    $(`#start_${rule.id}`).on("click", null, rule.id, function (event) {
      start_rule(event.data);
    });

    $(`#stop_${rule.id}`).on("click", null, rule.id, function (event) {
      stop_rule(event.data);
    });

    $(`#start_${rule.id}`).on("click", null, rule.id, function (event) {
      start_rule(event.data);
    });

    $(`#delete_${rule.id}`).on("click", null, rule.id, function (event) {
      delete_rule(event.data);
    });

    $(`#debug_${rule.id}`).on("click", null, rule.id, function (event) {
      debug_rule(event.data);
    });
  }

  mdui.updateTables("#rule_table");
}

function load_nodes() {
  nodes = [];

  $.ajax({
    method: "GET",
    url: "/ajax/admin/node",
    dataType: "json",
    async: false,
  })
    .done(function (response) {
      if (response.Ok) {

        for (i in response.Data) {
          var node = response.Data[i];
          nodes[node.id] = node;

          $("#node-select").append(`<option value="${node.id}">${node.name}</option>`);
        }

        load_devices();
        load_rules();
      } else sendmsg(response.Msg);
    })
    .fail(function () {
      sendmsg("未能获取服务器数据, 请检查网络是否正常");
    });
}

function load_statistics() {
  statistics = [];

  $.ajax({
    method: "GET",
    url: "/ajax/admin/forward_rule/statistics",
    dataType: "json",
    async: false,
  })
    .done(function (response) {
      if (response.Ok) {
        for (i in response.Data) {
          var statistic = response.Data[i];

          if (statistics[statistic.rule_id] == null) {
            statistics[statistic.rule_id] = statistic.traffic;
          } else {
            statistics[statistic.rule_id] += statistic.traffic;
          }
        }
      } else sendmsg(response.Msg);
    })
    .fail(function () {
      sendmsg("未能获取服务器数据, 请检查网络是否正常");
    });
}

function load_devices() {
  devices = [];

  $.ajax({
    method: "GET",
    url: "/ajax/admin/tunnel_device",
    dataType: "json",
    async: false,
  })
    .done(function (response) {
      if (response.Ok) {
        for (i in response.Data) {
          var device = response.Data[i];
          devices[device.id] = device;
        }

      } else sendmsg(response.Msg);
    })
    .fail(function () {
      sendmsg("未能获取服务器数据, 请检查网络是否正常");
    });
}

$("#search").keyup(reload_rules);

$("#delete_checked").on('click', function () {
  var success = 0
  var failed = 0
  mdui.confirm("删除后规则无法被恢复", "确认删除", function () {

    $("tr[data-rule]").each(function () {
      var rule_id = $(this).attr("data-rule");
      var checked = $(this).find("td[class=mdui-table-cell-checkbox]").find("label").find("input[type=checkbox]").prop('checked');

      if (!checked || !rule_id) {
        return;
      }

      $.ajax({
        method: "DELETE",
        url: "/ajax/admin/forward_rule?id=" + rule_id,
        dataType: "json",
        async: false,
      }).done(function (response) {
        if (response.Ok) {
          success += 1
        } else failed += 1;
      })
        .fail(function () {
          failed += 1
        });
    });

    sendmsg(`操作完成, 成功${success}个, 失败${failed}个`);
    load_rules();
  });
})

function restart_rule(id) {
  mdui.confirm("真的要重启规则吗?", "询问", function () {
    $.ajax({
      method: "GET",
      url: "/ajax/admin/forward_rule/restart?id=" + id,
      dataType: "json",
    })
      .done(function (response) {
        if (response.Ok) {
          sendmsg(response.Msg);
          load_rules();
        } else sendmsg(response.Msg);
      })
      .fail(function () {
        sendmsg("请求失败, 请检查网络是否正常");
      });
  });
}

function start_rule(id) {
  mdui.confirm("真的要恢复规则吗?", "询问", function () {
    $.ajax({
      method: "GET",
      url: "/ajax/admin/forward_rule/start?id=" + id,
      dataType: "json",
    })
      .done(function (response) {
        if (response.Ok) {
          sendmsg(response.Msg);
          load_rules();
        } else sendmsg(response.Msg);
      })
      .fail(function () {
        sendmsg("请求失败, 请检查网络是否正常");
      });
  });
}

function stop_rule(id) {
  mdui.confirm("真的要暂停规则吗?", "询问", function () {
    $.ajax({
      method: "GET",
      url: "/ajax/admin/forward_rule/stop?id=" + id,
      dataType: "json",
    })
      .done(function (response) {
        if (response.Ok) {
          sendmsg(response.Msg);
          load_rules();
        } else sendmsg(response.Msg);
      })
      .fail(function () {
        sendmsg("请求失败, 请检查网络是否正常");
      });
  });
}

function debug_rule(id) {
  $("#debug_inbound").empty();
  $("#debug_outbound").empty();

  $.ajax({
    method: "GET",
    url: "/ajax/admin/forward_rule/debug?id=" + id,
    dataType: "json",
  })
    .done(function (response) {
      if (response.Ok) {
        if (response.InBound == null) {
          $("#debug_inbound").html("入口连接失败");
        } else {
          if (response.InBound.Ok) {
            $("#debug_inbound").append(`后端反馈时间 ${response.InBound.Data.Timestarp}<br>`);
            $("#debug_inbound").append(`上次错误信息 ${errorCodes[response.InBound.Data.Error]}<br>`);
            $("#debug_inbound").append(`<br>`);
            $("#debug_inbound").append(`规则状态 ${response.InBound.Data.Status}<br>`);

            if (response.InBound.Data.MaxConn != 0) $("#debug_inbound").append(`最大连接数 ${response.InBound.Data.MaxConn}<br>`);
            $("#debug_inbound").append(`已连接 ${response.InBound.Data.Connected}<br>`);
            if (response.InBound.Data.Speed != 0) $("#debug_inbound").append(`峰值速率 ${response.InBound.Data.Speed} Mbps<br>`);

            $("#debug_inbound").append(`<br>`);
            $("#debug_inbound").append(`转发目标<br>`);

            for (target in response.InBound.Data.Targets) {
              $("#debug_inbound").append(`&nbsp;- ${target}<br>`);

              if (response.InBound.Data.Targets[target].Ok) {
                for (ip in response.InBound.Data.Targets[target].Data) {
                  $("#debug_inbound").append(`&nbsp;&nbsp;&nbsp;[${ip}]: ${response.InBound.Data.Targets[target].Data[ip]}<br>`);
                }
              } else {
                $("#debug_inbound").append(`&nbsp;Error: ${response.InBound.Data.Targets[target].Error}<br>`);
              }
            }
          } else $("#debug_inbound").html(response.InBound.Data);
        }

        $("#tag_debug_outbound").attr("style", "display: none")
        if (response.ShowOutbound) {
          $("#tag_debug_outbound").removeAttr("style")

          if (response.OutBound == null) {
            $("#debug_outbound").html("出口连接失败");
          } else {
            if (response.OutBound.Ok) {
              $("#debug_outbound").append(`后端反馈时间 ${response.OutBound.Data.Timestarp}<br>`);
              $("#debug_outbound").append(`上次错误信息 ${errorCodes[response.OutBound.Data.Error]}<br>`);
              $("#debug_outbound").append(`<br>`);
              $("#debug_outbound").append(`规则状态 ${response.OutBound.Data.Status}<br>`);

              if (response.OutBound.Data.MaxConn != 0) $("#debug_outbound").append(`最大连接数 ${response.OutBound.Data.MaxConn}<br>`);
              $("#debug_outbound").append(`已连接 ${response.OutBound.Data.Connected}<br>`);
              if (response.OutBound.Data.Speed != 0) $("#debug_outbound").append(`峰值速率 ${response.OutBound.Data.Speed} Mbps<br>`);

              $("#debug_outbound").append(`<br>`);
              $("#debug_outbound").append(`转发目标<br>`);

              for (target in response.OutBound.Data.Targets) {
                $("#debug_outbound").append(`&nbsp;- ${target}<br>`);

                if (response.OutBound.Data.Targets[target].Ok) {
                  for (ip in response.OutBound.Data.Targets[target].Data) {
                    $("#debug_outbound").append(`&nbsp;&nbsp;&nbsp;[${ip}]: ${response.OutBound.Data.Targets[target].Data[ip]}<br>`);
                  }
                } else {
                  $("#debug_outbound").append(`&nbsp;Error: ${response.OutBound.Data.Targets[target].Error}<br>`);
                }
              }
            } else $("#debug_outbound").html(response.OutBound.Data);
          }
        }

        debugRule.open();
      } else sendmsg(response.Msg);
    })
    .fail(function () {
      sendmsg("请求失败, 请检查网络是否正常");
    });
}

$("#debug_close").on("click", function () {
  debugRule.close();
});

function load_users() {
  users = [];

  $.ajax({
    method: "GET",
    url: "/ajax/admin/user",
    dataType: "json",
    async: false,
  })
    .done(function (response) {
      if (response.Ok) {
        for (id in response.Data) {
          var user = response.Data[id];
          users[user.id] = user
        }
      } else sendmsg(response.Msg);
    })
    .fail(function () {
      sendmsg("未能获取服务器数据, 请检查网络是否正常");
    });
}

load_users();
load_nodes();
done();