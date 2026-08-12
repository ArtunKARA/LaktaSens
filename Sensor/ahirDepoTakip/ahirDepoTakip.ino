#include <DHT.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// DHT11 sensör pin ve tür tanımları
#define DHTPIN D4 // NodeMCU D4 pinine bağlı (GPIO2)
#define DHTTYPE DHT11 // DHT11 sensör kullanılıyor
#define MQ2pin A0  // MQ2 gaz sensörü analog pini
#define GREEN_LED D0     // Yeşil LED pini (WiFi durumu için)
#define RED_LED1 D1      // Kırmızı LED 1
#define RED_LED2 D2      // Kırmızı LED 2
#define RED_LED3 D3      // Kırmızı LED 3
float mq2Value;

// WiFi ayarları
#include "arduino_secrets.h"

const char* ssid = SECRET_SSID;
const char* password = SECRET_PASSWORD;
const char* serverUrl = "https://confoni.com/sensor/veri"; // Veri gönderim URL'si
const char* onlineUrl = "https://confoni.com/sensor/aktif"; // online gönderim URL'si
const char* SensorQR = "KdhMgxl43GqVVJ6w";

WiFiClient client;
// DHT nesnesi oluşturma
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200); // Seri haberleşme başlatılıyor
  dht.begin();          // DHT sensörü başlatılıyor
  Serial.println("DHT11 ile Sıcaklık ve Nem Ölçümü");
  // Pin ayarları
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED1, OUTPUT);
  pinMode(RED_LED2, OUTPUT);
  pinMode(RED_LED3, OUTPUT);

  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED1, LOW);
  digitalWrite(RED_LED2, LOW);
  digitalWrite(RED_LED3, LOW);
  delay(200);
  digitalWrite(GREEN_LED, HIGH);
  digitalWrite(RED_LED1, HIGH);
  digitalWrite(RED_LED2, HIGH);
  digitalWrite(RED_LED3, HIGH);
  delay(1000);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED1, LOW);
  digitalWrite(RED_LED2, LOW);
  digitalWrite(RED_LED3, LOW);

  // WiFi bağlantısı
  connectToWiFi();
  sendOnlineStaus();
}

void loop() {

  // Sensörden sıcaklık ve nem değerlerini okuma
  float nem = dht.readHumidity();
  float sicaklik = dht.readTemperature();

  // Sensörden okuma hatası kontrolü
  if (isnan(nem) || isnan(sicaklik)) {
    Serial.println("Sensörden veri alınamadı! Lütfen bağlantıları kontrol edin.");
    return;
  }
  mq2Value = analogRead(MQ2pin);
  Serial.print("Sensor Value: ");
  Serial.print(mq2Value);
  
  if(mq2Value > 400)
  {
    Serial.print(" | Smoke detected!");
  }
  
  Serial.println("");
  // Ölçülen değerleri seri monitörde görüntüleme
  Serial.print("Nem: ");
  Serial.print(nem);
  Serial.println(" %");

  Serial.print("Sıcaklık: ");
  Serial.print(sicaklik);
  Serial.println(" °C");

  // Verileri sunucuya gönder ve yanıt al
  String response = sendSensorData(sicaklik, nem, mq2Value);

  // Yanıt üzerinden LED durumunu güncelle
  updateLEDStatusFromResponse(response);
}

// WiFi ağına bağlanma
void connectToWiFi() {
  Serial.println("WiFi ağına bağlanılıyor...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    blinkLEDGreen(1,500);
    Serial.print(".");
  }

  digitalWrite(GREEN_LED, HIGH);
  Serial.println("\nWiFi'ye başarıyla bağlanıldı!");
}

