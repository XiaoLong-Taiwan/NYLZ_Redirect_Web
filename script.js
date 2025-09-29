document.addEventListener("DOMContentLoaded", () => {
  const prioritySites = [
    "https://dash-main.nylz.xyz",
    "https://dash-alt.nylz.xyz"
  ];

  const backupSites = [
    "https://dash-backup01.nylz.xyz",
    "https://dash-backup02.nylz.xyz",
    "https://dash-backup03.nylz.xyz"
  ];

  const PING_TIMES = 3;        // 增加檢測次數以提高準確性
  const REDIRECT_DELAY = 3500; // 5 秒緩衝時間
  const RETRY_DELAY = 3500;    // 5 秒後重新檢測

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
    if (latency === Infinity) {
      latencyEl.textContent = "無法連接";
      latencyEl.classList.add("error");
    } else {
      latencyEl.textContent = `${Math.round(latency)} ms`;
      latencyEl.classList.remove("error");
      if (latency < 100) {
        latencyEl.classList.add("excellent");
      } else if (latency < 200) {
        latencyEl.classList.add("good");
      } else {
        latencyEl.classList.add("normal");
      }
    }
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

  /** 檢查所有節點 */
  async function checkAllSites() {
    const results = [];
    
    // 檢查主要節點
    for (let i = 0; i < prioritySites.length; i++) {
      const site = prioritySites[i];
      const latency = await pingSite(site);
      updateResult(`result-main${i + 1}`, latency);
      if (latency !== Infinity) {
        results.push({ site, latency, index: `main${i + 1}`, isPriority: true });
      }
    }

    // 檢查備用節點
    for (let i = 0; i < backupSites.length; i++) {
      const site = backupSites[i];
      const latency = await pingSite(site);
      updateResult(`result${i + 1}`, latency);
      if (latency !== Infinity) {
        results.push({ site, latency, index: `${i + 1}`, isPriority: false });
      }
    }

    if (results.length === 0) {
      document.getElementById("redirect-message").textContent =
        "無法連接到任何節點，3 秒後自動重試...";
      setTimeout(() => {
        resetUI();
        checkAllSites();
      }, RETRY_DELAY);
      return;
    }

    // 優先選擇可用的主要節點中最快的
    const priorityResults = results.filter(r => r.isPriority);
    if (priorityResults.length > 0) {
      const fastest = priorityResults.reduce((a, b) => a.latency < b.latency ? a : b);
      markAsFastest(`result-${fastest.index}`);
      redirect(fastest.site, fastest.latency);
      return;
    }

    // 如果沒有可用的主要節點，選擇備用節點中最快的
    const fastest = results.reduce((a, b) => a.latency < b.latency ? a : b);
    markAsFastest(`result${fastest.index}`);
    redirect(fastest.site, fastest.latency);
  }

  /** 重設 UI */
  function resetUI() {
    document.querySelectorAll(".latency").forEach(el => el.textContent = "檢測中...");
    document.querySelectorAll(".result").forEach(el => el.classList.remove("fastest"));
    document.getElementById("redirect-message").textContent = "";
  }

  checkAllSites();
});
