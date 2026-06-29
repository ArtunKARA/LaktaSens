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

function orderStatusName(status) {
  if (status === "b") {
    return "Beklemede";
  }

  if (status === "o") {
    return "Onaylandi";
  }

  if (status === "i") {
    return "Iptal";
  }

  if (status === "r") {
    return "Reddedildi";
  }

  if (status === "t") {
    return "Tamamlandi";
  }

  return "Bilinmiyor";
}

function offerStatusName(status) {
  if (status === "b") {
    return "Beklemede";
  }

  if (status === "s") {
    return "Secildi";
  }

  if (status === "r") {
    return "Reddedildi";
  }

  if (status === "c") {
    return "Geri cekildi";
  }

  return "Bilinmiyor";
}

function auctionStatusName(status) {
  if (status === "a") {
    return "Acik";
  }

  if (status === "k") {
    return "Kapali";
  }

  if (status === "t") {
    return "Tamamlandi";
  }

  if (status === "i") {
    return "Iptal";
  }

  return "Bilinmiyor";
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

function positiveNumber(value, fallback = null) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
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

function roleForbidden(res, expectedRole) {
  const label = expectedRole === ROLE_ADMIN ? "Admin" : expectedRole === ROLE_SUPPLIER ? "Tedarikci" : "Ciftci";
  return res.status(403).json({ error: `${label} yetkisi gerekli.` });
}

function ensureRole(req, res, expectedRole) {
  if (req.mobileUser?.role !== expectedRole) {
    roleForbidden(res, expectedRole);
    return false;
  }

  return true;
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

function milkingJobStatusName(status) {
  if (status === "a") {
    return "active";
  }

  if (status === "p") {
    return "processing";
  }

  if (status === "b") {
    return "ready";
  }

  if (status === "t") {
    return "completed";
  }

  if (status === "i") {
    return "canceled";
  }

  return "unknown";
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

let milkingJobTableReady = false;

async function ensureMilkingJobTable(pool) {
  if (milkingJobTableReady) {
    return;
  }

  await pool.request().query(`
    IF OBJECT_ID(N'dbo.SagimIsEmri', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SagimIsEmri (
        isEmriID INT IDENTITY(1,1) PRIMARY KEY,
        sensorQR NVARCHAR(50) NOT NULL,
        makineID INT NULL,
        inekID INT NOT NULL,
        firmaID INT NOT NULL,
        kullaniciID INT NULL,
        durum CHAR(1) NOT NULL CONSTRAINT DF_SagimIsEmri_durum DEFAULT('a'),
        olusturmaTarihi DATETIME2 NOT NULL CONSTRAINT DF_SagimIsEmri_olusturma DEFAULT SYSUTCDATETIME(),
        baslamaTarihi DATETIME2 NULL,
        sonYoklamaTarihi DATETIME2 NULL,
        kapanmaTarihi DATETIME2 NULL,
        sutMiktar FLOAT NULL,
        sicaklik FLOAT NULL,
        aciklama NVARCHAR(250) NULL,
        CONSTRAINT FK_SagimIsEmri_sagimMakine FOREIGN KEY (makineID) REFERENCES sagimMakine(makineID),
        CONSTRAINT FK_SagimIsEmri_inek FOREIGN KEY (inekID) REFERENCES inek(inekID),
        CONSTRAINT FK_SagimIsEmri_firma FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID),
        CONSTRAINT FK_SagimIsEmri_kullanici FOREIGN KEY (kullaniciID) REFERENCES kullanicilar(kullaniciID)
      );

      CREATE INDEX IX_SagimIsEmri_sensor_durum ON dbo.SagimIsEmri(sensorQR, durum, olusturmaTarihi DESC);
      CREATE INDEX IX_SagimIsEmri_inek_durum ON dbo.SagimIsEmri(inekID, durum, olusturmaTarihi DESC);
    END
  `);

  milkingJobTableReady = true;
}

function mapMilkingJob(row) {
  if (!row) {
    return null;
  }

  const status = milkingJobStatusName(row.durum);

  return {
    id: Number(row.isEmriID),
    sensorQr: row.sensorQR,
    machineId: row.makineID ? Number(row.makineID) : null,
    machineName: row.makineAd || null,
    cowId: row.inekQR,
    cowInternalId: row.inekID ? Number(row.inekID) : undefined,
    cowName: cowName(row),
    companyId: row.firmaID ? Number(row.firmaID) : undefined,
    companyName: row.firmaAdi || undefined,
    userId: row.kullaniciID ? Number(row.kullaniciID) : undefined,
    status,
    statusCode: row.durum,
    createdAt: isoDate(row.olusturmaTarihi),
    startedAt: isoDate(row.baslamaTarihi),
    lastSeenAt: isoDate(row.sonYoklamaTarihi),
    completedAt: isoDate(row.kapanmaTarihi),
    liters: toNumber(row.sutMiktar, null),
    temperature: toNumber(row.sicaklik, null),
    note: row.aciklama || undefined,
    isOpen: status === "active" || status === "processing" || status === "ready",
  };
}

function milkingJobSelectSql() {
  return `
    SELECT
      J.isEmriID,
      J.sensorQR,
      J.makineID,
      J.inekID,
      J.firmaID,
      J.kullaniciID,
      J.durum,
      J.olusturmaTarihi,
      J.baslamaTarihi,
      J.sonYoklamaTarihi,
      J.kapanmaTarihi,
      J.sutMiktar,
      J.sicaklik,
      J.aciklama,
      I.inekQR,
      I.ad,
      I.irk,
      M.makineAd,
      F.firmaAdi
    FROM dbo.SagimIsEmri AS J
    INNER JOIN inek AS I ON J.inekID = I.inekID
    LEFT JOIN sagimMakine AS M ON J.makineID = M.makineID
    INNER JOIN firmalar AS F ON J.firmaID = F.firmaID
  `;
}

async function loadMilkingJob(pool, user, jobId) {
  await ensureMilkingJobTable(pool);

  const result = await scopedRequest(pool, user)
    .input("jobId", sql.Int, toInteger(jobId, 0))
    .query(`
      ${milkingJobSelectSql()}
      WHERE J.isEmriID = @jobId
        AND (@role = 'a' OR J.firmaID = @firmaID)
    `);

  return result.recordset[0];
}

async function loadSensorForDevice(pool, code) {
  const result = await pool
    .request()
    .input("code", sql.NVarChar(50), cleanString(code))
    .query(`
      SELECT TOP 1
        M.makineID,
        M.makineAd,
        M.hazneHacmi,
        M.QR,
        M.firmaID,
        F.firmaAdi
      FROM sagimMakine AS M
      INNER JOIN firmalar AS F ON M.firmaID = F.firmaID
      WHERE M.QR = @code OR CONVERT(NVARCHAR(50), M.makineID) = @code
    `);

  return result.recordset[0];
}

function mapSensor(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.makineID),
    qr: row.QR || null,
    name: row.makineAd || null,
    tankCapacity: toNumber(row.hazneHacmi, null),
    companyId: row.firmaID ? Number(row.firmaID) : undefined,
    companyName: row.firmaAdi || undefined,
    latestMilkLiters: toNumber(row.sutMiktar, null),
    latestMilkAt: isoDate(row.sagimTarihi),
    latestCowId: row.inekQR || undefined,
  };
}

async function loadSensorById(pool, user, sensorId) {
  const result = await scopedRequest(pool, user)
    .input("sensorId", sql.Int, toInteger(sensorId, 0))
    .query(`
      SELECT TOP 1
        M.makineID,
        M.makineAd,
        M.hazneHacmi,
        M.QR,
        M.firmaID,
        F.firmaAdi,
        Latest.inekQR,
        Latest.sutMiktar,
        Latest.sagimTarihi
      FROM sagimMakine AS M
      INNER JOIN firmalar AS F ON M.firmaID = F.firmaID
      OUTER APPLY (
        SELECT TOP 1 I.inekQR, S.sutMiktar, S.sagimTarihi
        FROM sutOlcum AS S
        LEFT JOIN inek AS I ON S.inekID = I.inekID
        WHERE S.makineID = M.makineID
        ORDER BY S.sagimTarihi DESC, S.olcumID DESC
      ) AS Latest
      WHERE M.makineID = @sensorId
        AND (@role = 'a' OR M.firmaID = @firmaID)
    `);

  return result.recordset[0];
}

async function loadActiveMilkingJobForSensor(pool, sensorQr) {
  await ensureMilkingJobTable(pool);

  const result = await pool
    .request()
    .input("sensorQr", sql.NVarChar(50), cleanString(sensorQr))
    .query(`
      ${milkingJobSelectSql().replace("SELECT", "SELECT TOP 1")}
      WHERE J.sensorQR = @sensorQr
        AND J.durum IN ('a', 'p')
      ORDER BY J.olusturmaTarihi DESC, J.isEmriID DESC
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

exports.createMilkingJob = async (req, res) => {
  if (![ROLE_FARMER, ROLE_ADMIN].includes(req.mobileUser?.role)) {
    return roleForbidden(res, ROLE_FARMER);
  }

  const body = req.body || {};
  const cowId = cleanString(body.cowId || body.inekQR || body.cowQr);
  const sensorQr = cleanString(
    body.sensorQr || body.sensorQR || body.SensorQR || body.sensorCode || body.machineQr,
  );

  if (!cowId || !sensorQr) {
    return res.status(400).json({ error: "Inek QR ve sensor QR gerekli." });
  }

  try {
    const pool = await poolPromise;
    const user = req.mobileUser;
    const cow = await loadCow(pool, user, cowId);

    if (!cow) {
      return res.status(404).json({ error: "Inek kaydi bulunamadi." });
    }

    const sensor = await loadSensor(pool, user, sensorQr);

    if (!sensor) {
      return res.status(404).json({ error: "Sensor veya sagim makinesi kaydi bulunamadi." });
    }

    if (Number(sensor.firmaID) !== Number(cow.firmaID)) {
      return res.status(409).json({ error: "Sensor ve inek ayni firmaya ait olmali." });
    }

    await ensureMilkingJobTable(pool);

    await pool
      .request()
      .input("sensorQr", sql.NVarChar(50), sensor.QR || sensorQr)
      .input("cowId", sql.Int, Number(cow.inekID))
      .query(`
        UPDATE dbo.SagimIsEmri
        SET durum = 'i',
            kapanmaTarihi = SYSUTCDATETIME(),
            aciklama = COALESCE(aciklama, N'Yeni is emri baslatildigi icin kapatildi.')
        WHERE durum IN ('a', 'p')
          AND (sensorQR = @sensorQr OR inekID = @cowId)
      `);

    const insertResult = await pool
      .request()
      .input("sensorQr", sql.NVarChar(50), sensor.QR || sensorQr)
      .input("makineID", sql.Int, Number(sensor.makineID))
      .input("inekID", sql.Int, Number(cow.inekID))
      .input("firmaID", sql.Int, Number(cow.firmaID))
      .input("kullaniciID", sql.Int, Number(user.id))
      .query(`
        INSERT INTO dbo.SagimIsEmri (sensorQR, makineID, inekID, firmaID, kullaniciID, durum)
        OUTPUT INSERTED.isEmriID
        VALUES (@sensorQr, @makineID, @inekID, @firmaID, @kullaniciID, 'a')
      `);

    const jobId = insertResult.recordset[0]?.isEmriID;
    const job = await loadMilkingJob(pool, user, jobId);

    return res.status(201).json({
      message: "Sagim is emri olusturuldu. Sensor acik is emrini sorgulayabilir.",
      job: mapMilkingJob(job),
    });
  } catch (error) {
    return serverError(res, error, "Mobile milking job create failed:");
  }
};

exports.sensors = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await scopedRequest(pool, req.mobileUser).query(`
      SELECT
        M.makineID,
        M.makineAd,
        M.hazneHacmi,
        M.QR,
        M.firmaID,
        F.firmaAdi,
        Latest.inekQR,
        Latest.sutMiktar,
        Latest.sagimTarihi
      FROM sagimMakine AS M
      INNER JOIN firmalar AS F ON M.firmaID = F.firmaID
      OUTER APPLY (
        SELECT TOP 1 I.inekQR, S.sutMiktar, S.sagimTarihi
        FROM sutOlcum AS S
        LEFT JOIN inek AS I ON S.inekID = I.inekID
        WHERE S.makineID = M.makineID
        ORDER BY S.sagimTarihi DESC, S.olcumID DESC
      ) AS Latest
      WHERE @role = 'a' OR M.firmaID = @firmaID
      ORDER BY M.makineID DESC
    `);

    const items = result.recordset.map(mapSensor);
    return res.json({ items, count: items.length });
  } catch (error) {
    return serverError(res, error, "Mobile sensors list failed:");
  }
};

exports.createSensor = async (req, res) => {
  if (![ROLE_FARMER, ROLE_ADMIN].includes(req.mobileUser?.role)) {
    return roleForbidden(res, ROLE_FARMER);
  }

  const body = req.body || {};
  const name = cleanString(body.name || body.makineAd || body.sensorName);
  const qr = cleanString(body.qr || body.QR || body.sensorQr || body.sensorQR);
  const tankCapacity = positiveNumber(body.tankCapacity || body.hazneHacmi, 0);
  const companyId = req.mobileUser.role === ROLE_ADMIN
    ? toInteger(body.companyId || body.firmaID, req.mobileUser.companyId || 0)
    : toInteger(req.mobileUser.companyId, 0);

  if (!name) {
    return res.status(400).json({ error: "Sensor adi gerekli." });
  }

  if (!qr) {
    return res.status(400).json({ error: "Sensor QR gerekli." });
  }

  if (!companyId) {
    return res.status(400).json({ error: "Firma bilgisi bulunamadi." });
  }

  try {
    const pool = await poolPromise;
    const duplicate = await pool
      .request()
      .input("qr", sql.NVarChar(50), qr)
      .query(`
        SELECT TOP 1 makineID
        FROM sagimMakine
        WHERE QR = @qr
      `);

    if (duplicate.recordset.length) {
      return res.status(409).json({ error: "Bu QR ile kayitli sensor zaten var." });
    }

    const insertResult = await pool
      .request()
      .input("name", sql.NVarChar(50), name)
      .input("capacity", sql.Float, tankCapacity)
      .input("qr", sql.NVarChar(50), qr)
      .input("companyId", sql.Int, companyId)
      .query(`
        INSERT INTO sagimMakine (makineAd, hazneHacmi, QR, firmaID)
        OUTPUT INSERTED.makineID
        VALUES (@name, @capacity, @qr, @companyId)
      `);

    const sensor = await loadSensorById(pool, req.mobileUser, insertResult.recordset[0]?.makineID);

    return res.status(201).json({
      message: "Sagim sensoru eklendi.",
      sensor: mapSensor(sensor),
    });
  } catch (error) {
    return serverError(res, error, "Mobile sensor create failed:");
  }
};

exports.milkingJob = async (req, res) => {
  const jobId = toInteger(req.params.jobId, 0);

  if (!jobId) {
    return res.status(400).json({ error: "Is emri ID gerekli." });
  }

  try {
    const pool = await poolPromise;
    const job = await loadMilkingJob(pool, req.mobileUser, jobId);

    if (!job) {
      return res.status(404).json({ error: "Is emri bulunamadi." });
    }

    return res.json({ job: mapMilkingJob(job) });
  } catch (error) {
    return serverError(res, error, "Mobile milking job read failed:");
  }
};

exports.cancelMilkingJob = async (req, res) => {
  const jobId = toInteger(req.params.jobId, 0);

  if (!jobId) {
    return res.status(400).json({ error: "Is emri ID gerekli." });
  }

  try {
    const pool = await poolPromise;
    const job = await loadMilkingJob(pool, req.mobileUser, jobId);

    if (!job) {
      return res.status(404).json({ error: "Is emri bulunamadi." });
    }

    if (!["a", "p"].includes(job.durum)) {
      return res.json({ job: mapMilkingJob(job), message: "Is emri zaten kapali." });
    }

    await pool
      .request()
      .input("jobId", sql.Int, jobId)
      .query(`
        UPDATE dbo.SagimIsEmri
        SET durum = 'i',
            kapanmaTarihi = SYSUTCDATETIME(),
            aciklama = N'Mobil uygulama tarafindan iptal edildi.'
        WHERE isEmriID = @jobId
      `);

    const updated = await loadMilkingJob(pool, req.mobileUser, jobId);
    return res.json({ job: mapMilkingJob(updated), message: "Is emri iptal edildi." });
  } catch (error) {
    return serverError(res, error, "Mobile milking job cancel failed:");
  }
};

exports.finishMilkingJob = async (req, res) => {
  const jobId = toInteger(req.params.jobId, 0);
  const body = req.body || {};
  const liters = positiveNumber(body.liters || body.sutMiktar || body.milkLiters, null);
  const temperature = positiveNumber(body.temperature || body.sicaklik, null);

  if (!jobId) {
    return res.status(400).json({ error: "Is emri ID gerekli." });
  }

  try {
    const pool = await poolPromise;
    const job = await loadMilkingJob(pool, req.mobileUser, jobId);

    if (!job) {
      return res.status(404).json({ error: "Is emri bulunamadi." });
    }

    if (job.durum === "t") {
      return res.json({ job: mapMilkingJob(job), message: "Is emri zaten veritabanina gonderilmis." });
    }

    if (job.durum === "i") {
      return res.status(409).json({ error: "Iptal edilen is emri bitirilemez." });
    }

    await pool
      .request()
      .input("jobId", sql.Int, jobId)
      .input("liters", sql.Float, liters)
      .input("temperature", sql.Float, temperature)
      .query(`
        UPDATE dbo.SagimIsEmri
        SET durum = 'b',
            kapanmaTarihi = COALESCE(kapanmaTarihi, SYSUTCDATETIME()),
            sonYoklamaTarihi = SYSUTCDATETIME(),
            sutMiktar = COALESCE(@liters, sutMiktar),
            sicaklik = COALESCE(@temperature, sicaklik),
            aciklama = N'Olcum mobil uygulama tarafindan bitirildi. Gonderim bekleniyor.'
        WHERE isEmriID = @jobId
      `);

    const updated = await loadMilkingJob(pool, req.mobileUser, jobId);
    return res.json({ job: mapMilkingJob(updated), message: "Olcum bitirildi. Gonderim bekleniyor." });
  } catch (error) {
    return serverError(res, error, "Mobile milking job finish failed:");
  }
};

exports.submitMilkingJob = async (req, res) => {
  const jobId = toInteger(req.params.jobId, 0);

  if (!jobId) {
    return res.status(400).json({ error: "Is emri ID gerekli." });
  }

  try {
    const pool = await poolPromise;
    const job = await loadMilkingJob(pool, req.mobileUser, jobId);

    if (!job) {
      return res.status(404).json({ error: "Is emri bulunamadi." });
    }

    if (job.durum === "t") {
      return res.json({ job: mapMilkingJob(job), message: "Is emri daha once gonderilmis." });
    }

    if (job.durum !== "b") {
      return res.status(409).json({ error: "Gondermeden once olcumu bitirin." });
    }

    const liters = positiveNumber(job.sutMiktar, null);

    if (liters === null) {
      return res.status(400).json({ error: "Gonderilecek sut miktari bulunamadi." });
    }

    const insertResult = await pool
      .request()
      .input("makineID", sql.Int, Number(job.makineID))
      .input("sutMiktar", sql.Float, liters)
      .input("inekID", sql.Int, Number(job.inekID))
      .query(`
        INSERT INTO sutOlcum (makineID, sutMiktar, inekID, sagimTarihi)
        OUTPUT INSERTED.olcumID
        VALUES (@makineID, @sutMiktar, @inekID, CAST(GETDATE() AS DATE))
      `);

    await pool
      .request()
      .input("inekID", sql.Int, Number(job.inekID))
      .query(`
        UPDATE inek
        SET sonSutOlcumTarihi = CAST(GETDATE() AS DATE)
        WHERE inekID = @inekID
      `);

    await pool
      .request()
      .input("jobId", sql.Int, jobId)
      .query(`
        UPDATE dbo.SagimIsEmri
        SET durum = 't',
            kapanmaTarihi = COALESCE(kapanmaTarihi, SYSUTCDATETIME()),
            sonYoklamaTarihi = SYSUTCDATETIME(),
            aciklama = N'Olcum mobil uygulama tarafindan veritabanina gonderildi.'
        WHERE isEmriID = @jobId
      `);

    const updated = await loadMilkingJob(pool, req.mobileUser, jobId);
    return res.json({
      message: "Olcum veritabanina kaydedildi.",
      measurementId: insertResult.recordset[0]?.olcumID,
      job: mapMilkingJob(updated),
    });
  } catch (error) {
    return serverError(res, error, "Mobile milking job submit failed:");
  }
};

exports.sensorOnline = async (req, res) => {
  const body = req.body || {};
  const sensorQr = cleanString(body.sensorQr || body.sensorQR || body.SensorQR || req.query.sensorQr);

  if (!sensorQr) {
    return res.status(400).json({ error: "Sensor QR gerekli." });
  }

  try {
    const pool = await poolPromise;
    const sensor = await loadSensorForDevice(pool, sensorQr);

    if (!sensor) {
      return res.status(404).json({ error: "Sensor kaydi bulunamadi." });
    }

    const job = await loadActiveMilkingJobForSensor(pool, sensor.QR || sensorQr);

    return res.json({
      online: true,
      sensor: {
        id: Number(sensor.makineID),
        qr: sensor.QR || sensorQr,
        name: sensor.makineAd || null,
        companyId: sensor.firmaID ? Number(sensor.firmaID) : undefined,
        companyName: sensor.firmaAdi || undefined,
      },
      hasJob: Boolean(job),
      job: mapMilkingJob(job),
    });
  } catch (error) {
    return serverError(res, error, "Sensor online failed:");
  }
};

exports.sensorActiveJob = async (req, res) => {
  const body = req.body || {};
  const sensorQr = cleanString(body.sensorQr || body.sensorQR || body.SensorQR || req.query.sensorQr);

  if (!sensorQr) {
    return res.status(400).json({ error: "Sensor QR gerekli." });
  }

  try {
    const pool = await poolPromise;
    const sensor = await loadSensorForDevice(pool, sensorQr);

    if (!sensor) {
      return res.status(404).json({ error: "Sensor kaydi bulunamadi." });
    }

    const job = await loadActiveMilkingJobForSensor(pool, sensor.QR || sensorQr);

    if (!job) {
      return res.json({ hasJob: false, message: "Acik is emri yok." });
    }

    await pool
      .request()
      .input("jobId", sql.Int, Number(job.isEmriID))
      .query(`
        UPDATE dbo.SagimIsEmri
        SET durum = CASE WHEN durum = 'a' THEN 'p' ELSE durum END,
            baslamaTarihi = COALESCE(baslamaTarihi, SYSUTCDATETIME()),
            sonYoklamaTarihi = SYSUTCDATETIME()
        WHERE isEmriID = @jobId
      `);

    const updated = await loadActiveMilkingJobForSensor(pool, sensor.QR || sensorQr);

    return res.json({
      hasJob: true,
      message: "Acik is emri bulundu.",
      job: mapMilkingJob(updated),
    });
  } catch (error) {
    return serverError(res, error, "Sensor active job failed:");
  }
};

exports.sensorMeasurement = async (req, res) => {
  const body = req.body || {};
  const sensorQr = cleanString(body.sensorQr || body.sensorQR || body.SensorQR || req.query.sensorQr);
  const jobId = toInteger(body.jobId || body.isEmriID || req.query.jobId, 0);
  const liters = positiveNumber(
    body.liters || body.milkLiters || body.sutMiktar || body.SutMiktar || body.Miktar,
  );
  const temperature = positiveNumber(body.temperature || body.sicaklik || body.Sicaklik, null);

  if (!sensorQr) {
    return res.status(400).json({ error: "Sensor QR gerekli." });
  }

  if (liters === null) {
    return res.status(400).json({ error: "Gecerli sut miktari gerekli." });
  }

  try {
    const pool = await poolPromise;
    const sensor = await loadSensorForDevice(pool, sensorQr);

    if (!sensor) {
      return res.status(404).json({ error: "Sensor kaydi bulunamadi." });
    }

    await ensureMilkingJobTable(pool);

    let job;

    if (jobId) {
      const result = await pool
        .request()
        .input("jobId", sql.Int, jobId)
        .input("sensorQr", sql.NVarChar(50), sensor.QR || sensorQr)
        .query(`
          ${milkingJobSelectSql()}
          WHERE J.isEmriID = @jobId
            AND J.sensorQR = @sensorQr
            AND J.durum IN ('a', 'p')
        `);
      job = result.recordset[0];
    } else {
      job = await loadActiveMilkingJobForSensor(pool, sensor.QR || sensorQr);
    }

    if (!job) {
      return res.status(404).json({ error: "Sensor icin acik is emri bulunamadi." });
    }

    await pool
      .request()
      .input("jobId", sql.Int, Number(job.isEmriID))
      .input("liters", sql.Float, liters)
      .input("temperature", sql.Float, temperature)
      .query(`
        UPDATE dbo.SagimIsEmri
        SET durum = CASE WHEN durum = 'a' THEN 'p' ELSE durum END,
            sonYoklamaTarihi = SYSUTCDATETIME(),
            baslamaTarihi = COALESCE(baslamaTarihi, SYSUTCDATETIME()),
            sutMiktar = @liters,
            sicaklik = @temperature,
            aciklama = N'Olcum sensor tarafindan guncellendi.'
        WHERE isEmriID = @jobId
      `);

    const updated = await pool
      .request()
      .input("jobId", sql.Int, Number(job.isEmriID))
      .query(`
        ${milkingJobSelectSql()}
        WHERE J.isEmriID = @jobId
      `);

    return res.json({
      message: "Olcum is emrine yazildi. Mobil onay bekleniyor.",
      job: mapMilkingJob(updated.recordset[0]),
    });
  } catch (error) {
    return serverError(res, error, "Sensor measurement failed:");
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

exports.adminApplications = async (req, res) => {
  if (!ensureRole(req, res, ROLE_ADMIN)) {
    return undefined;
  }

  const limit = Math.min(Math.max(toInteger(req.query.limit, 80), 1), 200);

  try {
    const pool = await poolPromise;
    const [companyResult, feedResult] = await Promise.all([
      pool.request().query(`
        SELECT TOP (${limit})
          F.firmaID,
          F.firmaAdi,
          F.firmaTur,
          F.telefonNo,
          F.firmaMail,
          F.firmaAdresi,
          F.hesapDurumu,
          S.SehirIlceMahalleAdi AS sehirAdi,
          I.SehirIlceMahalleAdi AS ilceAdi,
          COUNT(R.redEdilenBaşvurularID) AS redSayisi,
          (
            SELECT TOP 1 R2.redNedeni
            FROM [RedEdilenBaşvurularFirmalar] AS R2
            WHERE R2.firmaID = F.firmaID
            ORDER BY R2.redTarihi DESC, R2.redEdilenBaşvurularID DESC
          ) AS sonRedNedeni
        FROM firmalar AS F
        LEFT JOIN [RedEdilenBaşvurularFirmalar] AS R ON F.firmaID = R.firmaID
        LEFT JOIN bolgeler AS S ON F.sehirID = S.ID
        LEFT JOIN bolgeler AS I ON F.ilceID = I.ID
        WHERE F.hesapDurumu = 'b'
          AND F.firmaTur IN ('c', 't')
        GROUP BY
          F.firmaID, F.firmaAdi, F.firmaTur, F.telefonNo, F.firmaMail,
          F.firmaAdresi, F.hesapDurumu, S.SehirIlceMahalleAdi, I.SehirIlceMahalleAdi
        ORDER BY F.firmaID DESC
      `),
      pool.request().query(`
        SELECT TOP (${limit})
          Y.yemID,
          Y.yemAdi,
          Y.ozelYem,
          Y.durum,
          Y.yemFirmaID,
          Y.birimFiyat,
          Y.minSiparisKg,
          Y.maxSiparisKg,
          Y.aciklama,
          F.firmaAdi,
          COUNT(R.redEdilenBaşvurularID) AS redSayisi,
          (
            SELECT TOP 1 R2.redNedeni
            FROM [RedEdilenBaşvurularYem] AS R2
            WHERE R2.yemID = Y.yemID
            ORDER BY R2.redTarihi DESC, R2.redEdilenBaşvurularID DESC
          ) AS sonRedNedeni
        FROM YemMaddeleri AS Y
        LEFT JOIN firmalar AS F ON Y.yemFirmaID = F.firmaID
        LEFT JOIN [RedEdilenBaşvurularYem] AS R ON Y.yemID = R.yemID
        WHERE Y.durum = 'b'
        GROUP BY
          Y.yemID, Y.yemAdi, Y.ozelYem, Y.durum, Y.yemFirmaID,
          Y.birimFiyat, Y.minSiparisKg, Y.maxSiparisKg, Y.aciklama, F.firmaAdi
        ORDER BY Y.yemID DESC
      `),
    ]);

    const companyItems = companyResult.recordset.map((row) => ({
      id: `company-${row.firmaID}`,
      type: "company",
      targetId: Number(row.firmaID),
      title: row.firmaAdi,
      subtitle: companyTypeName(row.firmaTur),
      status: row.hesapDurumu,
      statusName: statusName(row.hesapDurumu),
      companyType: row.firmaTur,
      companyTypeName: companyTypeName(row.firmaTur),
      phone: row.telefonNo || undefined,
      email: row.firmaMail || undefined,
      address: row.firmaAdresi || undefined,
      city: row.sehirAdi || undefined,
      district: row.ilceAdi || undefined,
      rejectedBefore: toInteger(row.redSayisi, 0),
      rejectedReason: row.sonRedNedeni || undefined,
    }));

    const feedItems = feedResult.recordset.map((row) => ({
      id: `feed-${row.yemID}`,
      type: "feed",
      targetId: Number(row.yemID),
      title: row.yemAdi,
      subtitle: row.firmaAdi || (row.ozelYem ? "Ozel yem" : "Standart yem"),
      status: row.durum,
      statusName: statusName(row.durum),
      companyId: row.yemFirmaID ? Number(row.yemFirmaID) : undefined,
      companyName: row.firmaAdi || undefined,
      isCustomFeed: Boolean(row.ozelYem),
      unitPrice: toNumber(row.birimFiyat, null),
      minOrderKg: toNumber(row.minSiparisKg, null),
      maxOrderKg: toNumber(row.maxSiparisKg, null),
      description: row.aciklama || undefined,
      rejectedBefore: toInteger(row.redSayisi, 0),
      rejectedReason: row.sonRedNedeni || undefined,
    }));

    return res.json({
      items: [...companyItems, ...feedItems],
    });
  } catch (error) {
    return serverError(res, error, "Mobile admin applications failed:");
  }
};

exports.adminApplicationAction = async (req, res) => {
  if (!ensureRole(req, res, ROLE_ADMIN)) {
    return undefined;
  }

  const type = cleanString(req.params.type).toLowerCase();
  const targetId = toInteger(req.params.id, 0);
  const action = cleanString(req.body?.action).toLowerCase();
  const reason = cleanString(req.body?.reason) || "Mobil uygulama uzerinden reddedildi.";

  if (!["company", "feed"].includes(type) || !targetId) {
    return res.status(400).json({ error: "Basvuru tipi veya kodu gecersiz." });
  }

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "Aksiyon approve veya reject olmali." });
  }

  let transaction;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    if (type === "company") {
      if (action === "approve") {
        const updateResult = await transaction
          .request()
          .input("targetId", sql.Int, targetId)
          .query(`
            UPDATE firmalar
            SET hesapDurumu = 'a'
            WHERE firmaID = @targetId AND hesapDurumu = 'b';

            UPDATE kullanicilar
            SET hesapDurumu = 'a'
            WHERE firmaID = @targetId AND hesapFirmaYetkisi = 'a';
          `);

        if (updateResult.rowsAffected[0] === 0) {
          await transaction.rollback();
          return res.status(404).json({ error: "Onaylanacak firma basvurusu bulunamadi." });
        }
      } else {
        const updateResult = await transaction
          .request()
          .input("targetId", sql.Int, targetId)
          .input("userId", sql.Int, Number(req.mobileUser.id))
          .input("reason", sql.NVarChar(300), reason)
          .query(`
            UPDATE firmalar
            SET hesapDurumu = 'p'
            WHERE firmaID = @targetId AND hesapDurumu = 'b';

            INSERT INTO [RedEdilenBaşvurularFirmalar] (firmaID, kullaniciID, redNedeni, redTarihi)
            VALUES (@targetId, @userId, @reason, CAST(GETDATE() AS DATE));

            UPDATE kullanicilar
            SET hesapDurumu = 'p'
            WHERE firmaID = @targetId;
          `);

        if (updateResult.rowsAffected[0] === 0) {
          await transaction.rollback();
          return res.status(404).json({ error: "Reddedilecek firma basvurusu bulunamadi." });
        }
      }
    } else if (action === "approve") {
      const updateResult = await transaction
        .request()
        .input("targetId", sql.Int, targetId)
        .query(`
          UPDATE YemMaddeleri
          SET durum = 'a'
          WHERE yemID = @targetId AND durum = 'b';
        `);

      if (updateResult.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: "Onaylanacak yem basvurusu bulunamadi." });
      }
    } else {
      const updateResult = await transaction
        .request()
        .input("targetId", sql.Int, targetId)
        .input("userId", sql.Int, Number(req.mobileUser.id))
        .input("reason", sql.NVarChar(300), reason)
        .query(`
          UPDATE YemMaddeleri
          SET durum = 'p'
          WHERE yemID = @targetId AND durum = 'b';

          INSERT INTO [RedEdilenBaşvurularYem] (yemID, kullaniciID, redNedeni, redTarihi)
          VALUES (@targetId, @userId, @reason, CAST(GETDATE() AS DATE));
        `);

      if (updateResult.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: "Reddedilecek yem basvurusu bulunamadi." });
      }
    }

    await transaction.commit();

    return res.json({
      message: action === "approve" ? "Basvuru onaylandi." : "Basvuru reddedildi.",
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch {
        // Transaction may already be closed.
      }
    }

    return serverError(res, error, "Mobile admin application action failed:");
  }
};

exports.supplierOrders = async (req, res) => {
  if (!ensureRole(req, res, ROLE_SUPPLIER)) {
    return undefined;
  }

  const limit = Math.min(Math.max(toInteger(req.query.limit, 80), 1), 200);
  const companyId = toInteger(req.mobileUser.companyId, 0);

  if (!companyId) {
    return res.status(400).json({ error: "Tedarikci firma bilgisi bulunamadi." });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("firmaID", sql.Int, companyId)
      .query(`
        SELECT TOP (${limit})
          S.siparisID,
          S.teklifID,
          S.tedarikciID AS siparisTedarikciID,
          S.olusturanFirmaID,
          S.siparisTarihi,
          S.toplamTutar,
          S.kaynakTipi,
          S.durum,
          COALESCE(S.tedarikciID, T.tedarikciID) AS tedarikciID,
          CF.firmaAdi AS ciftciFirmaAdi,
          SK.yemID,
          Y.yemAdi,
          SK.miktarKg,
          SK.birimFiyat
        FROM Siparisler AS S
        LEFT JOIN Teklifler AS T ON S.teklifID = T.teklifID
        INNER JOIN firmalar AS CF ON S.olusturanFirmaID = CF.firmaID
        INNER JOIN SiparisKalemleri AS SK ON S.siparisID = SK.siparisID
        INNER JOIN YemMaddeleri AS Y ON SK.yemID = Y.yemID
        WHERE COALESCE(S.tedarikciID, T.tedarikciID) = @firmaID
        ORDER BY S.siparisTarihi DESC, S.siparisID DESC
      `);

    return res.json({
      items: result.recordset.map((row) => ({
        id: Number(row.siparisID),
        offerId: row.teklifID ? Number(row.teklifID) : undefined,
        title: row.yemAdi,
        farmerCompanyName: row.ciftciFirmaAdi,
        feedId: Number(row.yemID),
        feedName: row.yemAdi,
        amountKg: toNumber(row.miktarKg, 0),
        unitPrice: toNumber(row.birimFiyat, 0),
        totalAmount: toNumber(row.toplamTutar, 0),
        date: isoDate(row.siparisTarihi),
        status: row.durum,
        statusName: orderStatusName(row.durum),
        sourceType: row.kaynakTipi || undefined,
        canApprove: row.durum === "b",
        canReject: row.durum === "b",
      })),
    });
  } catch (error) {
    return serverError(res, error, "Mobile supplier orders failed:");
  }
};

exports.supplierOrderAction = async (req, res) => {
  if (!ensureRole(req, res, ROLE_SUPPLIER)) {
    return undefined;
  }

  const orderId = toInteger(req.params.orderId, 0);
  const companyId = toInteger(req.mobileUser.companyId, 0);
  const userId = toInteger(req.mobileUser.id, 0);
  const action = cleanString(req.body?.action).toLowerCase();

  if (!orderId || !companyId || !userId) {
    return res.status(400).json({ error: "Siparis veya tedarikci bilgisi gecersiz." });
  }

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "Aksiyon approve veya reject olmali." });
  }

  let transaction;

  try {
    const pool = await poolPromise;

    if (action === "approve") {
      const orderResult = await pool
        .request()
        .input("orderId", sql.Int, orderId)
        .input("firmaID", sql.Int, companyId)
        .query(`
          SELECT S.siparisID, S.durum
          FROM Siparisler AS S
          LEFT JOIN Teklifler AS T ON S.teklifID = T.teklifID
          WHERE S.siparisID = @orderId
            AND COALESCE(S.tedarikciID, T.tedarikciID) = @firmaID
        `);

      const order = orderResult.recordset[0];

      if (!order) {
        return res.status(404).json({ error: "Siparis bulunamadi." });
      }

      if (order.durum !== "b") {
        return res.status(400).json({ error: "Siparis onaylanabilir durumda degil." });
      }

      await pool
        .request()
        .input("siparisID", sql.Int, orderId)
        .input("yeniDurum", sql.Char(1), "o")
        .input("yapanKullaniciID", sql.Int, userId)
        .execute("sp_SiparisDurumGuncelle");

      return res.json({ message: "Siparis onaylandi." });
    }

    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const orderResult = await transaction
      .request()
      .input("orderId", sql.Int, orderId)
      .input("firmaID", sql.Int, companyId)
      .query(`
        SELECT
          S.siparisID,
          S.durum AS siparisDurum,
          S.teklifID,
          T.teklifMiktarKg,
          T.ihaleID,
          I.durum AS ihaleDurum,
          I.ihaleBitisTarihi
        FROM Siparisler AS S
        LEFT JOIN Teklifler AS T ON S.teklifID = T.teklifID
        LEFT JOIN Ihaleler AS I ON T.ihaleID = I.ihaleID
        WHERE S.siparisID = @orderId
          AND COALESCE(S.tedarikciID, T.tedarikciID) = @firmaID
      `);

    const order = orderResult.recordset[0];

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: "Siparis bulunamadi." });
    }

    if (order.siparisDurum !== "b") {
      await transaction.rollback();
      return res.status(400).json({ error: "Siparis reddedilebilir durumda degil." });
    }

    await transaction
      .request()
      .input("siparisID", sql.Int, orderId)
      .input("yeniDurum", sql.Char(1), "r")
      .input("yapanKullaniciID", sql.Int, userId)
      .execute("sp_SiparisDurumGuncelle");

    if (order.teklifID) {
      await transaction
        .request()
        .input("offerId", sql.Int, order.teklifID)
        .query(`
          UPDATE Teklifler
          SET durum = 'r'
          WHERE teklifID = @offerId
        `);

      await transaction
        .request()
        .input("auctionId", sql.Int, order.ihaleID)
        .input("amountKg", sql.Decimal(12, 2), order.teklifMiktarKg)
        .query(`
          UPDATE IhaleKalemleri
          SET kalanMiktarKg = kalanMiktarKg + @amountKg
          WHERE ihaleID = @auctionId
        `);

      if (order.ihaleDurum === "t" && order.ihaleBitisTarihi && new Date(order.ihaleBitisTarihi).getTime() >= Date.now()) {
        await transaction
          .request()
          .input("auctionId", sql.Int, order.ihaleID)
          .query(`
            UPDATE Ihaleler
            SET durum = 'a'
            WHERE ihaleID = @auctionId
          `);
      }
    }

    await transaction.commit();
    return res.json({ message: "Siparis reddedildi." });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch {
        // Transaction may already be closed.
      }
    }

    return serverError(res, error, "Mobile supplier order action failed:");
  }
};

exports.supplierOffers = async (req, res) => {
  if (!ensureRole(req, res, ROLE_SUPPLIER)) {
    return undefined;
  }

  const limit = Math.min(Math.max(toInteger(req.query.limit, 80), 1), 200);
  const companyId = toInteger(req.mobileUser.companyId, 0);

  if (!companyId) {
    return res.status(400).json({ error: "Tedarikci firma bilgisi bulunamadi." });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("firmaID", sql.Int, companyId)
      .query(`
        SELECT TOP (${limit})
          T.teklifID,
          T.ihaleID,
          T.tedarikciID,
          T.teklifMiktarKg,
          T.birimFiyat,
          T.toplamTutar,
          T.teklifTarihi,
          T.durum,
          I.ihaleAdi,
          I.ihaleBaslangicTarihi,
          I.ihaleBitisTarihi,
          I.durum AS ihaleDurum,
          K.yemID,
          Y.yemAdi,
          K.talepMiktarKg,
          K.kalanMiktarKg
        FROM Teklifler AS T
        INNER JOIN Ihaleler AS I ON T.ihaleID = I.ihaleID
        INNER JOIN IhaleKalemleri AS K ON I.ihaleID = K.ihaleID
        INNER JOIN YemMaddeleri AS Y ON K.yemID = Y.yemID
        WHERE T.tedarikciID = @firmaID
        ORDER BY T.teklifTarihi DESC, T.teklifID DESC
      `);

    return res.json({
      items: result.recordset.map((row) => ({
        id: Number(row.teklifID),
        auctionId: Number(row.ihaleID),
        title: row.ihaleAdi,
        feedId: Number(row.yemID),
        feedName: row.yemAdi,
        amountKg: toNumber(row.teklifMiktarKg, 0),
        unitPrice: toNumber(row.birimFiyat, 0),
        totalAmount: toNumber(row.toplamTutar, 0),
        date: isoDate(row.teklifTarihi),
        status: row.durum,
        statusName: offerStatusName(row.durum),
        auctionStatus: row.ihaleDurum,
        auctionStatusName: auctionStatusName(row.ihaleDurum),
        auctionStartsAt: isoDate(row.ihaleBaslangicTarihi),
        auctionEndsAt: isoDate(row.ihaleBitisTarihi),
        requestedKg: toNumber(row.talepMiktarKg, 0),
        remainingKg: toNumber(row.kalanMiktarKg, 0),
        canWithdraw: row.durum === "b",
      })),
    });
  } catch (error) {
    return serverError(res, error, "Mobile supplier offers failed:");
  }
};

exports.supplierOfferAction = async (req, res) => {
  if (!ensureRole(req, res, ROLE_SUPPLIER)) {
    return undefined;
  }

  const offerId = toInteger(req.params.offerId, 0);
  const companyId = toInteger(req.mobileUser.companyId, 0);
  const userId = toInteger(req.mobileUser.id, 0);
  const action = cleanString(req.body?.action).toLowerCase();

  if (!offerId || !companyId) {
    return res.status(400).json({ error: "Teklif veya tedarikci bilgisi gecersiz." });
  }

  if (action !== "withdraw") {
    return res.status(400).json({ error: "Teklif icin gecerli aksiyon withdraw." });
  }

  let transaction;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const offerResult = await transaction
      .request()
      .input("offerId", sql.Int, offerId)
      .input("firmaID", sql.Int, companyId)
      .query(`
        SELECT teklifID, ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, durum
        FROM Teklifler
        WHERE teklifID = @offerId AND tedarikciID = @firmaID
      `);

    const offer = offerResult.recordset[0];

    if (!offer) {
      await transaction.rollback();
      return res.status(404).json({ error: "Teklif bulunamadi." });
    }

    if (offer.durum !== "b") {
      await transaction.rollback();
      return res.status(400).json({ error: "Teklif geri cekilebilir durumda degil." });
    }

    await transaction
      .request()
      .input("offerId", sql.Int, offerId)
      .query(`
        UPDATE Teklifler
        SET durum = 'c'
        WHERE teklifID = @offerId
      `);

    await transaction
      .request()
      .input("offerId", sql.Int, offerId)
      .input("auctionId", sql.Int, offer.ihaleID)
      .input("firmaID", sql.Int, offer.tedarikciID)
      .input("oldStatus", sql.Char(1), offer.durum)
      .input("userId", sql.Int, userId || null)
      .input("amountKg", sql.Decimal(12, 2), offer.teklifMiktarKg)
      .input("unitPrice", sql.Decimal(10, 2), offer.birimFiyat)
      .input("totalAmount", sql.Decimal(14, 2), offer.toplamTutar)
      .query(`
        INSERT INTO TeklifAksiyonLog (
          teklifID, ihaleID, tedarikciID, aksiyonTipi, eskiDurum, yeniDurum,
          teklifMiktarKg, birimFiyat, toplamTutar, yapanKullaniciID, aciklama
        )
        VALUES (
          @offerId, @auctionId, @firmaID, N'cek', @oldStatus, 'c',
          @amountKg, @unitPrice, @totalAmount, @userId, N'Teklif geri cekildi'
        )
      `);

    await transaction.commit();
    return res.json({ message: "Teklif geri cekildi." });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch {
        // Transaction may already be closed.
      }
    }

    return serverError(res, error, "Mobile supplier offer action failed:");
  }
};
