document.addEventListener("DOMContentLoaded", () => {
  const prioritySites = [
    "https://dash.nylz.xyz",
    "https://dash.nylz-services.ggff.net"
  ];

  const backupSites = [
    "https://dash-server1.nylz.xyz",
    "https://dash-server2.nylz.xyz",
    "https://dash-server3.nylz.xyz"
  ];

  const PING_TIMES = 2;
  const REDIRECT_DELAY = 1000; // 1 秒緩衝時間
  const RETRY_DELAY = 3000;   // 3 秒後重新檢測

  /** 測試節點延遲 */
  async function pingSite(url) {
    let total = 0, successCount = 0;
    for (let i = 0; i < PING_TIMES; i++) {
      const start = performance.now();
      try {
        await fetch(url + "/?cacheBust=" + Date.now(), {
          method: "HEAD",
          mode: "no-cors"
        });
        const end = performance.now();
        total += end - start;
        successCount++;
      } catch {}
    }
    return successCount === 0 ? Infinity : total / successCount;
  }

  /** 更新結果 */
  function updateResult(id, latency) {
    const el = document.getElementById(id);
    const latencyEl = el.querySelector(".latency");
    latencyEl.textContent = latency === Infinity ? "無法連接" : `${Math.round(latency)} ms`;
  }

  function markAsFastest(id) {
    document.getElementById(id).classList.add("fastest");
  }

  function redirect(url, latency) {
    const fullUrl = url + window.location.search + window.location.hash;
    document.getElementById("redirect-message").textContent =
      `找到可用節點 (${Math.round(latency)} ms)，1 秒後跳轉...`;
    setTimeout(() => { window.location.href = fullUrl; }, REDIRECT_DELAY);
  }

  /** 檢查主要節點 */
  async function checkPrioritySites() {
    for (let i = 0; i < prioritySites.length; i++) {
      const site = prioritySites[i];
      const latency = await pingSite(site);
      updateResult(`result-main${i + 1}`, latency);
      if (latency !== Infinity) {
        markAsFastest(`result-main${i + 1}`);
        redirect(site, latency);
        return;
      }
    }
    checkBackupSites();
  }

  /** 檢查備用節點 */
  async function checkBackupSites() {
    const results = [];
    for (let i = 0; i < backupSites.length; i++) {
      const site = backupSites[i];
      const latency = await pingSite(site);
      updateResult(`result${i + 1}`, latency);
      results.push({ site, latency, index: i + 1 });
    }

    const valid = results.filter(r => r.latency !== Infinity);
    if (valid.length === 0) {
      document.getElementById("redirect-message").textContent =
        "無法連接到任何節點，3 秒後自動重試...";
      setTimeout(() => {
        resetUI();
        checkPrioritySites();
      }, RETRY_DELAY);
      return;
    }

    const fastest = valid.reduce((a, b) => a.latency < b.latency ? a : b);
    markAsFastest(`result${fastest.index}`);
    redirect(fastest.site, fastest.latency);
  }

  /** 重設 UI */
  function resetUI() {
    document.querySelectorAll(".latency").forEach(el => el.textContent = "檢測中...");
    document.querySelectorAll(".result").forEach(el => el.classList.remove("fastest"));
    document.getElementById("redirect-message").textContent = "";
  }

  checkPrioritySites();
});
