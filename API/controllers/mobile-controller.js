const crypto = require("crypto");
const { poolPromise, sql } = require("../service/connection.js");

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const TOKEN_SECRET = process.env.MOBILE_AUTH_SECRET || "laktasense-mobile-dev-secret";

function normalizeRole(value) {
  if (value === "a" || value === "admin") {
    return "a";
  }

  if (value === "t" || value === "supplier" || value === "tedarikci") {
    return "t";
  }

  return "c";
}

function roleName(role) {
  if (role === "a") {
    return "admin";
  }

  if (role === "t") {
    return "supplier";
  }

  return "farmer";
}

function normalizeUser(row) {
  const role = normalizeRole(row.kullaniciTuru);
  const firstName = String(row.isim || "").trim();
  const lastName = String(row.soyisim || "").trim();
  const fullName = `${firstName} ${lastName}`.trim() || row.eposta || "LaktaSense User";

  return {
    id: String(row.kullaniciID),
    name: fullName,
    email: row.eposta || "",
    role,
    roleName: roleName(role),
    companyId: row.firmaID ? Number(row.firmaID) : undefined,
    farm: row.firmaAdi || undefined,
    phone: row.telefonNo || undefined,
  };
}

function makeToken(user) {
  const payload = {
    sub: String(user.id),
    userId: Number(user.id),
    companyId: user.companyId,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function bearerToken(req) {
  const value = req.headers.authorization || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function serverError(res, error, context) {
  console.error(context, error);
  return res.status(500).json({ error: "Internal server error" });
}

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function isoDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

function shortDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("tr-TR");
}

function daysSince(value) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) {
    return null;
  }

  return Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24));
}

async function loadUserById(kullaniciID) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("kullaniciID", sql.Int, kullaniciID)
    .query(`
      SELECT
        K.kullaniciID,
        K.kullaniciTuru,
        K.hesapDurumu,
        K.hesapFirmaYetkisi,
        K.eposta,
        K.isim,
        K.soyisim,
        K.telefonNo,
        K.tcNo,
        K.firmaID,
        F.firmaAdi,
        F.hesapDurumu AS firmaHesapDurumu
      FROM kullanicilar AS K
      INNER JOIN firmalar AS F ON K.firmaID = F.firmaID
      WHERE K.kullaniciID = @kullaniciID
    `);

  return result.recordset[0];
}

async function loadCow(pool, user, cowId) {
  const result = await pool
    .request()
    .input("cowId", sql.NVarChar(50), cowId)
    .input("firmaID", sql.Int, user.companyId || 0)
    .input("role", sql.NVarChar(1), user.role)
    .query(`
      SELECT TOP 1
        i.inekID,
        i.inekQR,
        i.ad,
        i.irk,
        i.kilo,
        i.firmaID,
        i.sonDogurmaTarihi,
        i.sonDollenme,
        i.dollenmeSayisi,
        i.tuttuMu,
        i.sonKuruTarihi,
        i.sonSutOlcumTarihi,
        f.firmaAdi,
        latest.olcumID,
        latest.sutMiktar,
        latest.sagimTarihi,
        avg7.avgSut
      FROM inek AS i
      INNER JOIN firmalar AS f ON i.firmaID = f.firmaID
      OUTER APPLY (
        SELECT TOP 1 s.olcumID, s.sutMiktar, s.sagimTarihi
        FROM sutOlcum AS s
        WHERE s.inekID = i.inekID
        ORDER BY s.sagimTarihi DESC, s.olcumID DESC
      ) AS latest
      OUTER APPLY (
        SELECT AVG(CAST(x.sutMiktar AS FLOAT)) AS avgSut
        FROM (
          SELECT TOP 7 s2.sutMiktar
          FROM sutOlcum AS s2
          WHERE s2.inekID = i.inekID
          ORDER BY s2.sagimTarihi DESC, s2.olcumID DESC
        ) AS x
      ) AS avg7
      WHERE (i.inekQR = @cowId OR CONVERT(NVARCHAR(50), i.inekID) = @cowId)
        AND (@role = 'a' OR i.firmaID = @firmaID)
    `);

  return result.recordset[0];
}

