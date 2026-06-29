# LaktaSense Mobile

## Guncel entegrasyon
- Mobil uygulama artik `/api/mobile` endpointleriyle calisir.
- Demo rol butonlari ve mock fallback akislari kaldirildi; backend hatalari ekranda gorunur.
- Auth: `POST /api/mobile/login`, `GET /api/mobile/me`.
- Dashboard: `GET /api/mobile/dashboard`.
- QR: `POST /api/mobile/qr/scan`.
- Sagim is emri: `POST /api/mobile/milking-jobs`, `GET /api/mobile/milking-jobs/:jobId`, `POST /api/mobile/milking-jobs/:jobId/cancel`.
- NodeMCU sensor: `POST /api/mobile/sensor/online`, `GET|POST /api/mobile/sensor/jobs/active`, `POST /api/mobile/sensor/measurements`.
- Sensor ornek kodu: `Sensor/sagimSensor/sagimSensor.ino`.
- Sut sonucu: `GET /api/mobile/cows/:cowId/milk-values`.
- AI onerileri: `GET /api/mobile/cows/:cowId/ai-suggestions`.
- Not: Mevcut DB semasinda sut hacmi ve olcum tarihi gercek kayittir; yag/protein/SCC/sicaklik kolonlari olmadigi icin backend bunlari hesaplanan kalite sinyali olarak isaretler.

## Uygulama durumu
- Expo TypeScript projesi oluşturuldu.
- Auth/session akışı, rol bazlı dashboard, QR tarama, süt sonucu, AI önerileri ve profil ekranları eklendi.
- Mobil auth ve veri akislari `API/routers/mobile.js` altindaki `/api/mobile` endpointleriyle calisir.
- Backend kapaliysa uygulama demo veriye dusmez; kullaniciya net API hatasi gosterir.

## Çalıştırma
```bash
cd UI/Mobile
npm install
npm run start
```

Web önizleme:
```bash
npm run web
```

LAN üzerindeki gerçek API için `.env` dosyasında şu değer kullanılmalı:
```bash
EXPO_PUBLIC_API_URL=http://<BILGISAYAR_LAN_IP>:3030
```

## API ulasilamadi hatasi
- Web onizlemede API adresi otomatik `http://localhost:3030` olur.
- Expo Go / fiziksel cihazda uygulama Metro sunucusunun IP adresini okuyup API'yi `http://<BILGISAYAR_LAN_IP>:3030` olarak kurar.
- Android emulator fallback adresi `http://10.0.2.2:3030`.
- Gerekirse `UI/Mobile/.env.local` icine `EXPO_PUBLIC_API_URL=http://10.22.219.219:3030` yazip Expo sunucusunu yeniden baslat.

## Amaç
Bu dosya, `UI/Mobile` klasöründe Expo ile yazılacak mobil uygulama için Codex'e verilecek en detaylı görev tanımıdır.
Uygulama, mevcut web uygulamasının sade ve premium bir mobil versiyonu olacak.
Backend hâlâ MSSQL tabanlı olacak; mobil uygulama sadece `API` katmanını kullanacak.

## Proje Hedefleri
- Expo managed workflow ile React Native mobil uygulama oluşturmak.
- Kullanıcı rolleri: `çiftçi`, `tedarikçi`, `admin`.
- Login / auth token yönetimi.
- QR tarama ve eşleme işlemleri.
- İnek sağımı sonrası süt değerleri ekranı.
- AI öneri kartlarının gösterilmesi.
- Modern, sade ve premium Luigi paletli tasarım.

## Neden `UI/Mobile`?
- `UI/LaktaSense` web uygulamasının bağımsız bir mobil sürümü için doğru yer.
- Hem mobil hem web UI kodu ayrı tutulmuş olur.
- Burada sadece mobil için Expo/React Native kodu yer alacak.

## Mevcut repo ile entegrasyon
Bu mobil uygulama, backend olarak `API` dizinindeki Node.js/MSSQL sunucusunu kullanacak.
Mobil uygulama doğrudan MSSQL'e bağlanmayacak.
Mevcut API katmanını kullanarak kullanıcı doğrulama ve veri sorguları yapılacak.

