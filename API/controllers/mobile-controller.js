const crypto = require("crypto");
const { poolPromise, sql } = require("../service/connection.js");

const TOKEN_TTL_SECONDS = Number(process.env.MOBILE_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7);
const TOKEN_SECRET = process.env.MOBILE_AUTH_SECRET || "laktasense-mobile-dev-secret";

const ROLE_ADMIN = "a";
const ROLE_FARMER = "c";
const ROLE_SUPPLIER = "t";
const ACTIVE_STATUS = "a";

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function normalizeRole(value) {
  const role = cleanString(value).toLowerCase();

  if (role === ROLE_ADMIN || role === "admin") {
    return ROLE_ADMIN;
  }

  if (role === ROLE_SUPPLIER || role === "supplier" || role === "tedarikci") {
    return ROLE_SUPPLIER;
  }

  return ROLE_FARMER;
}

function roleName(role) {
  if (role === ROLE_ADMIN) {
    return "admin";
  }

  if (role === ROLE_SUPPLIER) {
    return "supplier";
  }

  return "farmer";
}

function statusName(status) {
  if (status === "a") {
    return "Aktif";
  }

  if (status === "p") {
    return "Pasif";
  }

  if (status === "b") {
    return "Beklemede";
  }

  return "Bilinmiyor";
}

function companyTypeName(type) {
  if (type === "a") {
    return "LaktaSens";
  }

  if (type === "t") {
    return "Tedarikci";
  }

  return "Ciftlik";
}

function authorityName(authority) {
  if (authority === "a") {
    return "Firma yetkilisi";
  }

  if (authority === "k") {
    return "Kullanici";
  }

  return "Bilinmiyor";
}

function maskNationalId(value) {
  const digits = cleanString(value).replace(/\D/g, "");

  if (!digits) {
    return undefined;
  }

  return `*******${digits.slice(-4)}`;
}

function normalizeUser(row) {
  const role = normalizeRole(row.kullaniciTuru);
  const firstName = cleanString(row.isim);
  const lastName = cleanString(row.soyisim);
  const fullName = `${firstName} ${lastName}`.trim() || row.eposta || "LaktaSense User";

  return {
    id: String(row.kullaniciID),
    name: fullName,
    email: row.eposta || "",
    role,
    roleName: roleName(role),
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    nationalIdMasked: maskNationalId(row.tcNo),
    companyId: row.firmaID ? Number(row.firmaID) : undefined,
    farm: row.firmaAdi || undefined,
    phone: row.telefonNo || undefined,
    accountStatus: row.hesapDurumu,
    accountStatusName: statusName(row.hesapDurumu),
    companyStatus: row.firmaHesapDurumu,
    companyStatusName: statusName(row.firmaHesapDurumu),
    companyRole: row.hesapFirmaYetkisi,
    companyRoleName: authorityName(row.hesapFirmaYetkisi),
    companyType: row.firmaTur || undefined,
    companyTypeName: companyTypeName(row.firmaTur),
    companyPhone: row.firmaTelefonNo || undefined,
    companyEmail: row.firmaMail || undefined,
    companyAddress: row.firmaAdresi || undefined,
    cityName: row.sehirAdi || undefined,
    districtName: row.ilceAdi || undefined,
    region: row.bolge || undefined,
  };
}

function tokenPayloadFor(user) {
  const issuedAt = Math.floor(Date.now() / 1000);

  return {
    sub: String(user.id),
    userId: Number(user.id),
    companyId: user.companyId || null,
    role: user.role,
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
  };
}

