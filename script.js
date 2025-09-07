document.addEventListener("DOMContentLoaded", function () {
  const prioritySites = [
    "https://dash.nylz.xyz",                // 第一優先
    "https://dash.nylz-services.ggff.net"   // 第二優先
  ];

  const backupSites = [
    "https://dash-server1.nylz.xyz",
    "https://dash-server2.nylz.xyz",
    "https://dash-server3.nylz.xyz"
  ];

  const results = [];
  const PING_TIMES = 3;

  async function pingSite(url) {
    let total = 0;
    let successCount = 0;
    for (let i = 0; i < PING_TIMES; i++) {
      const start = performance.now();
      try {
        await fetch(url + "/?cacheBust=" + Date.now(), {
          method: "HEAD",
          mode: "no-cors",
        });
        const end = performance.now();
        total += end - start;
        successCount++;
      } catch (e) {}
    }
    return successCount === 0 ? Infinity : total / successCount;
  }

  function updateResult(elementId, latency, url) {
    const resultElement = document.getElementById(elementId);
    const latencySpan = resultElement.querySelector(".latency");
    latencySpan.textContent = latency === Infinity ? "無法連接" : `${Math.round(latency)} ms`;
    results.push({ url, latency });
  }

  async function checkPrioritySites() {
    for (let i = 0; i < prioritySites.length; i++) {
      const site = prioritySites[i];
      const latency = await pingSite(site);
      updateResult(`result-main${i + 1}`, latency, site);
      if (latency !== Infinity) {
        document.getElementById(`result-main${i + 1}`).classList.add("fastest");
        redirect(site, latency);
        return;
      }
    }
    // 如果前兩個優先站都失敗，檢查備用節點
    checkBackupSites();
  }

  async function checkBackupSites() {
    const backupResults = [];
    for (let i = 0; i < backupSites.length; i++) {
      const site = backupSites[i];
      const latency = await pingSite(site);
      updateResult(`result${i + 1}`, latency, site);
      backupResults.push({ url: site, latency, index: i + 1 });
    }

    const validBackups = backupResults.filter(r => r.latency !== Infinity);
    if (validBackups.length === 0) {
      document.getElementById("redirect-message").textContent = "無法連接到任何節點";
      return;
    }

    const fastest = validBackups.reduce((a, b) => a.latency < b.latency ? a : b);
    document.getElementById(`result${fastest.index}`).classList.add("fastest");
    redirect(fastest.url, fastest.latency);
  }

  function redirect(url, latency) {
    const fullUrl = url + window.location.search + window.location.hash;
    document.getElementById("redirect-message").textContent =
      `找到可用節點 (${Math.round(latency)} ms)，即將跳轉...`;

    setTimeout(() => {
      window.location.href = fullUrl;
    }, 3000);
  }

  // 初始化檢測
  checkPrioritySites();
});