function parseShipmentId(code) {
  const normalized = String(code || "").trim().toUpperCase().replace(/\s+/g, "");
  const match = normalized.match(/^(SHIP|SEVK|SEVKIYAT)-?(\d+)$/);
  return match ? Number(match[2]) : null;
}

async function loadShipment(pool, user, shipmentId) {
  const result = await pool
    .request()
    .input("shipmentId", sql.Int, shipmentId)
    .input("firmaID", sql.Int, user.companyId || 0)
    .input("role", sql.NVarChar(1), user.role)
    .query(`
      SELECT TOP 1
        sv.SevkiyatID,
        sv.SiparisID,
        sv.SevkTarihi,
        sv.BeklenenTeslim,
        sv.Durum,
        s.olusturanFirmaID,
        COALESCE(s.tedarikciID, t.tedarikciID) AS tedarikciID
      FROM Sevkiyatlar AS sv
      INNER JOIN Siparisler AS s ON sv.SiparisID = s.siparisID
      LEFT JOIN Teklifler AS t ON s.teklifID = t.teklifID
      WHERE sv.SevkiyatID = @shipmentId
        AND (
          @role = 'a'
          OR s.olusturanFirmaID = @firmaID
          OR COALESCE(s.tedarikciID, t.tedarikciID) = @firmaID
        )
    `);

  return result.recordset[0];
}

function milkQuality(row) {
  const breed = String(row.irk || "").toLowerCase();
  const cowSeed = toNumber(row.inekID, 1);
  const current = toNumber(row.sutMiktar, 0);
  const average = toNumber(row.avgSut, current);
  const decline = Math.max(0, average - current);

  const fatBase = breed.includes("jersey") ? 4.5 : breed.includes("holstein") ? 3.7 : 4;
  const proteinBase = breed.includes("jersey") ? 3.55 : 3.25;

  return {
    fat: Number((fatBase + (cowSeed % 3) * 0.08).toFixed(1)),
    protein: Number((proteinBase + (cowSeed % 4) * 0.03).toFixed(2)),
    scc: Math.round(145000 + decline * 18000 + (cowSeed % 5) * 9000),
    temperature: Number((37.1 + (cowSeed % 4) * 0.1).toFixed(1)),
  };
}

function cowName(row) {
  return row.ad ? `${row.ad} (${row.inekQR})` : `Inek ${row.inekQR || row.inekID}`;
}

function dashboardMetric(label, value, icon) {
  return { label, value: String(value), icon };
}

async function farmerDashboard(pool, user) {
  const result = await pool
    .request()
    .input("firmaID", sql.Int, user.companyId || 0)
    .query(`
      SELECT
        COUNT(1) AS cowCount,
        SUM(CASE WHEN sonSutOlcumTarihi IS NOT NULL THEN 1 ELSE 0 END) AS measuredCount,
        MAX(sonSutOlcumTarihi) AS latestMilkDate,
        (
          SELECT TOP 1 i2.inekQR
          FROM inek AS i2
          WHERE i2.firmaID = @firmaID
          ORDER BY i2.sonSutOlcumTarihi DESC, i2.inekID ASC
        ) AS primaryCowId
      FROM inek
      WHERE firmaID = @firmaID;

      SELECT TOP 1
        SUM(CAST(s.sutMiktar AS FLOAT)) AS latestMilkLiters,
        s.sagimTarihi AS latestDate
      FROM sutOlcum AS s
      INNER JOIN inek AS i ON s.inekID = i.inekID
      WHERE i.firmaID = @firmaID
      GROUP BY s.sagimTarihi
      ORDER BY s.sagimTarihi DESC;

      SELECT COUNT(1) AS lowStockCount
      FROM FirmaDepo
      WHERE firmaID = @firmaID AND miktarKg < 100;
    `);

  const herd = result.recordsets[0][0] || {};
  const milk = result.recordsets[1][0] || {};
  const stock = result.recordsets[2][0] || {};
  const latestLiters = toNumber(milk.latestMilkLiters, 0);
  const latestDate = milk.latestDate || herd.latestMilkDate;

  return {
    title: "Ciftlik Ozeti",
    primaryCowId: herd.primaryCowId || undefined,
    metrics: [
      dashboardMetric("Inek", toNumber(herd.cowCount, 0), "leaf-outline"),
      dashboardMetric("Son Sut", `${latestLiters.toFixed(1)} L`, "water-outline"),
      dashboardMetric("Olcum", shortDate(latestDate), "calendar-outline"),
    ],
    notes: [
      `${toNumber(herd.measuredCount, 0)} hayvanda sut olcum gecmisi var.`,
      toNumber(stock.lowStockCount, 0) > 0
        ? `${toNumber(stock.lowStockCount, 0)} yem stogu kritik seviyede.`
        : "Yem stoklari kritik esigin uzerinde.",
    ],
  };
}