function makeToken(user) {
  const payload = tokenPayloadFor(user);
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  const [body, signature] = cleanString(token).split(".");

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

    if (!payload.userId || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function bearerToken(req) {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function getPassword(body) {
  return body.password ?? body.parola ?? body.sifre ?? body["\u015Fifre"];
}

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function toInteger(value, fallback = 0) {
  const numberValue = Number.parseInt(value, 10);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function isoDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function shortDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("tr-TR") : "-";
}

function daysSince(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  const time = date.getTime();

  if (!Number.isFinite(time)) {
    return null;
  }

  return Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24));
}

function isAfter(left, right) {
  if (!left || !right) {
    return Boolean(left && !right);
  }

  return new Date(left).getTime() > new Date(right).getTime();
}

function serverError(res, error, context) {
  console.error(context, error);
  return res.status(500).json({ error: "Internal server error" });
}

function dashboardMetric(label, value, icon) {
  return { label, value: String(value), icon };
}

function addSuggestion(list, id, title, description, severity = "medium") {
  list.push({ id, title, description, severity });
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
        F.firmaTur,
        F.telefonNo AS firmaTelefonNo,
        F.firmaMail,
        F.firmaAdresi,
        F.bolge,
        F.hesapDurumu AS firmaHesapDurumu,
        Sehir.SehirIlceMahalleAdi AS sehirAdi,
        Ilce.SehirIlceMahalleAdi AS ilceAdi
      FROM kullanicilar AS K
      INNER JOIN firmalar AS F ON K.firmaID = F.firmaID
      LEFT JOIN bolgeler AS Sehir ON F.sehirID = Sehir.ID
      LEFT JOIN bolgeler AS Ilce ON F.ilceID = Ilce.ID
      WHERE K.kullaniciID = @kullaniciID
    `);

  return result.recordset[0];
}

function accountIsActive(row) {
  return row && row.hesapDurumu === ACTIVE_STATUS && row.firmaHesapDurumu === ACTIVE_STATUS;
}

function scopedRequest(pool, user) {
  return pool
    .request()
    .input("firmaID", sql.Int, user.companyId || 0)
    .input("role", sql.Char(1), user.role);
}

function cowLifecycle(row) {
  if (isAfter(row.sonKuruTarihi, row.sonDogurmaTarihi)) {
    return "dry";
  }

  if (isAfter(row.sonDogurmaTarihi, row.sonKuruTarihi)) {
    return "milking";
  }

  if (row.sonDogurmaTarihi && !row.sonKuruTarihi) {
    return "milking";
  }

  return "unknown";
}

function reproductionStatus(row) {
  if (row.tuttuMu === "E" && isAfter(row.sonDollenme, row.sonDogurmaTarihi)) {
    return "pregnant";
  }

  if (row.tuttuMu === "H") {
    return "service";
  }

  if (row.sonDollenme) {
    return "waiting";
  }

  return "unknown";
}

function cowName(row) {
  const name = cleanString(row.ad);
  const qr = cleanString(row.inekQR);

  if (name && qr) {
    return `${name} (${qr})`;
  }

  return name || qr || `Inek ${row.inekID}`;
}

function mapCow(row) {
  return {
    id: Number(row.inekID),
    qr: row.inekQR,
    name: row.ad || null,
    displayName: cowName(row),
    breed: row.irk || null,
    weightKg: toNumber(row.kilo, null),
    birthDate: isoDate(row.dogumTarihi),
    companyId: row.firmaID ? Number(row.firmaID) : undefined,
    companyName: row.firmaAdi || undefined,
    lastCalvingDate: isoDate(row.sonDogurmaTarihi),
    lastInseminationDate: isoDate(row.sonDollenme),
    inseminationCount: toNumber(row.dollenmeSayisi, 0),
    pregnancyResult: row.tuttuMu || null,
    lastDryDate: isoDate(row.sonKuruTarihi),
    lastMilkDate: isoDate(row.sonSutOlcumTarihi),
    lifecycle: cowLifecycle(row),
    reproductionStatus: reproductionStatus(row),
    latestMilkLiters: toNumber(row.sutMiktar, null),
    latestMilkAt: isoDate(row.sagimTarihi),
    milkAverage7: toNumber(row.avgSut, null),
    milkCount30: toNumber(row.olcumSayisi30, 0),
    milkTotal30: toNumber(row.toplamSut30, 0),
  };
}

async function loadCow(pool, user, cowId) {
  const result = await scopedRequest(pool, user)
    .input("cowId", sql.NVarChar(50), cleanString(cowId))
    .query(`
      SELECT TOP 1
        I.inekID,
        I.inekQR,
        I.ad,
        I.irk,
        I.kilo,
        I.dogumTarihi,
        I.sonDogurmaTarihi,
        I.firmaID,
        I.anneID,
        I.sonDollenme,
        I.dollenmeSayisi,
        I.tuttuMu,
        I.sonKuruTarihi,
        I.sonSutOlcumTarihi,
        F.firmaAdi,
        Latest.olcumID,
        Latest.sutMiktar,
        Latest.sagimTarihi,
        Latest.makineID,
        Previous.sutMiktar AS oncekiSutMiktar,
        Previous.sagimTarihi AS oncekiSagimTarihi,
        Avg7.avgSut,
        Milk30.olcumSayisi30,
        Milk30.toplamSut30
      FROM inek AS I
      INNER JOIN firmalar AS F ON I.firmaID = F.firmaID
      OUTER APPLY (
        SELECT TOP 1 S.olcumID, S.sutMiktar, S.sagimTarihi, S.makineID
        FROM sutOlcum AS S
        WHERE S.inekID = I.inekID
        ORDER BY S.sagimTarihi DESC, S.olcumID DESC
      ) AS Latest
      OUTER APPLY (
        SELECT P.sutMiktar, P.sagimTarihi
        FROM (
          SELECT
            S2.sutMiktar,
            S2.sagimTarihi,
            ROW_NUMBER() OVER (ORDER BY S2.sagimTarihi DESC, S2.olcumID DESC) AS rn
          FROM sutOlcum AS S2
          WHERE S2.inekID = I.inekID
        ) AS P
        WHERE P.rn = 2
      ) AS Previous
      OUTER APPLY (
        SELECT AVG(CAST(X.sutMiktar AS FLOAT)) AS avgSut
        FROM (
          SELECT TOP 7 S3.sutMiktar
          FROM sutOlcum AS S3
          WHERE S3.inekID = I.inekID
          ORDER BY S3.sagimTarihi DESC, S3.olcumID DESC
        ) AS X
      ) AS Avg7
      OUTER APPLY (
        SELECT
          COUNT(1) AS olcumSayisi30,
          SUM(CAST(S4.sutMiktar AS FLOAT)) AS toplamSut30
        FROM sutOlcum AS S4
        WHERE S4.inekID = I.inekID
          AND S4.sagimTarihi >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
      ) AS Milk30
      WHERE (I.inekQR = @cowId OR CONVERT(NVARCHAR(50), I.inekID) = @cowId)
        AND (@role = 'a' OR (@role = 'c' AND I.firmaID = @firmaID))
    `);

  return result.recordset[0];
}

async function loadSensor(pool, user, code) {
  const result = await scopedRequest(pool, user)
    .input("code", sql.NVarChar(50), cleanString(code))
    .query(`
      SELECT TOP 1
        M.makineID,
        M.makineAd,
        M.hazneHacmi,
        M.QR,
        M.firmaID,
        F.firmaAdi,
        Latest.inekID,
        Latest.inekQR,
        Latest.sutMiktar,
        Latest.sagimTarihi
      FROM sagimMakine AS M
      INNER JOIN firmalar AS F ON M.firmaID = F.firmaID
      OUTER APPLY (
        SELECT TOP 1 S.inekID, I.inekQR, S.sutMiktar, S.sagimTarihi
        FROM sutOlcum AS S
        LEFT JOIN inek AS I ON S.inekID = I.inekID
        WHERE S.makineID = M.makineID
        ORDER BY S.sagimTarihi DESC, S.olcumID DESC
      ) AS Latest
      WHERE (M.QR = @code OR CONVERT(NVARCHAR(50), M.makineID) = @code)
        AND (@role = 'a' OR M.firmaID = @firmaID)
    `);

  return result.recordset[0];
}

function parseShipmentId(code) {
  const normalized = cleanString(code).toUpperCase().replace(/\s+/g, "");
  const prefixed = normalized.match(/^(SHIP|SHP|SEVK|SEVKIYAT)-?(\d+)$/);

  if (prefixed) {
    return Number(prefixed[2]);
  }

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  return null;
}

function shipmentAccessSql() {
  return `
    @role = 'a'
    OR S.olusturanFirmaID = @firmaID
    OR COALESCE(S.tedarikciID, T.tedarikciID) = @firmaID
  `;
}

function shipmentSelectSql() {
  return `
    SELECT
      SV.SevkiyatID,
      SV.SiparisID,
      SV.SevkTarihi,
      SV.BeklenenTeslim,
      SV.Durum,
      S.durum AS siparisDurum,
      S.toplamTutar,
      S.kaynakTipi,
      S.olusturanFirmaID,
      CF.firmaAdi AS ciftciFirmaAdi,
      COALESCE(S.tedarikciID, T.tedarikciID) AS tedarikciID,
      TF.firmaAdi AS tedarikciFirmaAdi,
      Totals.toplamMiktarKg
    FROM Sevkiyatlar AS SV
    INNER JOIN Siparisler AS S ON SV.SiparisID = S.siparisID
    LEFT JOIN Teklifler AS T ON S.teklifID = T.teklifID
    LEFT JOIN firmalar AS CF ON S.olusturanFirmaID = CF.firmaID
    LEFT JOIN firmalar AS TF ON COALESCE(S.tedarikciID, T.tedarikciID) = TF.firmaID
    OUTER APPLY (
      SELECT SUM(CAST(SK.MiktarKg AS FLOAT)) AS toplamMiktarKg
      FROM SevkiyatKalemleri AS SK
      WHERE SK.SevkiyatID = SV.SevkiyatID
    ) AS Totals
  `;
}

function mapShipment(row) {
  return {
    id: Number(row.SevkiyatID),
    code: `SHIP-${row.SevkiyatID}`,
    orderId: row.SiparisID ? Number(row.SiparisID) : undefined,
    shippedAt: isoDate(row.SevkTarihi),
    expectedDeliveryAt: isoDate(row.BeklenenTeslim),
    status: row.Durum,
    orderStatus: row.siparisDurum,
    totalAmount: toNumber(row.toplamTutar, 0),
    totalKg: toNumber(row.toplamMiktarKg, 0),
    farmerCompanyId: row.olusturanFirmaID ? Number(row.olusturanFirmaID) : undefined,
    farmerCompanyName: row.ciftciFirmaAdi || undefined,
    supplierCompanyId: row.tedarikciID ? Number(row.tedarikciID) : undefined,
    supplierCompanyName: row.tedarikciFirmaAdi || undefined,
    sourceType: row.kaynakTipi || undefined,
  };
}

async function loadShipment(pool, user, shipmentId) {
  const result = await scopedRequest(pool, user)
    .input("shipmentId", sql.Int, shipmentId)
    .query(`
      ${shipmentSelectSql()}
      WHERE SV.SevkiyatID = @shipmentId
        AND (${shipmentAccessSql()})
    `);

  return result.recordset[0];
}

function milkQuality(row) {
  const breed = cleanString(row.irk).toLowerCase();
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

async function farmerDashboard(pool, user) {
  const result = await pool
    .request()
    .input("firmaID", sql.Int, user.companyId || 0)
    .query(`
      SELECT
        COUNT(1) AS cowCount,
        SUM(CASE WHEN sonSutOlcumTarihi IS NOT NULL THEN 1 ELSE 0 END) AS measuredCount,
        SUM(CASE WHEN tuttuMu = 'E' THEN 1 ELSE 0 END) AS pregnantCount,
        MAX(sonSutOlcumTarihi) AS latestMilkDate,
        (
          SELECT TOP 1 I2.inekQR
          FROM inek AS I2
          WHERE I2.firmaID = @firmaID
          ORDER BY I2.sonSutOlcumTarihi DESC, I2.inekID ASC
        ) AS primaryCowId
      FROM inek
      WHERE firmaID = @firmaID;

      SELECT TOP 1
        SUM(CAST(S.sutMiktar AS FLOAT)) AS latestMilkLiters,
        S.sagimTarihi AS latestDate
      FROM sutOlcum AS S
      INNER JOIN inek AS I ON S.inekID = I.inekID
      WHERE I.firmaID = @firmaID
      GROUP BY S.sagimTarihi
      ORDER BY S.sagimTarihi DESC;

      SELECT
        COUNT(1) AS lowStockCount,
        SUM(CAST(miktarKg AS FLOAT)) AS stockKg
      FROM FirmaDepo
      WHERE firmaID = @firmaID;

      SELECT COUNT(1) AS activeOrders
      FROM Siparisler
      WHERE olusturanFirmaID = @firmaID
        AND durum IN ('b', 'o');
    `);

  const herd = result.recordsets[0][0] || {};
  const milk = result.recordsets[1][0] || {};
  const stock = result.recordsets[2][0] || {};
  const orders = result.recordsets[3][0] || {};
  const latestLiters = toNumber(milk.latestMilkLiters, 0);
  const latestDate = milk.latestDate || herd.latestMilkDate;

  return {
    title: "Ciftlik Ozeti",
    primaryCowId: herd.primaryCowId || undefined,
    metrics: [
      dashboardMetric("Inek", toNumber(herd.cowCount, 0), "leaf-outline"),
      dashboardMetric("Son Sut", `${latestLiters.toFixed(1)} L`, "water-outline"),
      dashboardMetric("Stok", `${toNumber(stock.stockKg, 0).toFixed(0)} kg`, "cube-outline"),
    ],
    notes: [
      `${toNumber(herd.measuredCount, 0)} hayvanda sut olcum gecmisi var.`,
      `${toNumber(herd.pregnantCount, 0)} hayvan gebe olarak izleniyor.`,
      toNumber(stock.lowStockCount, 0) > 0
        ? `${toNumber(stock.lowStockCount, 0)} yem stogu kritik seviyede.`
        : `Son sut olcumu ${shortDate(latestDate)} tarihinde.`,
      `${toNumber(orders.activeOrders, 0)} aktif siparis takipte.`,
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
      FROM Siparisler AS S
      LEFT JOIN Teklifler AS T ON S.teklifID = T.teklifID
      WHERE COALESCE(S.tedarikciID, T.tedarikciID) = @firmaID
        AND S.durum IN ('b', 'o');

      SELECT COUNT(1) AS activeShipments
      FROM Sevkiyatlar AS SV
      INNER JOIN Siparisler AS S ON SV.SiparisID = S.siparisID
      LEFT JOIN Teklifler AS T ON S.teklifID = T.teklifID
      WHERE COALESCE(S.tedarikciID, T.tedarikciID) = @firmaID
        AND SV.Durum IN ('h', 'y');

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
      dashboardMetric("Siparis", toNumber(orders.activeOrders, 0), "cart-outline"),
      dashboardMetric("Stok", `${toNumber(stock.stockKg, 0).toFixed(0)} kg`, "bar-chart-outline"),
    ],
    notes: [
      `${toNumber(shipments.activeShipments, 0)} aktif sevkiyat izleniyor.`,
      "Sevkiyat QR kodlari SHIP-1 formatinda okunabilir.",
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

    SELECT COUNT(1) AS pendingFeed
    FROM YemMaddeleri
    WHERE durum = 'b';
  `);

  const companies = result.recordsets[0][0] || {};
  const users = result.recordsets[1][0] || {};
  const feed = result.recordsets[2][0] || {};

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
      `${toNumber(feed.pendingFeed, 0)} yem tanimi onay bekliyor.`,
    ],
  };
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

  return suggestions.slice(0, 5);
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

      SELECT COUNT(1) AS pendingReturns
      FROM Iade AS I
      INNER JOIN KabulKalemleri AS KK ON I.KabulKalemID = KK.KabulKalemID
      INNER JOIN Kabul AS K ON KK.KabulID = K.KabulID
      INNER JOIN Sevkiyatlar AS SV ON K.SevkiyatID = SV.SevkiyatID
      INNER JOIN Siparisler AS S ON SV.SiparisID = S.siparisID
      LEFT JOIN Teklifler AS T ON S.teklifID = T.teklifID
      WHERE COALESCE(S.tedarikciID, T.tedarikciID) = @firmaID
        AND I.IadeDurumu = 'b';

      SELECT COUNT(1) AS lowStockCount
      FROM FirmaDepo
      WHERE firmaID = @firmaID AND miktarKg < 100;
    `);

  const offers = result.recordsets[0][0] || {};
  const plans = result.recordsets[1][0] || {};
  const returns = result.recordsets[2][0] || {};
  const stock = result.recordsets[3][0] || {};
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

  if (toNumber(returns.pendingReturns, 0) > 0) {
    addSuggestion(
      suggestions,
      "supplier-returns",
      "Iade bekleyen kabul var",
      `${toNumber(returns.pendingReturns, 0)} iade kaydi onay bekliyor. Kalite ekibiyle kontrol et.`,
      "high",
    );
  }

  if (toNumber(stock.lowStockCount, 0) > 0) {
    addSuggestion(
      suggestions,
      "supplier-low-stock",
      "Stok seviyesi dusuk",
      `${toNumber(stock.lowStockCount, 0)} yem maddesi 100 kg altinda.`,
      "medium",
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

    SELECT COUNT(1) AS passiveUsers
    FROM kullanicilar
    WHERE hesapDurumu <> 'a';
  `);

  const companies = result.recordsets[0][0] || {};
  const feed = result.recordsets[1][0] || {};
  const users = result.recordsets[2][0] || {};
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

  if (toNumber(users.passiveUsers, 0) > 0) {
    addSuggestion(
      suggestions,
      "admin-users",
      "Pasif hesaplari kontrol et",
      `${toNumber(users.passiveUsers, 0)} kullanici hesabi aktif degil.`,
      "low",
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

function shipmentSuggestions(row) {
  const shipment = mapShipment(row);
  const suggestions = [];
  const deliveryAge = daysSince(row.BeklenenTeslim);

  if ((shipment.status === "h" || shipment.status === "y") && deliveryAge !== null && deliveryAge > 0) {
    addSuggestion(
      suggestions,
      `shipment-${shipment.id}-late`,
      "Sevkiyat gecikiyor",
      `${shipment.code} icin beklenen teslim tarihi ${shortDate(row.BeklenenTeslim)} idi.`,
      "high",
    );
  } else if (shipment.status === "t") {
    addSuggestion(
      suggestions,
      `shipment-${shipment.id}-done`,
      "Sevkiyat tamamlandi",
      `${shipment.code} teslim sureci tamamlanmis gorunuyor.`,
      "low",
    );
  } else {
    addSuggestion(
      suggestions,
      `shipment-${shipment.id}-tracking`,
      "Sevkiyat takipte",
      `${shipment.code} icin durum kodu ${shipment.status || "-"}. Beklenen teslim ${shortDate(row.BeklenenTeslim)}.`,
      "medium",
    );
  }

  return suggestions;
}

exports.health = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT DB_NAME() AS databaseName, GETDATE() AS serverTime");
    const row = result.recordset[0] || {};

    return res.json({
      status: "ok",
      database: row.databaseName,
      serverTime: isoDate(row.serverTime),
    });
  } catch (error) {
    return serverError(res, error, "Mobile health check failed:");
  }
};

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

    if (!accountIsActive(row)) {
      return res.status(403).json({
        error: "Hesap aktif degil.",
        hesapDurumu: row.hesapDurumu,
        firmaHesapDurumu: row.firmaHesapDurumu,
      });
    }

    req.mobileUser = normalizeUser(row);
    return next();
  } catch (error) {
    return serverError(res, error, "Mobile auth failed:");
  }
};