### Varolan proje öğeleri
- `UI/LaktaSense`: Web uygulaması için React + Vite + Mantine tabanlı UI.
- `API/`: Node.js + `mssql` ile MSSQL bağlantısı, halihazırda kullanıcı/firmalar/admin/sorgular var.
- `UI/Template`: benzer yapıda başka bir web template, ancak mobil için kullanılmayacak.

## Gerekli teknoloji yığını
1. Expo managed app
   - `npx create-expo-app@latest UI/Mobile --template blank-typescript`
2. React Native Navigation
   - `@react-navigation/native`
   - `@react-navigation/native-stack`
   - `react-native-safe-area-context`
   - `react-native-screens`
3. QR / barkod tarama
   - `expo-camera`
4. Güvenli depolama
   - `expo-secure-store`
5. HTTP istekleri
   - `axios`
6. İkonlar
   - `@expo/vector-icons`
7. Tasarım ve stil
   - Öneri: `react-native-paper` veya `nativewind`
   - Minimum: React Native stil objeleri ve küçük helper bileşenler

## UI/Mobile klasör yapısı önerisi
```
UI/Mobile/
  README.md
  app.json
  package.json
  tsconfig.json
  babel.config.js
  App.tsx
  src/
    api/
      client.ts
      auth.ts
      cows.ts
      qr.ts
      suggestions.ts
    screens/
      Auth/LoginScreen.tsx
      Dashboard/DashboardScreen.tsx
      QR/QRScannerScreen.tsx
      Milk/MilkResultScreen.tsx
      Suggestions/AISuggestionsScreen.tsx
      Profile/ProfileScreen.tsx
    navigation/
      AppNavigator.tsx
      AuthNavigator.tsx
      MainNavigator.tsx
    components/
      ui/
        PremiumCard.tsx
        Header.tsx
        Button.tsx
        RoleBadge.tsx
      forms/
        LoginForm.tsx
    theme/
      colors.ts
      typography.ts
      spacing.ts
    hooks/
      useAuth.ts
      useRoleRedirect.ts
```

## Adım adım görev listesi
### 1. Expo projesini oluştur
- `npx create-expo-app@latest UI/Mobile --template blank-typescript`
- `cd UI/Mobile`
- `npm install` veya `yarn install`
- `npx expo install react-native-safe-area-context react-native-screens expo-camera expo-secure-store @expo/vector-icons`
- `npm install @react-navigation/native @react-navigation/native-stack axios`
- (Opsiyonel) `npm install react-native-paper`
- Not: `UI/Mobile` içinde bu README bulunduğu için scaffold sırasında dosya korunmalı. Gerekirse Expo projesi geçici bir klasörde oluşturulup üretilen dosyalar `UI/Mobile` altına taşınmalı.

### 2. Temel navigasyonu kur
- `App.tsx` içinde `NavigationContainer` kullan.
- Auth olmayan kullanıcılar için `AuthNavigator`.
- Login sonrası `MainNavigator`.
- Rollere göre `DashboardScreen` içinde farklı panel göster.

### 3. Auth / Login ekranını yaz
- Email / şifre veya kullanıcı adı + şifre alanları.
- Giriş yap butonu.
- `expo-secure-store` ile token saklama.
- `api/auth.ts` içinde `login` fonksiyonu.
- `AuthContext` veya `useAuth` hook ile kullanıcı bilgilerini yönet.
- Login başarılıysa rolüne göre sayfaya yönlendir.
- Mevcut web login akışı `POST /api/login/giris` kullanıyor ve body alanları `{ email, şifre }`.
- Mevcut API yanıtında JWT token yok; mobil MVP için önce mevcut user objesiyle oturum tutulacaksa README'deki token hedefi "backend işi" olarak işaretlenmeli.

### 4. API istemcisi yaz
- `src/api/client.ts`:
  - Base URL `http://<API_HOST>:<PORT>`.
  - `axios` interceptor ile auth header ekle.
- `src/api/auth.ts`:
  - `login({email, password})`
  - `getProfile()`
- `src/api/qr.ts`:
  - `scanQr(code)`
- `src/api/cows.ts`:
  - `getMilkValues(cowId)`
- `src/api/suggestions.ts`:
  - `getAISuggestions(cowId)`