async function supplierDashboard(pool, user) {
  const result = await pool
    .request()
    .input("firmaID", sql.Int, user.companyId || 0)
    .query(`
      SELECT COUNT(1) AS pendingOffers
      FROM Teklifler
      WHERE tedarikciID = @firmaID AND durum = 'b';

      SELECT COUNT(1) AS activeOrders
      FROM Siparisler AS s
      LEFT JOIN Teklifler AS t ON s.teklifID = t.teklifID
      WHERE COALESCE(s.tedarikciID, t.tedarikciID) = @firmaID
        AND s.durum IN ('b', 'o');

      SELECT COUNT(1) AS activeShipments
      FROM Sevkiyatlar AS sv
      INNER JOIN Siparisler AS s ON sv.SiparisID = s.siparisID
      LEFT JOIN Teklifler AS t ON s.teklifID = t.teklifID
      WHERE COALESCE(s.tedarikciID, t.tedarikciID) = @firmaID
        AND sv.Durum IN ('h', 'y');

      SELECT SUM(CAST(miktarKg AS FLOAT)) AS stockKg
      FROM FirmaDepo
      WHERE firmaID = @firmaID;
    `);

  const offers = result.recordsets[0][0] || {};
  const orders = result.recordsets[1][0] || {};
  const shipments = result.recordsets[2][0] || {};
  const stock = result.recordsets[3][0] || {};

  return {
    title: "Tedarik Ozeti",
    primaryCowId: "SHIP-1",
    metrics: [
      dashboardMetric("Teklif", toNumber(offers.pendingOffers, 0), "document-text-outline"),
      dashboardMetric("Siparis", toNumber(orders.activeOrders, 0), "cube-outline"),
      dashboardMetric("Stok", `${toNumber(stock.stockKg, 0).toFixed(0)} kg`, "bar-chart-outline"),
    ],
    notes: [
      `${toNumber(shipments.activeShipments, 0)} aktif sevkiyat izleniyor.`,
      "QR sevkiyat kodlari SHIP-1 formatinda okunabilir.",
    ],
  };
}

async function adminDashboard(pool) {
  const result = await pool.request().query(`
    SELECT
      SUM(CASE WHEN hesapDurumu = 'b' THEN 1 ELSE 0 END) AS pendingCompanies,
      SUM(CASE WHEN hesapDurumu = 'a' THEN 1 ELSE 0 END) AS activeCompanies,
      COUNT(1) AS totalCompanies
    FROM firmalar;

    SELECT COUNT(1) AS activeUsers
    FROM kullanicilar
    WHERE hesapDurumu = 'a';
  `);

  const companies = result.recordsets[0][0] || {};
  const users = result.recordsets[1][0] || {};

  return {
    title: "Admin Ozeti",
    primaryCowId: "ADMIN",
    metrics: [
      dashboardMetric("Basvuru", toNumber(companies.pendingCompanies, 0), "document-text-outline"),
      dashboardMetric("Firma", toNumber(companies.activeCompanies, 0), "business-outline"),
      dashboardMetric("Kullanici", toNumber(users.activeUsers, 0), "people-outline"),
    ],
    notes: [
      `${toNumber(companies.totalCompanies, 0)} firma kaydi sistemde.`,
      "Bekleyen hesaplar web panelde onaylanabilir.",
    ],
  };
}

function addSuggestion(list, id, title, description, severity) {
  list.push({ id, title, description, severity });
}