// Sunucuya veri gönder ve yanıt al
String sendSensorData(float temperature, float humidity, int mq2Value) {
if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client; // HTTPS için WiFiClientSecure kullanımı
    client.setInsecure();    // Test amaçlı sertifika doğrulama kapalı
    HTTPClient http;
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS); // Yönlendirme takibi
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonData = "{";
      jsonData += "\"SensorQR\":\"" + String(SensorQR) + "\",";
      jsonData += "\"Sıcaklık\":" + String(temperature) + ",";
      jsonData += "\"Nem\":" + String(humidity) + ",";
      jsonData += "\"Gaz\":" + String(mq2Value);
      jsonData += "}";

    // POST isteği gönder
    int httpResponseCode = http.POST(jsonData);
    if (httpResponseCode > 0) {
      Serial.println("HTTP Yanıt Kodu: " + String(httpResponseCode));
      String response = http.getString();
      Serial.println("Sunucu yanıtı: " + response);
      http.end();
      return response;
    } else {
      Serial.println("HTTP isteği başarısız! Hata: " + String(httpResponseCode));
      Serial.println("Muhtemel hata: " + http.errorToString(httpResponseCode));
      http.end();
      return "";
    }
  } else {
    indicateFailure();
    Serial.println("WiFi bağlantısı yok!");
    return "";
  }
}

String sendOnlineStaus() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client; // HTTPS için WiFiClientSecure kullanımı
    client.setInsecure();    // Test amaçlı sertifika doğrulama kapalı
    HTTPClient http;
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS); // Yönlendirme takibi
    http.begin(client, onlineUrl);
    http.addHeader("Content-Type", "application/json");

    // JSON veri oluştur
    String jsonData = "{\"SensorQR\":"+String(SensorQR)+"}";

    // POST isteği gönder
    int httpResponseCode = http.POST(jsonData);
    if (httpResponseCode > 0) {
      Serial.println("HTTP Yanıt Kodu: " + String(httpResponseCode));
      String response = http.getString();
      Serial.println("Sunucu yanıtı: " + response);
      http.end();
      return response;
    } else {
      Serial.println("HTTP isteği başarısız! Hata: " + String(httpResponseCode));
      Serial.println("Muhtemel hata: " + http.errorToString(httpResponseCode));
      http.end();
      return "";
    }
  } else {
    indicateFailure();
    Serial.println("WiFi bağlantısı yok!");
    return "";
  }
}

// Durum göstergeleri
void indicateSearching() {
  digitalWrite(GREEN_LED, HIGH);
  delay(500);
  digitalWrite(GREEN_LED, LOW);
  delay(500);
}

void indicateConnected() {
  digitalWrite(GREEN_LED, HIGH);
}

void indicateFailure() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(RED_LED1, HIGH);
    digitalWrite(RED_LED2, HIGH);
    digitalWrite(RED_LED3, HIGH);
    delay(300);
    digitalWrite(RED_LED1, LOW);
    digitalWrite(RED_LED2, LOW);
    digitalWrite(RED_LED3, LOW);
    delay(300);
  }
}

// Yanıt üzerinden LED durumunu güncelle
void updateLEDStatusFromResponse(String response) {
  if (response.indexOf("sicaklik\":\"Düşük") != -1) {
    digitalWrite(RED_LED1, HIGH);
    delay(1000);
    digitalWrite(RED_LED1, LOW);
  } else if (response.indexOf("sicaklik\":\"Normal") != -1) {
    blinkLED(RED_LED1, 1, 500);
  } else if (response.indexOf("sicaklik\":\"Yüksek") != -1) {
    blinkLED(RED_LED1, 2, 250);
  } else if (response.indexOf("sicaklik\":\"Tehlikeli") != -1) {
    blinkLED(RED_LED1, 5, 100);
  }

  if (response.indexOf("nem\":\"Düşük") != -1) {
    digitalWrite(RED_LED1, HIGH);
    delay(1000);
    digitalWrite(RED_LED1, LOW);
  } else if (response.indexOf("nem\":\"Yüksek") != -1) {
    blinkLED(RED_LED2, 2, 250);
  } else if (response.indexOf("nem\":\"Tehlikeli") != -1) {
    blinkLED(RED_LED2, 5, 100);
  }

  if (response.indexOf("Gaz\":\"Yok") != -1) {
    delay(1000);
  } else if (response.indexOf("gaz\":\"Var") != -1) {
    blinkLED(RED_LED3, 5, 100);
  }
}

// LED yanıp sönme fonksiyonu
void blinkLED(int ledPin, int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(ledPin, HIGH);
    delay(delayMs);
    digitalWrite(ledPin, LOW);
    delay(delayMs);
  }
}

void blinkLEDGreen(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(GREEN_LED, HIGH);
    delay(delayMs);
    digitalWrite(GREEN_LED, LOW);
    delay(delayMs);
  }
} 
