// Headless Chrome screenshot capturer for LaktaSens UI (CDP over Node built-in WebSocket)
const fs = require('fs');
const path = require('path');
const chromeLauncher = require('C:/Users/Artun/Desktop/Dosyalar/github_repos/LaktaSens/UI/Mobile/node_modules/chrome-launcher');

const BASE = 'http://localhost:5173';
const OUT = 'C:/Users/Artun/Desktop/Dosyalar/github_repos/LaktaSens/presentation/bakanlik/screenshots';

const userFor = (turu) => ({
  kullaniciID: 1, kullaniciTuru: turu, hesapDurumu: 'a', hesapFirmaYetkisi: 'a',
  eposta: 'demo@laktasens.com', isim: 'Demo', soyisim: 'Kullanici',
  telefonNo: '5550000000', tcNo: '11111111111', firmaID: 1,
});

// role -> [ [route, filename], ... ]
const GROUPS = {
  c: [
    ['/cifci/dashboard', 'cifci_dashboard'],
    ['/cifci/ai/ozet', 'ai_genel_ozet'],
    ['/cifci/ai/tahminler', 'ai_tahminler'],
    ['/cifci/ai/anomaliler', 'ai_anomaliler'],
    ['/cifci/ai/risk-skorlari', 'ai_risk_skorlari'],
    ['/cifci/ai/oneriler', 'ai_oneri_merkezi'],
    ['/cifci/GenelTakip', 'suru_genel_takip'],
    ['/cifci/SagmalTakip', 'suru_sagmal_takip'],
    ['/cifci/CikarilacaklarTakip', 'suru_cikarilacaklar'],
    ['/cifci/tedarik/market', 'yem_market'],
    ['/cifci/tedarik/ihale-baslat', 'ihale_baslat'],
    ['/cifci/tedarik/siparis', 'siparis_takibi'],
    ['/cifci/DepoTakip/Stok', 'depo_stok'],
    ['/cifci/yemAnaliz/IhtiyacAnalizi', 'yem_ihtiyac_analizi'],
    ['/cifci/AhirSensorTakip', 'sensor_ahir_takip'],
    ['/cifci/SicaklikSensorTakip', 'sensor_sicaklik'],
  ],
  a: [
    ['/admin/dashboard', 'admin_dashboard'],
    ['/admin/CiflikBasvuru', 'admin_ciftlik_basvuru'],
    ['/admin/parameter/standartYemler', 'admin_standart_yemler'],
  ],
  t: [
    ['/tedarikci/AcikIhaleler', 'tedarikci_acik_ihaleler'],
    ['/tedarikci/TedarikciSiparisler', 'tedarikci_siparisler'],
  ],
};

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const loadWaiters = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method === 'Page.loadEventFired') {
      while (loadWaiters.length) loadWaiters.shift()();
    }
  });
  const ready = new Promise((res) => ws.addEventListener('open', () => res()));
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const waitLoad = () => new Promise((res) => loadWaiters.push(res));
  return { ready, send, waitLoad, ws };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1440,900'],
  });
  console.log('chrome port', chrome.port);
  await sleep(800);
  const targets = await (await fetch(`http://localhost:${chrome.port}/json`)).json();
  const pageTarget = targets.find((t) => t.type === 'page');
  const { ready, send, waitLoad } = connect(pageTarget.webSocketDebuggerUrl);
  await ready;
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  for (const role of Object.keys(GROUPS)) {
    // seed localStorage on the app origin
    let lw = waitLoad();
    await send('Page.navigate', { url: BASE + '/' });
    await lw;
    await sleep(400);
    await send('Runtime.evaluate', {
      expression: `localStorage.setItem('userInfo', JSON.stringify(${JSON.stringify(userFor(role))})); localStorage.setItem('i18nextLng','tr'); localStorage.setItem('theme','light'); true;`,
    });
    for (const [route, name] of GROUPS[role]) {
      try {
        lw = waitLoad();
        await send('Page.navigate', { url: BASE + route });
        await Promise.race([lw, sleep(8000)]);
        await sleep(2600); // react lazy + apexcharts render
        const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(data, 'base64'));
        console.log('saved', name);
      } catch (e) {
        console.log('FAIL', name, String(e).slice(0, 120));
      }
    }
  }
  await chrome.kill();
  console.log('DONE');
  process.exit(0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