exports.login = async (req, res) => {
  const email = cleanString(req.body.email || req.body.eposta).toLowerCase();
  const password = getPassword(req.body);

  if (!email || password === undefined || password === null || String(password) === "") {
    return res.status(400).json({ error: "Email ve sifre gerekli." });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("eposta", sql.NVarChar(100), email)
      .input("sifre", sql.NVarChar(100), String(password))
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
          F.firmaTur,
          F.telefonNo AS firmaTelefonNo,
          F.firmaMail,
          F.firmaAdresi,
          F.bolge,
          F.hesapDurumu AS firmaHesapDurumu,
          Sehir.SehirIlceMahalleAdi AS sehirAdi,
          Ilce.SehirIlceMahalleAdi AS ilceAdi
        FROM kullanicilar AS K
        INNER JOIN firmalar AS F ON K.firmaID = F.firmaID
        LEFT JOIN bolgeler AS Sehir ON F.sehirID = Sehir.ID
        LEFT JOIN bolgeler AS Ilce ON F.ilceID = Ilce.ID
        WHERE LOWER(K.eposta) = @eposta AND K.parola = @sifre
      `);

    const row = result.recordset[0];

    if (!row) {
      return res.status(401).json({ error: "Email veya sifre hatali." });
    }

    if (!accountIsActive(row)) {
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

    if (user.role === ROLE_ADMIN) {
      return res.json(await adminDashboard(pool));
    }

    if (user.role === ROLE_SUPPLIER) {
      return res.json(await supplierDashboard(pool, user));
    }

    return res.json(await farmerDashboard(pool, user));
  } catch (error) {
    return serverError(res, error, "Mobile dashboard failed:");
  }
};

exports.cows = async (req, res) => {
  const user = req.mobileUser;

  if (user.role === ROLE_SUPPLIER) {
    return res.status(403).json({ error: "Tedarikci kullanicisi inek listesine erisemez." });
  }

  const limit = Math.min(Math.max(toInteger(req.query.limit, 50), 1), 200);

  try {
    const pool = await poolPromise;
    const result = await scopedRequest(pool, user).query(`
      SELECT TOP (${limit})
        I.inekID,
        I.inekQR,
        I.ad,
        I.irk,
        I.kilo,
        I.dogumTarihi,
        I.sonDogurmaTarihi,
        I.firmaID,
        I.anneID,
        I.sonDollenme,
        I.dollenmeSayisi,
        I.tuttuMu,
        I.sonKuruTarihi,
        I.sonSutOlcumTarihi,
        F.firmaAdi,
        Latest.sutMiktar,
        Latest.sagimTarihi,
        Avg7.avgSut,
        Milk30.olcumSayisi30,
        Milk30.toplamSut30
      FROM inek AS I
      INNER JOIN firmalar AS F ON I.firmaID = F.firmaID
      OUTER APPLY (
        SELECT TOP 1 S.sutMiktar, S.sagimTarihi
        FROM sutOlcum AS S
        WHERE S.inekID = I.inekID
        ORDER BY S.sagimTarihi DESC, S.olcumID DESC
      ) AS Latest
      OUTER APPLY (
        SELECT AVG(CAST(X.sutMiktar AS FLOAT)) AS avgSut
        FROM (
          SELECT TOP 7 S2.sutMiktar
          FROM sutOlcum AS S2
          WHERE S2.inekID = I.inekID
          ORDER BY S2.sagimTarihi DESC, S2.olcumID DESC
        ) AS X
      ) AS Avg7
      OUTER APPLY (
        SELECT
          COUNT(1) AS olcumSayisi30,
          SUM(CAST(S3.sutMiktar AS FLOAT)) AS toplamSut30
        FROM sutOlcum AS S3
        WHERE S3.inekID = I.inekID
          AND S3.sagimTarihi >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
      ) AS Milk30
      WHERE @role = 'a' OR I.firmaID = @firmaID
      ORDER BY I.sonSutOlcumTarihi DESC, I.inekID ASC
    `);

    const items = result.recordset.map(mapCow);
    return res.json({ items, count: items.length });
  } catch (error) {
    return serverError(res, error, "Mobile cows list failed:");
  }
};

exports.cowDetail = async (req, res) => {
  const cowId = cleanString(req.params.cowId);

  if (!cowId) {
    return res.status(400).json({ error: "Inek QR gerekli." });
  }

  try {
    const pool = await poolPromise;
    const row = await loadCow(pool, req.mobileUser, cowId);

    if (!row) {
      return res.status(404).json({ error: "Inek kaydi bulunamadi." });
    }

    return res.json(mapCow(row));
  } catch (error) {
    return serverError(res, error, "Mobile cow detail failed:");
  }
};

exports.milkValues = async (req, res) => {
  const cowId = cleanString(req.params.cowId);

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
    const previousLiters = toNumber(row.oncekiSutMiktar, null);
    const currentLiters = toNumber(row.sutMiktar, 0);

    return res.json({
      cowId: row.inekQR,
      cowName: cowName(row),
      liters: currentLiters,
      fat: quality.fat,
      protein: quality.protein,
      scc: quality.scc,
      temperature: quality.temperature,
      timestamp: isoDate(row.sagimTarihi),
      previousLiters,
      average7Liters: toNumber(row.avgSut, currentLiters),
      trendLiters: previousLiters === null ? null : Number((currentLiters - previousLiters).toFixed(2)),
      qualitySource: "Sut hacmi MSSQL sutOlcum kaydi; kalite metrikleri hesaplanan mobil sinyaldir.",
    });
  } catch (error) {
    return serverError(res, error, "Mobile milk values failed:");
  }
};

exports.milkHistory = async (req, res) => {
  const cowId = cleanString(req.params.cowId);
  const limit = Math.min(Math.max(toInteger(req.query.limit, 14), 1), 90);

  if (!cowId) {
    return res.status(400).json({ error: "Inek QR gerekli." });
  }

  try {
    const pool = await poolPromise;
    const cow = await loadCow(pool, req.mobileUser, cowId);

    if (!cow) {
      return res.status(404).json({ error: "Inek kaydi bulunamadi." });
    }

    const result = await pool
      .request()
      .input("inekID", sql.Int, cow.inekID)
      .query(`
        SELECT TOP (${limit})
          S.olcumID,
          S.makineID,
          S.sutMiktar,
          S.sagimTarihi
        FROM sutOlcum AS S
        WHERE S.inekID = @inekID
        ORDER BY S.sagimTarihi DESC, S.olcumID DESC
      `);

    return res.json({
      cowId: cow.inekQR,
      items: result.recordset.map((row) => ({
        id: Number(row.olcumID),
        machineId: row.makineID ? Number(row.makineID) : null,
        liters: toNumber(row.sutMiktar, 0),
        timestamp: isoDate(row.sagimTarihi),
      })),
    });
  } catch (error) {
    return serverError(res, error, "Mobile milk history failed:");
  }
};

exports.scanQr = async (req, res) => {
  const code = cleanString(req.body.code || req.body.qr);

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
        data: mapCow(cow),
      });
    }

    const sensor = await loadSensor(pool, user, code);

    if (sensor) {
      return res.json({
        type: "sensor",
        targetId: sensor.QR || String(sensor.makineID),
        message: "Sensor QR kaydi eslendi.",
        info: `${sensor.makineAd || "Sagim makinesi"} - ${sensor.firmaAdi || "Firma"}`,
        data: {
          id: Number(sensor.makineID),
          qr: sensor.QR || null,
          name: sensor.makineAd || null,
          tankCapacity: toNumber(sensor.hazneHacmi, null),
          companyId: sensor.firmaID ? Number(sensor.firmaID) : undefined,
          companyName: sensor.firmaAdi || undefined,
          latestMilkLiters: toNumber(sensor.sutMiktar, null),
          latestMilkAt: isoDate(sensor.sagimTarihi),
          latestCowId: sensor.inekQR || undefined,
        },
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
          data: mapShipment(shipment),
        });
      }
    }

    return res.status(404).json({ error: "QR kaydi bulunamadi." });
  } catch (error) {
    return serverError(res, error, "Mobile QR scan failed:");
  }
};

exports.aiSuggestions = async (req, res) => {
  const targetId = cleanString(req.params.cowId || req.query.targetId);

  if (!targetId) {
    return res.status(400).json({ error: "Hedef kod gerekli." });
  }

  try {
    const pool = await poolPromise;
    const user = req.mobileUser;

    if (targetId.toUpperCase() === "ADMIN" || user.role === ROLE_ADMIN) {
      return res.json(await adminSuggestions(pool));
    }

    if (user.role === ROLE_SUPPLIER) {
      return res.json(await supplierSuggestions(pool, user));
    }

    if (targetId.toUpperCase().startsWith("SHIP")) {
      const shipmentId = parseShipmentId(targetId);
      const shipment = shipmentId ? await loadShipment(pool, user, shipmentId) : null;

      if (!shipment) {
        return res.status(404).json({ error: "Sevkiyat kaydi bulunamadi." });
      }

      return res.json(shipmentSuggestions(shipment));
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

exports.feedStocks = async (req, res) => {
  const limit = Math.min(Math.max(toInteger(req.query.limit, 100), 1), 300);

  try {
    const pool = await poolPromise;
    const result = await scopedRequest(pool, req.mobileUser).query(`
      SELECT TOP (${limit})
        D.depoID,
        D.firmaID,
        F.firmaAdi,
        D.yemID,
        Y.yemAdi,
        Y.birimFiyat,
        D.miktarKg,
        D.sonGuncellemeTarihi
      FROM FirmaDepo AS D
      INNER JOIN firmalar AS F ON D.firmaID = F.firmaID
      INNER JOIN YemMaddeleri AS Y ON D.yemID = Y.yemID
      WHERE @role = 'a' OR D.firmaID = @firmaID
      ORDER BY D.sonGuncellemeTarihi DESC, D.depoID DESC
    `);

    return res.json({
      items: result.recordset.map((row) => ({
        id: Number(row.depoID),
        companyId: Number(row.firmaID),
        companyName: row.firmaAdi,
        feedId: Number(row.yemID),
        feedName: row.yemAdi,
        unitPrice: toNumber(row.birimFiyat, null),
        amountKg: toNumber(row.miktarKg, 0),
        updatedAt: isoDate(row.sonGuncellemeTarihi),
        isLow: toNumber(row.miktarKg, 0) < 100,
      })),
    });
  } catch (error) {
    return serverError(res, error, "Mobile feed stocks failed:");
  }
};

exports.shipments = async (req, res) => {
  const limit = Math.min(Math.max(toInteger(req.query.limit, 50), 1), 200);

  try {
    const pool = await poolPromise;
    const result = await scopedRequest(pool, req.mobileUser).query(`
      SELECT TOP (${limit}) *
      FROM (
        ${shipmentSelectSql()}
        WHERE ${shipmentAccessSql()}
      ) AS ShipmentRows
      ORDER BY ShipmentRows.SevkTarihi DESC, ShipmentRows.SevkiyatID DESC
    `);

    return res.json({
      items: result.recordset.map(mapShipment),
    });
  } catch (error) {
    return serverError(res, error, "Mobile shipments failed:");
  }
};

exports.shipmentDetail = async (req, res) => {
  const shipmentId = parseShipmentId(req.params.shipmentId);

  if (!shipmentId) {
    return res.status(400).json({ error: "Sevkiyat kodu gecersiz." });
  }

  try {
    const pool = await poolPromise;
    const shipment = await loadShipment(pool, req.mobileUser, shipmentId);

    if (!shipment) {
      return res.status(404).json({ error: "Sevkiyat kaydi bulunamadi." });
    }

    const items = await pool
      .request()
      .input("shipmentId", sql.Int, shipmentId)
      .query(`
        SELECT
          SK.SevkiyatKalemID,
          SK.YemID,
          Y.yemAdi,
          SK.MiktarKg
        FROM SevkiyatKalemleri AS SK
        INNER JOIN YemMaddeleri AS Y ON SK.YemID = Y.yemID
        WHERE SK.SevkiyatID = @shipmentId
        ORDER BY SK.SevkiyatKalemID
      `);

    return res.json({
      ...mapShipment(shipment),
      items: items.recordset.map((row) => ({
        id: Number(row.SevkiyatKalemID),
        feedId: Number(row.YemID),
        feedName: row.yemAdi,
        amountKg: toNumber(row.MiktarKg, 0),
      })),
    });
  } catch (error) {
    return serverError(res, error, "Mobile shipment detail failed:");
  }
};
