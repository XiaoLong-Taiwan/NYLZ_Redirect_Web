document.addEventListener('DOMContentLoaded', function() {
    const sites = [
        'https://google.com',
        'https://facebook.com',
        'https://youtube.com',
        'https://nylz.xyz',
        'https://dash5.nylz.xyz'
    ];

    const results = [];
    let checksCompleted = 0;

    function checkLatency(url, index) {
        const startTime = performance.now();
        
        fetch(url, {
            mode: 'no-cors'  // 由於跨域限制，使用no-cors模式
        })
        .then(() => {
            const endTime = performance.now();
            const latency = endTime - startTime;
            updateResult(index, latency);
        })
        .catch(() => {
            updateResult(index, Infinity);
        });
    }

    function updateResult(index, latency) {
        const resultElement = document.getElementById(`result${index + 1}`);
        const latencySpan = resultElement.querySelector('.latency');
        
        results[index] = {
            url: sites[index],
            latency: latency
        };

        if (latency === Infinity) {
            latencySpan.textContent = '無法連接';
            latencySpan.style.color = '#ff4444';
        } else {
            const roundedLatency = Math.round(latency);
            latencySpan.textContent = `${roundedLatency}ms`;
            // 根據延遲值設置顏色
            if (roundedLatency < 100) {
                latencySpan.style.color = '#00ff00';
            } else if (roundedLatency < 200) {
                latencySpan.style.color = '#ffff00';
            } else {
                latencySpan.style.color = '#ff6b6b';
            }
        }

        checksCompleted++;
        
        if (checksCompleted === sites.length) {
            redirectToFastest();
        }
    }

    function redirectToFastest() {
        const validResults = results.filter(result => result.latency !== Infinity);
        
        if (validResults.length === 0) {
            document.getElementById('redirect-message').textContent = '無法連接到任何網站';
            return;
        }

        const fastest = validResults.reduce((prev, current) => 
            prev.latency < current.latency ? prev : current
        );

        const fastestElement = document.getElementById(`result${results.indexOf(fastest) + 1}`);
        fastestElement.classList.add('fastest');

        document.getElementById('redirect-message').textContent = 
            `找到延遲最低的網站！（${Math.round(fastest.latency)}ms）即將跳轉...`;

        // 顯示跳轉訊息1秒後進行跳轉
        setTimeout(() => {
            window.location.href = fastest.url;
        }, 1000);
    }

    // 開始檢測所有網站
    sites.forEach((site, index) => {
        checkLatency(site, index);
    });
});
