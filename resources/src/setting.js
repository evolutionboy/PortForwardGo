$.ajax({
  method: "GET",
  url: "/ajax/getSetting",
  dataType: "json",
})
  .done(function (response) {
    if (response.Ok) {
      $("#version").html(response.Version);
      $("#panel_port").val(response.Setting.Port);
      $("#username").val(response.Setting.UserName);

      if (response.Msg != "") {
        sendmsg(response.Msg);
      }
    }
  })
  .fail(function () {
    sendmsg("未能获取服务器数据, 请检查网络是否正常");
  });

$("#submit").on("click", function () {
  var port = Number($("#panel_port").val());
  var username = $("#username").val();
  var password = $("#password").val();

  if (!port || !username) {
    sendmsg("请填写端口或用户名");
    return;
  }

  $.ajax({
    method: "POST",
    url: "/ajax/changeSetting",
    data: {
      port: port,
      username: username,
      password: password,
    },
    dataType: "json",
  })
    .done(function (response) {
      if (response.Ok) {
        sendmsg("修改成功");
        if (window.location.origin.indexOf("https") == -1) {
          setTimeout(function () {
            window.location.replace(
              "http://" + window.location.hostname + ":" + port + "/login"
            );
          }, 3000);
        } else {
          setTimeout(function () {
            window.location.replace(
              "https://" + window.location.hostname + ":" + port + "/login"
            );
          }, 3000);
        }
      } else {
        sendmsg(response.Msg);
      }
    })
    .fail(function () {
      sendmsg("请求失败, 请检查网络是否正常");
    });
});
