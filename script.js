// Elementos UI
const startBtn = document.getElementById('start-btn');
const shareBtn = document.getElementById('share-btn');
const speedValue = document.getElementById('speed-value');
const statusText = document.getElementById('status-text');
const progressRing = document.querySelector('.progress-ring');
const pingDisplay = document.getElementById('ping-display');
const downloadDisplay = document.getElementById('download-display');
const uploadDisplay = document.getElementById('upload-display');
const ipDisplay = document.getElementById('ip-display');
const deviceDisplay = document.getElementById('device-display');
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');

// Config do Círculo
const radius = progressRing.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
progressRing.style.strokeDashoffset = circumference;

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    progressRing.style.strokeDashoffset = offset;
}

// 1. Detectar Dispositivo e IP
async function initSystem() {
    // Dispositivo
    const ua = navigator.userAgent;
    let os = "PC/Outro";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "MacOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    
    deviceDisplay.innerText = `${os} • ${navigator.platform}`;

    // IP
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipDisplay.innerText = data.ip;
    } catch (error) {
        ipDisplay.innerText = "Indisponível";
    }

    // Carregar Histórico
    loadHistory();
}
initSystem();

// 2. Histórico (LocalStorage)
function saveHistory(dl, ul, ping) {
    let history = JSON.parse(localStorage.getItem('speedHistory')) || [];
    const newTest = {
        date: new Date().toLocaleDateString('pt-BR'),
        dl: dl,
        ul: ul,
        ping: ping
    };
    
    history.unshift(newTest); // Adiciona no início
    if(history.length > 3) history.pop(); // Mantém apenas os top 3
    
    localStorage.setItem('speedHistory', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    let history = JSON.parse(localStorage.getItem('speedHistory')) || [];
    if(history.length > 0) {
        historySection.classList.remove('hidden');
        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <span>📅 ${item.date}</span>
                <span>⬇️ ${item.dl} Mbps</span>
                <span>⚡ ${item.ping}</span>
            </div>
        `).join('');
    }
}

// 3. Teste de Velocidade
startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.innerText = "Testando...";
    shareBtn.classList.add('hidden'); // Esconde botão de partilha se estiver visível
    
    setProgress(0);
    speedValue.innerText = "0.0";
    pingDisplay.innerText = "-- ms";
    
    // FASE 1: PING
    statusText.innerText = "Medindo Ping...";
    let pingVal = "20 ms";
    try {
        const startPing = Date.now();
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
        const p = Date.now() - startPing;
        pingVal = `${p} ms`;
        pingDisplay.innerText = pingVal;
    } catch (e) { pingDisplay.innerText = pingVal; }

    // FASE 2: DOWNLOAD
    statusText.innerText = "Download...";
    const dlSpeed = await simulateTest('download');

    // FASE 3: UPLOAD
    statusText.innerText = "Upload...";
    const ulSpeed = await simulateTest('upload');

    // FIM
    statusText.innerText = "Concluído";
    startBtn.innerText = "Testar Novamente";
    startBtn.disabled = false;
    setProgress(100);

    // Salvar e Mostrar Partilha
    saveHistory(dlSpeed, ulSpeed, pingVal);
    
    // Configurar Botão de Partilha WhatsApp
    const msg = `🚀 Testei minha internet no NetSpeed Pro:%0A%0A⬇️ Download: ${dlSpeed} Mbps%0A⬆️ Upload: ${ulSpeed} Mbps%0A⚡ Ping: ${pingVal}%0A%0ATeste a sua agora: ${window.location.href}`;
    shareBtn.href = `https://wa.me/?text=${msg}`;
    shareBtn.classList.remove('hidden');
});

// Simulador
function simulateTest(type) {
    return new Promise(resolve => {
        let currentSpeed = 0;
        let progress = 0;
        const targetSpeed = Math.floor(Math.random() * (150 - 30 + 1)) + 30; 
        
        const interval = setInterval(() => {
            progress += 1.5;
            let fluctuation = (Math.random() - 0.5) * 10;
            currentSpeed = (progress / 100) * targetSpeed + fluctuation;
            if (currentSpeed < 0) currentSpeed = 0;

            if (progress >= 100) {
                currentSpeed = targetSpeed;
                clearInterval(interval);
                let finalVal = currentSpeed.toFixed(1);
                
                if (type === 'download') {
                    downloadDisplay.innerText = `${finalVal} Mbps`;
                } else {
                    finalVal = (currentSpeed * 0.4).toFixed(1); // Upload menor
                    uploadDisplay.innerText = `${finalVal} Mbps`;
                }
                resolve(finalVal);
            }

            speedValue.innerText = currentSpeed.toFixed(1);
            let ringProgress = type === 'download' ? progress / 2 : 50 + (progress / 2);
            setProgress(ringProgress);
        }, 50);
    });
}