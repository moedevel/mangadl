function handle(e) {
  if (e.keyCode === 13) {
    e.preventDefault();
    document.getElementById("btnGetLink").click();
  }
}

function getLinkres() {
  let query = document.getElementById("code").value;
  let code = query.match(/(\d+)/g);
  let type = document.getElementById("fileType").value;
  let linkres = document.getElementById("linkres");
  let mangadl = `/download/nhentai/${code}/${type}`;

  if (query) {
    document.getElementById("btnGetLink").href = mangadl;
  }
}