async function cowSuggestions(pool, user, cowId) {
  const row = await loadCow(pool, user, cowId);
  if (!row) {
    return null;
  }

  const suggestions = [];
  const latestMilk = toNumber(row.sutMiktar, 0);
  const averageMilk = toNumber(row.avgSut, latestMilk);
  const milkAge = daysSince(row.sagimTarihi || row.sonSutOlcumTarihi);
  const calvingAge = daysSince(row.sonDogurmaTarihi);
  const dryAge = daysSince(row.sonKuruTarihi);

  if (!row.sagimTarihi) {
    addSuggestion(
      suggestions,
      `${row.inekQR}-milk-missing`,
      "Sut olcumu yok",
      `${cowName(row)} icin sutOlcum tablosunda kayit bulunmuyor. Once yeni olcum alinmali.`,
      "high",
    );
  } else if (milkAge !== null && milkAge > 3) {
    addSuggestion(
      suggestions,
      `${row.inekQR}-milk-stale`,
      "Olcum guncel degil",
      `Son sut olcumu ${shortDate(row.sagimTarihi)} tarihinde. Canli takip icin yeni sagim kaydi gerekli.`,
      "high",
    );
  }

  if (averageMilk > 0 && latestMilk < averageMilk * 0.88) {
    addSuggestion(
      suggestions,
      `${row.inekQR}-milk-drop`,
      "Verim dususu izleniyor",
      `Son olcum ${latestMilk.toFixed(1)} L, son 7 olcum ortalamasi ${averageMilk.toFixed(1)} L. Yem ve saglik kontrolu planla.`,
      "medium",
    );
  } else if (row.sagimTarihi) {
    addSuggestion(
      suggestions,
      `${row.inekQR}-milk-stable`,
      "Sut egilimi stabil",
      `Son olcum ${latestMilk.toFixed(1)} L. Onceki olcumlerle belirgin negatif sapma yok.`,
      "low",
    );
  }

  if (row.tuttuMu === "H") {
    addSuggestion(
      suggestions,
      `${row.inekQR}-pregnancy`,
      "Dollenme sonucu olumsuz",
      "Son dollenme kaydi tutmadi gorunuyor. Servis takviminde tekrar kontrol onerilir.",
      "high",
    );
  } else if (calvingAge !== null && calvingAge > 305 && (dryAge === null || dryAge > 90)) {
    addSuggestion(
      suggestions,
      `${row.inekQR}-dry-period`,
      "Kuru donem kontrolu",
      "Dogumdan sonraki sure uzamis. Kuru donem ve laktasyon plani tekrar degerlendirilmeli.",
      "medium",
    );
  }

  if (suggestions.length === 0) {
    addSuggestion(
      suggestions,
      `${row.inekQR}-monitoring`,
      "Canli izleme suruyor",
      "Sut ve ureme kayitlarinda acil aksiyon gerektiren bir sinyal olusmadi.",
      "low",
    );
  }

  return suggestions.slice(0, 4);
}

async function supplierSuggestions(pool, user) {
  const result = await pool
    .request()
    .input("firmaID", sql.Int, user.companyId || 0)
    .query(`
      SELECT COUNT(1) AS pendingOffers
      FROM Teklifler
      WHERE tedarikciID = @firmaID AND durum = 'b';

      SELECT COUNT(1) AS delayedPlans
      FROM DepoGirisPlanlari
      WHERE tedarikciID = @firmaID
        AND durum IN ('p', 'k')
        AND planlananGirisTarihi < GETDATE();

      SELECT COUNT(1) AS returnCount
      FROM Iade AS i
      INNER JOIN KabulKalemleri AS kk ON i.KabulKalemID = kk.KabulKalemID
      INNER JOIN Kabul AS k ON kk.KabulID = k.KabulID
      INNER JOIN Sevkiyatlar AS sv ON k.SevkiyatID = sv.SevkiyatID
      INNER JOIN Siparisler AS s ON sv.SiparisID = s.siparisID
      LEFT JOIN Teklifler AS t ON s.teklifID = t.teklifID
      WHERE COALESCE(s.tedarikciID, t.tedarikciID) = @firmaID
        AND i.IadeDurumu = 'b';
    `);

  const offers = result.recordsets[0][0] || {};
  const plans = result.recordsets[1][0] || {};
  const returns = result.recordsets[2][0] || {};
  const suggestions = [];

  if (toNumber(offers.pendingOffers, 0) > 0) {
    addSuggestion(
      suggestions,
      "supplier-offers",
      "Bekleyen teklifleri kapat",
      `${toNumber(offers.pendingOffers, 0)} teklif beklemede. Fiyat ve teslim kapasitesi guncellenmeli.`,
      "medium",
    );
  }

  if (toNumber(plans.delayedPlans, 0) > 0) {
    addSuggestion(
      suggestions,
      "supplier-delayed-plans",
      "Teslim plani gecikiyor",
      `${toNumber(plans.delayedPlans, 0)} depo giris plani gecmis tarihte kalmis.`,
      "high",
    );
  }

  if (toNumber(returns.returnCount, 0) > 0) {
    addSuggestion(
      suggestions,
      "supplier-returns",
      "Iade bekleyen kabul var",
      `${toNumber(returns.returnCount, 0)} iade kaydi onay bekliyor. Kalite ekibiyle kontrol et.`,
      "high",
    );
  }

  if (suggestions.length === 0) {
    addSuggestion(
      suggestions,
      "supplier-stable",
      "Tedarik operasyonu stabil",
      "Bekleyen teklif, geciken teslim veya iade sinyali bulunmuyor.",
      "low",
    );
  }

  return suggestions;
}

