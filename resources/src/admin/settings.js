var domparser = new DOMParser();

$("#save").on("click", function () {
  var license = $("#license").val();
  var secure_key = $("#secure_key").val();
  var certificate = $("#certificate").val();
  var certificate_key = $("#certificate_key").val();

  $.ajax({
    method: "POST",
    url: "/ajax/admin/settings",
    dataType: "json",
    contentType: "application/json",
    data: JSON.stringify({
      license: license,
      secure_key: secure_key,
      certificate: certificate,
      certificate_key: certificate_key,
    }),
  })
    .done(function (response) {
      sendmsg(response.Msg);
    })
    .fail(function () {
      sendmsg("请求失败, 请检查网络是否正常");
    });
});

$.ajax({
  method: "GET",
  url: "/ajax/admin/settings",
  dataType: "json",
})
  .done(function (response) {
    if (response.Ok) {
      $("#license").val(response.Data.license);
      $("#secure_key").val(response.Data.secure_key);
      $("#certificate").val(response.Data.certificate);
      $("#certificate_key").val(response.Data.certificate_key);
      done();
    } else sendmsg(response.Msg);
  })
  .fail(function () {
    sendmsg("请求失败, 请检查网络是否正常");
  });