### 5. Role bazlı yönlendirme
- `admin`, `çiftçi`, `tedarikçi` rolleri desteklenecek.
- `DashboardScreen` rolüne göre farklı kartlar gösterir.
- Mevcut web uygulamasında roller metin olarak değil kod olarak geliyor: `a` = admin, `c` = çiftçi, `t` = tedarikçi.
- Örneğin:
  - `admin`: onaylanacak başvurular, firma istatistikleri
  - `çiftçi`: sağım sonuçları, AI öneriler, QR eşleme
  - `tedarikçi`: siparişler, teslimat QR’ları, stok durumu

### 6. QR tarama ekranı
- `expo-camera` içinde `CameraView` ve `onBarcodeScanned` kullan.
- Ekranda kamera izni iste.
- QR tarandığında `src/api/qr.ts` üzerinden backend’e gönder.
- QR yanıtında eşlenen hayvan bilgisi veya işlem sonucu göster.
- Basit bir sonuç kartı oluştur.
- Backend tarafında şu an doğrudan `POST /qr/scan` benzeri bir endpoint görünmüyor; `inekQR` alanı var ama QR okuma/eşleme kontratı ayrıca netleştirilmeli.

### 7. Milk Result ekranı
- `MilkResultScreen` içinde şu alanları göster:
  - Süt hacmi (liters)
  - Yağ oranı (% veya g)
  - Protein oranı
  - SCC (Somatik Hücre Sayısı)
  - Süt sıcaklığı
  - Tarih / saat
- Backend çağrısı `GET /cows/:cowId/milk-values`
- Backend hazir degilse mock veri gosterme; API hatasini net bir durum kartiyla goster.

### 8. AI Suggestions ekranı
- `AISuggestionsScreen` veya `Dashboard` içinde küçük öneri kartları.
- Öneri kartları backend’den alınabilir veya şimdilik sabit veriyle gösterilebilir.
- Kart örnekleri:
  - "İnek A için aşılama zamanı yaklaşmış"
  - "Son sağım verisi yüksek yağ oranı gösteriyor"
  - "Verilen yem değişikliği önerisi"

### 9. Premium görsel stil
- Renk paleti:
  - Koyu mor / menekşe fon
  - Zengin yeşil vurgular
  - Altın / krem aksanlar
  - Beyaz metin bu tonlarla kontrastlı
- UI öğeleri:
  - Yumuşak gölgeler
  - Kartlar, yuvarlak kenarlar
  - Düz ama zengin gradient veya blur efekt
  - Modern tipografi ve okunabilir başlıklar

### 10. Önceliklendirme
1. `Login` + rol ayrımı + auth token
2. `App` navigasyonu ve dashboard
3. QR tarama ekranı
4. Süt değerleri ekranı
5. AI öneri kartları
6. Profil / ayarlar

## Backend API önerisi
Mobil uygulama için aşağıdaki uç noktalar gerekiyor:

- `POST /login`
  - Request: `{ email, password }`
  - Response: `{ token, user: { id, name, role, email } }`
