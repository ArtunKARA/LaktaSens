#include <SoftwareSerial.h>
#include <DHT.h>  // DHT kütüphanesi

#define DHTPIN 7         // DHT sensör pin numarası
#define DHTTYPE DHT11    // DHT sensör tipi (DHT11)
#define MQ2pin A0        // MQ2 gaz sensörü analog pini
#define GREEN_LED 13     // Yeşil LED pini (WiFi durumu için)
#define Threshold 400    // Gaz sensörü eşik değeri

// ESP8266 bağlantı pinleri
#define ESP_RX 2         // Arduino RX
#define ESP_TX 3         // Arduino TX

// WiFi ayarları
const char* ssid = "*";       // WiFi SSID (Türkçe karakter kaldırıldı)
const char* password = "*";         // WiFi şifre

// Yazılımsal seri iletişim
SoftwareSerial espSerial(ESP_RX, ESP_TX);
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  // Seri iletişim
  Serial.begin(9600);         // Bilgisayar ile iletişim
  espSerial.begin(115200);    // ESP8266 ile iletişim

  // Pin ayarları
  pinMode(GREEN_LED, OUTPUT);
  pinMode(10, OUTPUT);  // LED çıkış pinleri
  pinMode(11, OUTPUT);
  pinMode(12, OUTPUT);

  // DHT sensör başlat
  dht.begin();

  // WiFi bağlantısı
  connectToWiFi();
}

void loop() {
  // Yeşil LED: Bağlı kalındığını göstermek için sürekli açık
  digitalWrite(GREEN_LED, HIGH);

  // DHT sensör verileri
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Sensör hatasını kontrol et
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT sensör okuma hatası!");
    return;
  }

  // Sensör verilerini yazdır
  Serial.print("Sıcaklık: ");
  Serial.print(temperature);
  Serial.println("°C");
  Serial.print("Nem: ");
  Serial.print(humidity);
  Serial.println("%");

  // MQ2 sensör verisi
  int mq2Value = analogRead(MQ2pin);
  Serial.print("MQ2 Sensör Değeri: ");
  Serial.println(mq2Value);

  // Gaz algılama
  if (mq2Value > Threshold) {
    Serial.println("Duman algılandı!");
    digitalWrite(10, HIGH);
    digitalWrite(11, HIGH);
    digitalWrite(12, HIGH);
  } else {
    digitalWrite(10, LOW);
    digitalWrite(11, LOW);
    digitalWrite(12, LOW);
  }

  delay(2000); // Döngü arası gecikme
}

// WiFi ağına bağlanma
void connectToWiFi() {
  Serial.println("WiFi ağına bağlanılıyor...");
  espSerial.println("AT"); // ESP8266 ile bağlantıyı test et
  delay(500);

  // WiFi bağlantısını kur
  String cmd = "AT+CWJAP=\"" + String(ssid) + "\",\"" + String(password) + "\"";
  espSerial.println(cmd);
  delay(5000); // Bağlantı süresi

  // Bağlantı durumunu kontrol et
  if (espSerial.available()) {
    String response = espSerial.readString();
    Serial.println("ESP8266 Yanıtı: " + response);

    if (response.indexOf("OK") != -1) {
      Serial.println("WiFi'ye başarıyla bağlanıldı!");
      digitalWrite(GREEN_LED, HIGH); // Bağlıysa yeşil LED açık
    } else {
      Serial.println("WiFi bağlantısı başarısız!");
      digitalWrite(GREEN_LED, LOW); // Bağlanamazsa yeşil LED kapalı
  }
 }
}