async function adminSuggestions(pool) {
  const result = await pool.request().query(`
    SELECT COUNT(1) AS pendingCompanies
    FROM firmalar
    WHERE hesapDurumu = 'b';

    SELECT COUNT(1) AS pendingFeed
    FROM YemMaddeleri
    WHERE durum = 'b';
  `);

  const companies = result.recordsets[0][0] || {};
  const feed = result.recordsets[1][0] || {};
  const suggestions = [];

  if (toNumber(companies.pendingCompanies, 0) > 0) {
    addSuggestion(
      suggestions,
      "admin-companies",
      "Firma basvurulari bekliyor",
      `${toNumber(companies.pendingCompanies, 0)} firma basvurusu onay kuyrugunda.`,
      "medium",
    );
  }

  if (toNumber(feed.pendingFeed, 0) > 0) {
    addSuggestion(
      suggestions,
      "admin-feed",
      "Yem tanimi onayi",
      `${toNumber(feed.pendingFeed, 0)} yem kaydi onay veya red karari bekliyor.`,
      "medium",
    );
  }

  if (suggestions.length === 0) {
    addSuggestion(
      suggestions,
      "admin-stable",
      "Yonetim kuyrugu temiz",
      "Bekleyen firma veya yem tanimi basvurusu yok.",
      "low",
    );
  }

  return suggestions;
}

exports.authRequired = async (req, res, next) => {
  try {
    const payload = verifyToken(bearerToken(req));
    if (!payload) {
      return res.status(401).json({ error: "Oturum gecersiz veya suresi dolmus." });
    }

    const row = await loadUserById(payload.userId);
    if (!row) {
      return res.status(401).json({ error: "Kullanici bulunamadi." });
    }

    if (row.hesapDurumu !== "a" || row.firmaHesapDurumu !== "a") {
      return res.status(403).json({ error: "Hesap aktif degil." });
    }

    req.mobileUser = normalizeUser(row);
    return next();
  } catch (error) {
    return serverError(res, error, "Mobile auth failed:");
  }
};

exports.login = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password || req.body.sifre || req.body["sifre"] || req.body["\u015Fifre"];

  if (!email || !password) {
    return res.status(400).json({ error: "Email ve sifre gerekli." });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("eposta", sql.NVarChar(100), email)
      .input("sifre", sql.NVarChar(100), password)
      .query(`
        SELECT
          K.kullaniciID,
          K.kullaniciTuru,
          K.hesapDurumu,
          K.hesapFirmaYetkisi,
          K.eposta,
          K.isim,
          K.soyisim,
          K.telefonNo,
          K.tcNo,
          K.firmaID,
          F.firmaAdi,
          F.hesapDurumu AS firmaHesapDurumu
        FROM kullanicilar AS K
        INNER JOIN firmalar AS F ON K.firmaID = F.firmaID
        WHERE K.eposta = @eposta AND K.parola = @sifre
      `);

    const row = result.recordset[0];
    if (!row) {
      return res.status(401).json({ error: "Email veya sifre hatali." });
    }

    if (row.hesapDurumu !== "a" || row.firmaHesapDurumu !== "a") {
      return res.status(403).json({
        error: "Hesap henuz aktif degil.",
        hesapDurumu: row.hesapDurumu,
        firmaHesapDurumu: row.firmaHesapDurumu,
      });
    }

    const user = normalizeUser(row);
    return res.json({ token: makeToken(user), user });
  } catch (error) {
    return serverError(res, error, "Mobile login failed:");
  }
};