- `GET /me`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ id, name, role, email, farm }`
- `POST /qr/scan`
  - Request: `{ code }`
  - Response: `{ type, targetId, message, cowId, info }`
- `GET /cows/:cowId/milk-values`
  - Response: `{ liters, fat, protein, scc, temperature, timestamp }`
- `GET /cows/:cowId/ai-suggestions`
  - Response: `[{ id, title, description, severity }]`

> Not: API zaten `API` dizininde var; mobil için bu uç noktaları benzer bir kontrolörle eklemek en temiz yol.

## Kontrol notları / eksikler
- `UI/Mobile` şu anda sadece bu README'yi içeriyor; Expo projesi henüz oluşturulmamış.
- API tabanı mevcut sunucuda `http://localhost:3030` ve route'lar `/api/...` altında. Mobil cihazdan testte `localhost` bilgisayarı değil cihazı göstereceği için `.env` içinde LAN IP desteklenmeli.
- Auth kontrati mobil icin standardize edildi: `POST /api/mobile/login`, `GET /api/mobile/me`, Bearer token ve session restore kullanilir.
- Şifre alanı mevcut backend'de Türkçe property ile geliyor: `{ email, şifre }`. Mobil tarafta `password` alanı `api/auth.ts` içinde bu property'ye map edilmeli veya backend standardize edilmeli.
- Rol kontratı netleştirilmeli: UI metinleri `admin / çiftçi / tedarikçi`, backend kodları `a / c / t`.
- `GET /api/mobile/me` eklendi; uygulama acilisinda token ile kullanici bilgisi tazelenir.
- QR esleme endpoint'i eklendi: `POST /api/mobile/qr/scan`, `inek.inekQR` ve `SHIP-1` formatli sevkiyat kodlarini kontrol eder.
- Süt kalite ekranı README'de hacim, yağ, protein, SCC ve sıcaklık istiyor. Mevcut `postSagim` daha çok sağım döngüsündeki inekleri listeliyor; gerçek süt ölçüm tablosu/kolonları ve endpoint'i doğrulanmalı.
- AI onerileri mobilde canli DB sinyallerinden uretilir: `GET /api/mobile/cows/:cowId/ai-suggestions`.
- Backend güvenliği yol haritasına eklenmeli: parola şu an düz karşılaştırılıyor, JWT/session ve parola hashleme ayrı backend işi olarak planlanmalı.
- Test kabul kriterleri guncellendi: login, rol yonlendirme, session restore, API hata kartlari, QR izin reddi, QR basarili/basarisiz sonuc ve mobil cihazda LAN API erisimi kontrol edilmeli.
- Tasarım kısmında "Luigi paleti" iyi bir yön veriyor; renk tokenları, spacing, typography ve component state'leri `src/theme` altında net isimlerle sabitlenmeli.

## Codex / otomatik üretim için kullanabileceğin son derece detaylı prompt
```
You are building a LaktaSense mobile app in the existing repository under `UI/Mobile`.
Create a new Expo managed app with TypeScript and React Navigation.
Do not modify `UI/LaktaSense`; create everything under `UI/Mobile`.
Use a premium Luigi-inspired theme: dark purple background, emerald accent color, soft gold highlights, white text, and subtle cards.
Implement the following screens and features in order:

1. Login screen
   - Email / password fields
   - Login button
   - Role-based redirect after success (farmer, supplier, admin)
   - Use `expo-secure-store` to save the JWT token securely
2. Navigation and auth flow
   - Auth stack for login
   - Main app stack for authenticated users
   - Keep user session with a hook or context
3. Dashboard screen
   - Show role-based content panels
   - Farmer dashboard: milk result access, AI suggestions summary, QR scanner shortcut
   - Supplier dashboard: order and QR action shortcuts
   - Admin dashboard: approval/status cards
4. QR Scanner screen
   - Use `expo-camera`
   - Request camera permission
   - When scan completes, call a backend API function and show the result
5. Milk Result screen
   - Display milk values: liters, fat, protein, SCC, temperature, timestamp
   - Use a card layout and premium styling
6. AI Suggestions section
   - Show a list of suggestion cards with title and description
   - Each card should feel like a recommendation panel

Use `axios` to call backend APIs.
Create a reusable API client in `src/api/client.ts`.
Create endpoints in `src/api/auth.ts`, `src/api/qr.ts`, `src/api/cows.ts`, and `src/api/suggestions.ts`.
Write a simple theme file in `src/theme/colors.ts`.
Use basic reusable components in `src/components/ui` for cards and buttons.
Keep the app minimal, clean, and premium-looking.

Do not use mock responses in the production mobile flow; missing backend endpoints should surface a clear API error.
```

## Nasıl verilmeli?
- Bu dosyayı Codex’e ver.
- `UI/Mobile` içinde önce Expo scaffold oluşturmasını iste.
- Adımları tek tek takip ettir:
  1. proje oluştur
  2. paketleri yükle
  3. navigasyon + auth
  4. login ekranı
  5. QR ekranı
  6. milk ekranı
  7. AI öneri kartları

## Sonuç
Bu readme, Codex’in mobil uygulamayı adım adım kurması ve öncelikli ekranları inşa etmesi için yeterli ayrıntıyı içerir.
Hedef: hızlı bir MVP, sade ama premium görünümlü bir mobil uygulama.
