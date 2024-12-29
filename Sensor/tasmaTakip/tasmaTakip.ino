#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

#define LM35_PIN A0       // LM35 sıcaklık sensörü analog pini
#define RED_LED D3        // Kırmızı LED pini
#define GREEN_LED D2 

// WiFi ayarları
const char* ssid = "Redmi";        // WiFi SSID
const char* password = "ankara06"; // WiFi şifre
const char* onlineUrl = "https://confoni.com/sensor/aktif"; // Veri gönderim URL'si
const char* serverUrl = "https://confoni.com/sensor/veri"; // Veri gönderim URL'si
const char* SensorQR = "123456789";

void setup() {
  Serial.begin(115200);

  // LED pin ayarı
  pinMode(RED_LED, OUTPUT);
  digitalWrite(RED_LED, LOW); // LED başta kapalı
  pinMode(GREEN_LED, OUTPUT);
  digitalWrite(GREEN_LED, LOW);
  // WiFi bağlantısı
  connectToWiFi();
  sendOnlineStaus();
}

void loop() {
  // Sıcaklık değerini oku
  float temperature = readTemperature();

  // Sunucuya veri gönder
  String response = sendSensorData(temperature);

  // Yanıta göre LED durumunu güncelle
  updateLEDStatusFromResponse(response);

  delay(2000); // Döngü gecikmesi
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

// LM35 sıcaklık sensöründen değer okuma
float readTemperature() {
  int analogValue = analogRead(LM35_PIN);
  float voltage = analogValue * (3.3 / 1023.0); // ADC'yi gerilime dönüştür
  float temperature = voltage * 100;           // Gerilimden sıcaklık hesapla (°C)
  Serial.println("Sıcaklık: " + String(temperature) + " °C");
  return temperature;
}

// Sunucuya veri gönder ve yanıt al
String sendSensorData(float temperature) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client; // HTTPS için WiFiClientSecure kullanımı
    client.setInsecure();    // Test amaçlı sertifika doğrulama kapalı
    HTTPClient http;
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS); // Yönlendirme takibi
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    // JSON veri oluştur
    String jsonData = "{\"SensorQR\":"+String(SensorQR)+",\"Sıcaklık\":" + String(temperature) + "}";

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


// Yanıt üzerinden LED durumunu güncelle
void updateLEDStatusFromResponse(String response) {
  if (response.indexOf("Düşük") != -1) {
    digitalWrite(RED_LED, HIGH);
    delay(1000);
    digitalWrite(RED_LED, LOW);
  } else if (response.indexOf("Sıcak") != -1) {
    blinkLED(1, 500);
  } else if (response.indexOf("Yüksek") != -1) {
    blinkLED(2, 250);
  } else if (response.indexOf("Tehlikeli") != -1) {
    blinkLED(5, 100);
  }else{
    delay(1000);
  }
}

// LED yanıp sönme fonksiyonu
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(RED_LED, HIGH);
    delay(delayMs);
    digitalWrite(RED_LED, LOW);
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

void indicateFailure() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED, HIGH);
    delay(300);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, LOW);
    delay(300);
  }
}