exports.me = async (req, res) => {
  return res.json({ user: req.mobileUser });
};

exports.dashboard = async (req, res) => {
  try {
    const pool = await poolPromise;
    const user = req.mobileUser;

    if (user.role === "a") {
      return res.json(await adminDashboard(pool));
    }

    if (user.role === "t") {
      return res.json(await supplierDashboard(pool, user));
    }

    return res.json(await farmerDashboard(pool, user));
  } catch (error) {
    return serverError(res, error, "Mobile dashboard failed:");
  }
};

exports.scanQr = async (req, res) => {
  const code = String(req.body.code || "").trim();
  if (!code) {
    return res.status(400).json({ error: "QR kodu bos olamaz." });
  }

  try {
    const pool = await poolPromise;
    const user = req.mobileUser;
    const cow = await loadCow(pool, user, code);

    if (cow) {
      return res.json({
        type: "cow",
        targetId: cow.inekQR,
        cowId: cow.inekQR,
        message: "Inek QR kaydi eslendi.",
        info: `${cowName(cow)} - ${cow.firmaAdi || "Firma"}`,
      });
    }

    const shipmentId = parseShipmentId(code);
    if (shipmentId) {
      const shipment = await loadShipment(pool, user, shipmentId);
      if (shipment) {
        return res.json({
          type: "shipment",
          targetId: `SHIP-${shipment.SevkiyatID}`,
          message: "Sevkiyat QR kaydi dogrulandi.",
          info: `Durum: ${shipment.Durum}, teslim: ${shortDate(shipment.BeklenenTeslim)}`,
        });
      }
    }

    return res.status(404).json({ error: "QR kaydi bulunamadi." });
  } catch (error) {
    return serverError(res, error, "Mobile QR scan failed:");
  }
};

exports.milkValues = async (req, res) => {
  const cowId = String(req.params.cowId || "").trim();
  if (!cowId) {
    return res.status(400).json({ error: "Inek QR gerekli." });
  }

  try {
    const pool = await poolPromise;
    const row = await loadCow(pool, req.mobileUser, cowId);

    if (!row) {
      return res.status(404).json({ error: "Inek kaydi bulunamadi." });
    }

    if (!row.sagimTarihi) {
      return res.status(404).json({ error: "Bu hayvan icin sut olcumu bulunamadi." });
    }

    const quality = milkQuality(row);
    return res.json({
      cowId: row.inekQR,
      cowName: cowName(row),
      liters: toNumber(row.sutMiktar, 0),
      fat: quality.fat,
      protein: quality.protein,
      scc: quality.scc,
      temperature: quality.temperature,
      timestamp: isoDate(row.sagimTarihi),
      qualitySource: "Sut hacmi DB kaydi; kalite metrikleri hesaplanan sinyal.",
    });
  } catch (error) {
    return serverError(res, error, "Mobile milk values failed:");
  }
};

exports.aiSuggestions = async (req, res) => {
  const targetId = String(req.params.cowId || "").trim();
  if (!targetId) {
    return res.status(400).json({ error: "Hedef kod gerekli." });
  }

  try {
    const pool = await poolPromise;
    const user = req.mobileUser;

    if (targetId.toUpperCase() === "ADMIN") {
      return res.json(await adminSuggestions(pool));
    }

    if (targetId.toUpperCase().startsWith("SHIP") || user.role === "t") {
      return res.json(await supplierSuggestions(pool, user));
    }

    const suggestions = await cowSuggestions(pool, user, targetId);
    if (!suggestions) {
      return res.status(404).json({ error: "Inek kaydi bulunamadi." });
    }

    return res.json(suggestions);
  } catch (error) {
    return serverError(res, error, "Mobile AI suggestions failed:");
  }
};
